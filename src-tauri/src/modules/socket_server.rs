use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::sync::OnceLock;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio::sync::broadcast::error::RecvError;
use tokio_tungstenite::{
    accept_async,
    tungstenite::Message,
};
use super::api::window_api::get_all_windows;
use super::response::ApiResponse;

// ---------- broadcast channel ----------

static BROADCASTER: OnceLock<broadcast::Sender<String>> = OnceLock::new();

fn broadcaster() -> &'static broadcast::Sender<String> {
    BROADCASTER.get_or_init(|| broadcast::channel(100).0)
}

/// Sends a text message to every connected WebSocket client.
/// Returns how many clients received it (0 if nobody is connected).
pub fn send_to_all(message: String) -> usize {
    broadcaster().send(message).unwrap_or(0)
}

/// Sends a message with a title and data to every connected client.
pub fn send_response_to_all(title: &str, data: Value) -> usize {
    let json = ApiResponse::success(title, data).to_json();
    send_to_all(json)
}

// ---------- Tauri command ----------

/// Call from JSX: invoke("send_to_clients", { message: { ... } })
#[tauri::command]
pub fn send_to_clients(message: Value) -> Result<usize, String> {
    Ok(send_response_to_all("Data from app", message))
}

// ---------- server ----------

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
                    let websocket = match accept_async(stream).await {
                        Ok(websocket) => websocket,
                        Err(error) => {
                            eprintln!("WebSocket handshake failed: {}", error);
                            return;
                        }
                    };

                    let (mut sender, mut receiver) = websocket.split();

                    // Subscribe before sending the welcome message so no broadcast is missed
                    let mut broadcast_rx = broadcaster().subscribe();

                    // Welcome message with all windows, sent as soon as the client connects
                    let welcome_json = match get_all_windows() {
                        Ok(windows) => ApiResponse::success(
                            "Connected to LED Tracker socket server",
                            json!({
                                "client": address.to_string(),
                                "windows": windows
                            }),
                        )
                        .to_json(),

                        Err(error) => {
                            ApiResponse::error(format!("Failed to load windows: {}", error))
                                .to_json()
                        }
                    };

                    if let Err(error) = sender
                        .send(Message::Text(welcome_json.into()))
                        .await
                    {
                        eprintln!("Failed to send welcome message: {}", error);
                        return;
                    }

                    loop {
                        tokio::select! {
                            // Messages coming from this client
                            incoming = receiver.next() => {
                                let Some(message) = incoming else {
                                    break;
                                };

                                match message {
                                    Ok(Message::Text(text)) => {
                                        println!("Received: {}", text);

                                        let response = ApiResponse::success(
                                            "Message received",
                                            json!({ "received": text.to_string() }),
                                        );

                                        if let Err(error) = sender
                                            .send(Message::Text(response.to_json().into()))
                                            .await
                                        {
                                            eprintln!("Failed to send response: {}", error);
                                            break;
                                        }
                                    }

                                    Ok(Message::Ping(data)) => {
                                        if let Err(error) = sender
                                            .send(Message::Pong(data))
                                            .await
                                        {
                                            eprintln!("Ping response failed: {}", error);
                                            break;
                                        }
                                    }

                                    Ok(Message::Close(_)) => {
                                        println!("Client disconnected");
                                        break;
                                    }

                                    Ok(_) => {
                                        // Binary, Pong and other frames are not supported
                                        let response = ApiResponse::error("Unsupported message type");

                                        if let Err(error) = sender
                                            .send(Message::Text(response.to_json().into()))
                                            .await
                                        {
                                            eprintln!("Failed to send error response: {}", error);
                                            break;
                                        }
                                    }

                                    Err(error) => {
                                        eprintln!("WebSocket error: {}", error);
                                        break;
                                    }
                                }
                            }

                            // Messages sent from the app (via send_to_all / send_to_clients)
                            outgoing = broadcast_rx.recv() => {
                                match outgoing {
                                    Ok(text) => {
                                        if let Err(error) = sender
                                            .send(Message::Text(text.into()))
                                            .await
                                        {
                                            eprintln!("Failed to send broadcast: {}", error);
                                            break;
                                        }
                                    }

                                    Err(RecvError::Lagged(skipped)) => {
                                        eprintln!("Client lagged, skipped {} messages", skipped);
                                    }

                                    Err(RecvError::Closed) => break,
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