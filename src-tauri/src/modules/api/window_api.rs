use rusqlite::{params, Row};
use serde::{Deserialize, Serialize};

use crate::database::connection::get_connection;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Window {
    pub id: i32,
    pub category_id: i32,
    pub name: String,
    pub height: i32,
    pub width: i32,
    pub position_x: i32,
    pub position_y: i32,
    pub status: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWindow {
    pub category_id: i32,
    pub name: String,
    pub height: i32,
    pub width: i32,
    pub position_x: i32,
    pub position_y: i32,
    pub status: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWindow {
    pub id: i32,
    pub category_id: i32,
    pub name: String,
    pub height: i32,
    pub width: i32,
    pub position_x: i32,
    pub position_y: i32,
    pub status: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowItem {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub window_type: String,
    pub resolution: String,
    pub content: Option<String>,
    pub height: i32,
    pub width: i32,
    pub left: i32,
    pub top: i32,
    pub active: bool,
}

fn map_window(row: &Row<'_>) -> rusqlite::Result<Window> {
    Ok(Window {
        id: row.get("id")?,
        category_id: row.get("category_id")?,
        name: row.get("name")?,
        height: row.get("height")?,
        width: row.get("width")?,
        position_x: row.get("position_x")?,
        position_y: row.get("position_y")?,
        status: row.get("status")?,
    })
}

fn map_window_item(row: &Row<'_>) -> rusqlite::Result<WindowItem> {
    let id: i32 = row.get("id")?;
    let category_id: i32 = row.get("category_id")?;
    let width: i32 = row.get("width")?;
    let height: i32 = row.get("height")?;

    let window_type = match category_id {
        1 => "Static",
        2 => "Dynamic",
        _ => "Unknown",
    }
    .to_string();

    // Content is derived from the category until a content column is added
    let content = match category_id {
        1 => Some("Image".to_string()),
        2 => Some("Video".to_string()),
        _ => None,
    };

    Ok(WindowItem {
        id: format!("WIN-{:03}", id),
        name: row.get("name")?,
        window_type,
        resolution: format!("{} × {}", width, height),
        content,
        height,
        width,
        left: row.get("position_x")?,
        top: row.get("position_y")?,
        active: false,
    })
}

#[tauri::command]
pub fn create_window(window: CreateWindow) -> Result<Window, String> {
    let connection = get_connection()?;

    connection
        .execute(
            "
            INSERT INTO window (
                category_id,
                name,
                height,
                width,
                position_x,
                position_y,
                status
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ",
            params![
                window.category_id,
                window.name,
                window.height,
                window.width,
                window.position_x,
                window.position_y,
                window.status
            ],
        )
        .map_err(|error| error.to_string())?;

    let id = connection.last_insert_rowid() as i32;

    get_window_by_id_from_connection(&connection, id)
}

#[tauri::command]
pub fn get_all_windows() -> Result<Vec<WindowItem>, String> {
    let connection = get_connection()?;

    let mut statement = connection
        .prepare(
            "
            SELECT
                id,
                category_id,
                name,
                height,
                width,
                position_x,
                position_y
            FROM window
            ORDER BY id
            ",
        )
        .map_err(|error| error.to_string())?;

    let windows = statement
        .query_map([], map_window_item)
        .map_err(|error| error.to_string())?;

    windows
        .collect::<Result<Vec<WindowItem>, _>>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_window_by_id(id: i32) -> Result<Window, String> {
    let connection = get_connection()?;

    get_window_by_id_from_connection(&connection, id)
}

fn get_window_by_id_from_connection(
    connection: &rusqlite::Connection,
    id: i32,
) -> Result<Window, String> {
    connection
        .query_row(
            "
            SELECT
                id,
                category_id,
                name,
                height,
                width,
                position_x,
                position_y,
                status
            FROM window
            WHERE id = ?1
            ",
            [id],
            map_window,
        )
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn update_window(window: UpdateWindow) -> Result<Window, String> {
    let connection = get_connection()?;

    let updated = connection
        .execute(
            "
            UPDATE window
            SET
                category_id = ?1,
                name = ?2,
                height = ?3,
                width = ?4,
                position_x = ?5,
                position_y = ?6,
                status = ?7
            WHERE id = ?8
            ",
            params![
                window.category_id,
                window.name,
                window.height,
                window.width,
                window.position_x,
                window.position_y,
                window.status,
                window.id
            ],
        )
        .map_err(|error| error.to_string())?;

    if updated == 0 {
        return Err(format!("Window with ID {} not found", window.id));
    }

    get_window_by_id_from_connection(&connection, window.id)
}

#[tauri::command]
pub fn delete_window(id: i32) -> Result<(), String> {
    let connection = get_connection()?;

    let deleted = connection
        .execute(
            "DELETE FROM window WHERE id = ?1",
            [id],
        )
        .map_err(|error| error.to_string())?;

    if deleted == 0 {
        return Err(format!("Window with ID {} not found", id));
    }

    Ok(())
}