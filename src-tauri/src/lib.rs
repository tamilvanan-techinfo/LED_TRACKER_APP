mod database;
mod modules;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            modules::api::window_api::create_window,
            modules::api::window_api::get_all_windows,
            modules::api::window_api::get_window_by_id,
            modules::api::window_api::update_window,
            modules::api::window_api::delete_window,
            modules::socket_server::send_to_clients // replace `socket` with this module's name

        ])
        .setup(|_app| {
            // Initialize database
            database::connection::create_database()
                .expect("Failed to create database");

            // Start socket server
            tauri::async_runtime::spawn(async {
                modules::socket_server::start_socket_server().await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}