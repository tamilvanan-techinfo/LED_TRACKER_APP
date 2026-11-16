
mod database;
mod modules;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()

        // Opener plugin
        .plugin(tauri_plugin_opener::init())

        // Register Tauri commands
        .invoke_handler(tauri::generate_handler![
            modules::api::window_api::create_window,
            modules::api::window_api::get_all_windows,
            modules::api::window_api::get_window_by_id,
            modules::api::window_api::update_window,
            modules::api::window_api::delete_window,
            modules::api::playlist_api::create_playlist_color,
            modules::api::playlist_api::get_playlist_colors,
            modules::api::playlist_api::update_playlist_color,
            modules::api::playlist_api::delete_playlist_color,
            modules::api::playlist_api::clear_playlist_colors,
            modules::socket_server::send_to_clients,
            modules::socket_server::send_message,
            modules::socket_server::send_typed_message
        ])

        // Application setup
        .setup(|_app| {

            // Initialize database
            database::connection::create_database()
                .expect("Failed to create database");

            println!("Database created successfully");

            // Start WebSocket server
            tauri::async_runtime::spawn(async {
                modules::socket_server::start_socket_server().await;
            });

            // Start HTTP backend server (Axum)
            tauri::async_runtime::spawn(async {
                if let Err(error) =
                    modules::server_api::start_server().await
                {
                    eprintln!("HTTP backend server error: {}", error);
                }
            });

            println!("LED Power Tracker backend services initialized");

            Ok(())
        })

        // Run Tauri application
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
