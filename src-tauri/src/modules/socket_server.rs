
use super::api::window_api::get_all_windows;
use super::response::ApiResponse;
use super::server_api::services::window_service;
use futures_util::{SinkExt, StreamExt};
use serde_json::{Value, json};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio::sync::broadcast::error::RecvError;
use tokio::task;
use tokio_tungstenite::{
    accept_hdr_async,
    tungstenite::Message,
    tungstenite::handshake::server::{Request, Response},
};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum SocketRoute {
    Broadcast,
    WindowResolution(i32),
    Invalid,
}

fn parse_socket_route(path: &str) -> SocketRoute {
    if path == "/" {
        return SocketRoute::Broadcast;
    }

    let segments: Vec<_> = path.trim_matches('/').split('/').collect();

    match segments.as_slice() {
        ["windows", window_id, "resolution"] => {
            let window_id = window_id.strip_prefix("WIN-").unwrap_or(window_id);

            match window_id.parse::<i32>() {
                Ok(window_id) if window_id > 0 => {
                    SocketRoute::WindowResolution(window_id)
                }
                _ => SocketRoute::Invalid,
            }
        }
        _ => SocketRoute::Invalid,
    }
}

// ---------- broadcast channels ----------

static BROADCASTER: OnceLock<broadcast::Sender<String>> = OnceLock::new();

static WINDOW_BROADCASTERS: OnceLock<
    Mutex<HashMap<i32, broadcast::Sender<String>>>,
> = OnceLock::new();

fn broadcaster() -> &'static broadcast::Sender<String> {
    BROADCASTER.get_or_init(|| broadcast::channel(100).0)
}

fn window_broadcaster(
    window_id: i32,
) -> Result<broadcast::Sender<String>, String> {
    let mut broadcasters = WINDOW_BROADCASTERS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .map_err(|error| {
            format!("Failed to access window socket registry: {}", error)
        })?;

    Ok(
        broadcasters
            .entry(window_id)
            .or_insert_with(|| broadcast::channel(100).0)
            .clone(),
    )
}

// ---------- window ID parsing ----------

fn parse_window_id(window_id: &Value) -> Result<i32, String> {
    let window_id = match window_id {
        Value::Number(window_id) => window_id
            .as_i64()
            .and_then(|id| i32::try_from(id).ok())
            .ok_or_else(|| {
                "window_id must be a positive integer".to_string()
            })?,

        Value::String(window_id) => window_id
            .strip_prefix("WIN-")
            .unwrap_or(window_id)
            .parse::<i32>()
            .map_err(|_| {
                "window_id must be an integer or a WIN-### ID".to_string()
            })?,

        _ => {
            return Err(
                "window_id must be an integer or a WIN-### ID".to_string(),
            );
        }
    };

    if window_id <= 0 {
        return Err("window_id must be a positive integer".to_string());
    }

    Ok(window_id)
}

// ---------- message types ----------

pub const MESSAGE_TYPE_RESOLUTION_UPDATE: &str = "resolution_update";

/// Adds a "type" field to the payload.
///
/// Object:
/// { "width": 1920 }
///
/// Becomes:
/// { "type": "resolution_update", "width": 1920 }
///
/// Non-object:
/// 5
///
/// Becomes:
/// { "type": "resolution_update", "value": 5 }
fn with_type(message_type: &str, data: Value) -> Value {
    match data {
        Value::Object(mut map) => {
            map.insert(
                "type".to_string(),
                Value::String(message_type.to_string()),
            );

            Value::Object(map)
        }

        other => json!({
            "type": message_type,
            "value": other
        }),
    }
}

/// Adds the mandatory "is_playlist" field.
///
/// It overrides any existing is_playlist field.
fn with_is_playlist(data: Value, is_playlist: bool) -> Value {
    match data {
        Value::Object(mut map) => {
            map.insert(
                "is_playlist".to_string(),
                Value::Bool(is_playlist),
            );

            Value::Object(map)
        }

        other => json!({
            "is_playlist": is_playlist,
            "value": other
        }),
    }
}

// ---------- global broadcast functions ----------

/// Sends a text message to every connected WebSocket client.
///
/// Returns the number of connected clients that received it.
pub fn send_to_all(message: String) -> usize {
    broadcaster().send(message).unwrap_or(0)
}

