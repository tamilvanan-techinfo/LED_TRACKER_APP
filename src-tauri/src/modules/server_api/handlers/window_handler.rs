
use axum::{
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use tokio::task;

use crate::modules::server_api::services::window_service;

pub async fn get_all_windows(
) -> Result<Json<Value>, (StatusCode, String)> {

    // Execute synchronous SQLite query outside Tokio runtime
    let windows = task::spawn_blocking(|| {
        window_service::get_all_windows()
    })
    .await
    .map_err(|error| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            error.to_string(),
        )
    })?
    .map_err(|error| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            error,
        )
    })?;

    Ok(Json(json!({
        "success": true,
        "message": "Windows retrieved successfully",
        "count": windows.len(),
        "data": windows
    })))
}
