use axum::{
    routing::get,
    Router,
};

use super::handlers::{
   
    window_handler,
};

pub fn create_routes() -> Router {
    Router::new()
   

        // Window APIs
        .route("/api/windows", get(window_handler::get_all_windows))
}