/// Sends a message with a title and data to every connected client.
pub fn send_response_to_all(title: &str, data: Value) -> usize {
    let response = ApiResponse::success(title, data).to_json();

    send_to_all(response)
}

// ---------- Tauri commands ----------

/// Sends a message to all connected WebSocket clients.
///
/// Frontend:
/// invoke("send_to_clients", {
///     message: { ... }
/// })
#[tauri::command]
pub fn send_to_clients(message: Value) -> Result<usize, String> {
    Ok(send_response_to_all("Data from app", message))
}

/// Sends a typed message only to clients connected to a specific window.
///
/// Frontend:
///
/// invoke("send_message", {
///     message: { width: 1920, height: 1080 },
///     windowId: 1,
///     isPlaylist: false,
///     messageType: "resolution_update"
/// })
///
/// isPlaylist is required for this command.
#[tauri::command]
pub fn send_message(
    message: Value,
    window_id: Value,
    is_playlist: bool,
    message_type: Option<String>,
) -> Result<usize, String> {
    let window_id = parse_window_id(&window_id)?;

    let message_type = message_type
        .as_deref()
        .unwrap_or(MESSAGE_TYPE_RESOLUTION_UPDATE);

    let payload = with_is_playlist(
        with_type(message_type, message),
        is_playlist,
    );

    let response =
        ApiResponse::success("Data from app", payload).to_json();

    window_broadcaster(window_id)?
        .send(response)
        .map_err(|_| {
            format!(
                "No WebSocket client connected for window {}",
                window_id
            )
        })
}

/// Sends a custom typed message to a specific window.
///
/// The frontend supplies both message_type and data.
///
/// No is_playlist parameter is required.
///
/// Frontend:
///
/// invoke("send_typed_message", {
///     windowId: 1,
///     messageType: "brightness_opacity",
///     data: {
///         brightness: 80,
///         opacity: 60
///     }
/// })
#[tauri::command]
pub fn send_typed_message(
    window_id: Value,
    message_type: String,
    data: Value,
) -> Result<usize, String> {
    // Validate window ID.
    let window_id = parse_window_id(&window_id)?;

    // Validate message type.
    let message_type = message_type.trim();

    if message_type.is_empty() {
        return Err("Message type cannot be empty".to_string());
    }

    // Add the frontend-provided type to the data.
    let payload = with_type(message_type, data);

    // Wrap the payload in the existing API response format.
    let response =
        ApiResponse::success("Data from app", payload).to_json();

    // Send only to the requested window's WebSocket clients.
    let sent_count = window_broadcaster(window_id)?
        .send(response)
        .map_err(|_| {
            format!(
                "No WebSocket client connected for window {}",
                window_id
            )
        })?;

    println!(
        "Message '{}' sent to window {} ({} receiver(s))",
        message_type,
        window_id,
        sent_count
    );

    Ok(sent_count)
}

// ---------- WebSocket server ----------

pub async fn start_socket_server() {
    let address = "0.0.0.0:9001";

    let listener = match TcpListener::bind(address).await {
        Ok(listener) => listener,

        Err(error) => {
            eprintln!("WebSocket server failed: {}", error);
            return;
        }
    };

    println!("WebSocket server running at ws://{}", address);

    loop {
        match listener.accept().await {
            Ok((stream, address)) => {
                println!("Client connected: {}", address);

                tokio::spawn(async move {
                    let mut route = SocketRoute::Broadcast;

                    let websocket = match accept_hdr_async(
                        stream,
                        |request: &Request, response: Response| {
                            route = parse_socket_route(
                                request.uri().path(),
                            );

                            Ok(response)
                        },
                    )
                    .await
                    {
                        Ok(websocket) => websocket,

                        Err(error) => {
                            eprintln!(
                                "WebSocket handshake failed: {}",
                                error
                            );
                            return;
                        }
                    };

                    let (mut sender, mut receiver) = websocket.split();

                    // Subscribe before sending the welcome message.
                    let outgoing_sender = match route {
                        SocketRoute::Broadcast | SocketRoute::Invalid => {
                            broadcaster().clone()
                        }

                        SocketRoute::WindowResolution(window_id) => {
                            match window_broadcaster(window_id) {
                                Ok(sender) => sender,

                                Err(error) => {
                                    eprintln!(
                                        "Failed to subscribe window socket: {}",
                                        error
                                    );
                                    return;
                                }
                            }
                        }
                    };

                    let mut outgoing_rx = outgoing_sender.subscribe();

                    // ---------- welcome message ----------

                    let welcome_json = match route {
                        SocketRoute::Broadcast => {
                            match get_all_windows() {
                                Ok(windows) => ApiResponse::success(
                                    "Connected to LED Tracker socket server",
                                    json!({
                                        "client": address.to_string(),
                                        "windows": windows
                                    }),
                                )
                                .to_json(),

                                Err(error) => ApiResponse::error(
                                    format!(
                                        "Failed to load windows: {}",
                                        error
                                    ),
                                )
                                .to_json(),
                            }
                        }

                        SocketRoute::WindowResolution(window_id) => {
                            match task::spawn_blocking(move || {
                                window_service::get_window_by_id(window_id)
                            })
                            .await
                            {
                                Ok(Ok(window)) => ApiResponse::success(
                                    "Window resolution retrieved",
                                    with_type(
                                        MESSAGE_TYPE_RESOLUTION_UPDATE,
                                        json!({
                                            "windowId": window.id,
                                            "name": window.name,
                                            "width": window.width,
                                            "height": window.height,
                                            "resolution": format!(
                                                "{} × {}",
                                                window.width,
                                                window.height
                                            )
                                        }),
                                    ),
                                )
                                .to_json(),

                                Ok(Err(error)) => ApiResponse::error(
                                    format!(
                                        "Failed to load window {}: {}",
                                        window_id,
                                        error
                                    ),
                                )
                                .to_json(),

                                Err(error) => ApiResponse::error(
                                    format!(
                                        "Failed to load window {}: {}",
                                        window_id,
                                        error
                                    ),
                                )
                                .to_json(),
                            }
                        }

                        SocketRoute::Invalid => ApiResponse::error(
                            "Invalid WebSocket path. Use /windows/{window_id}/resolution",
                        )
                        .to_json(),
                    };

                    if let Err(error) = sender
                        .send(Message::Text(welcome_json.into()))
                        .await
                    {
                        eprintln!(
                            "Failed to send welcome message: {}",
                            error
                        );
                        return;
                    }

                    // ---------- WebSocket message loop ----------

                    loop {
                        tokio::select! {
                            // Messages received from this WebSocket client.
                            incoming = receiver.next() => {
                                let Some(message) = incoming else {
                                    break;
                                };

                                match message {
                                    Ok(Message::Text(text)) => {
                                        println!("Received: {}", text);

                                        let response = ApiResponse::success(
                                            "Message received",
                                            json!({
                                                "received": text.to_string()
                                            }),
                                        );

                                        if let Err(error) = sender
                                            .send(Message::Text(
                                                response.to_json().into()
                                            ))
                                            .await
                                        {
                                            eprintln!(
                                                "Failed to send response: {}",
                                                error
                                            );
                                            break;
                                        }
                                    }

                                    Ok(Message::Ping(data)) => {
                                        if let Err(error) = sender
                                            .send(Message::Pong(data))
                                            .await
                                        {
                                            eprintln!(
                                                "Ping response failed: {}",
                                                error
                                            );
                                            break;
                                        }
                                    }

                                    Ok(Message::Close(_)) => {
                                        println!("Client disconnected");
                                        break;
                                    }

                                    Ok(_) => {
                                        let response =
                                            ApiResponse::error(
                                                "Unsupported message type"
                                            );

                                        if let Err(error) = sender
                                            .send(Message::Text(
                                                response.to_json().into()
                                            ))
                                            .await
                                        {
                                            eprintln!(
                                                "Failed to send error response: {}",
                                                error
                                            );
                                            break;
                                        }
                                    }

                                    Err(error) => {
                                        eprintln!(
                                            "WebSocket error: {}",
                                            error
                                        );
                                        break;
                                    }
                                }
                            }

                            // Messages sent from the application.
                            outgoing = outgoing_rx.recv() => {
                                match outgoing {
                                    Ok(text) => {
                                        if let Err(error) = sender
                                            .send(Message::Text(text.into()))
                                            .await
                                        {
                                            eprintln!(
                                                "Failed to send broadcast: {}",
                                                error
                                            );
                                            break;
                                        }
                                    }

                                    Err(RecvError::Lagged(skipped)) => {
                                        eprintln!(
                                            "Client lagged, skipped {} messages",
                                            skipped
                                        );
                                    }

                                    Err(RecvError::Closed) => {
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    println!("Client connection closed");
                });
            }

            Err(error) => {
                eprintln!("Client accept failed: {}", error);
            }
        }
    }
}

// ---------- tests ----------

#[cfg(test)]
mod tests {
    use super::{
        SocketRoute,
        parse_socket_route,
        parse_window_id,
        window_broadcaster,
        with_is_playlist,
        with_type,
    };

    use serde_json::json;
    use tokio::sync::broadcast;

    #[test]
    fn parses_window_resolution_route_for_numeric_and_display_ids() {
        assert_eq!(
            parse_socket_route("/windows/12/resolution"),
            SocketRoute::WindowResolution(12)
        );

        assert_eq!(
            parse_socket_route("/windows/WIN-012/resolution"),
            SocketRoute::WindowResolution(12)
        );
    }

    #[test]
    fn rejects_invalid_window_resolution_routes() {
        assert_eq!(
            parse_socket_route("/windows/0/resolution"),
            SocketRoute::Invalid
        );

        assert_eq!(
            parse_socket_route("/windows/not-an-id/resolution"),
            SocketRoute::Invalid
        );

        assert_eq!(
            parse_socket_route("/unknown"),
            SocketRoute::Invalid
        );
    }

    #[test]
    fn keeps_root_socket_route_for_existing_clients() {
        assert_eq!(
            parse_socket_route("/"),
            SocketRoute::Broadcast
        );
    }

    #[test]
    fn sends_messages_only_to_the_requested_window_channel() {
        let mut target_rx =
            window_broadcaster(101).unwrap().subscribe();

        let mut other_rx =
            window_broadcaster(102).unwrap().subscribe();

        window_broadcaster(101)
            .unwrap()
            .send("targeted".to_string())
            .unwrap();

        assert_eq!(
            target_rx.try_recv().unwrap(),
            "targeted"
        );

        assert!(matches!(
            other_rx.try_recv(),
            Err(broadcast::error::TryRecvError::Empty)
        ));
    }

    #[test]
    fn parses_numeric_and_display_window_ids_for_tauri_commands() {
        assert_eq!(
            parse_window_id(&json!(12)).unwrap(),
            12
        );

        assert_eq!(
            parse_window_id(&json!("WIN-012")).unwrap(),
            12
        );

        assert!(parse_window_id(&json!(0)).is_err());
    }

    #[test]
    fn adds_message_type_to_payloads() {
        assert_eq!(
            with_type(
                "resolution_update",
                json!({ "width": 1920 })
            ),
            json!({
                "type": "resolution_update",
                "width": 1920
            })
        );

        assert_eq!(
            with_type(
                "resolution_update",
                json!(5)
            ),
            json!({
                "type": "resolution_update",
                "value": 5
            })
        );
    }

    #[test]
    fn adds_custom_frontend_message_type_and_data() {
        let message_type = "brightness_opacity";

        let data = json!({
            "brightness": 80,
            "opacity": 60
        });

        let payload = with_type(message_type, data);

        assert_eq!(
            payload,
            json!({
                "type": "brightness_opacity",
                "brightness": 80,
                "opacity": 60
            })
        );
    }

    #[test]
    fn always_adds_is_playlist_to_payloads() {
        assert_eq!(
            with_is_playlist(
                json!({ "hex": "#FF5521" }),
                true
            ),
            json!({
                "hex": "#FF5521",
                "is_playlist": true
            })
        );

        assert_eq!(
            with_is_playlist(
                json!({ "hex": "#FF5521" }),
                false
            ),
            json!({
                "hex": "#FF5521",
                "is_playlist": false
            })
        );

        // The argument overrides an existing value.
        assert_eq!(
            with_is_playlist(
                json!({ "is_playlist": true }),
                false
            ),
            json!({
                "is_playlist": false
            })
        );

        // Non-object payloads are wrapped.
        assert_eq!(
            with_is_playlist(json!(5), true),
            json!({
                "is_playlist": true,
                "value": 5
            })
        );
    }
}
