use rusqlite::Connection;

use crate::database::connection::get_connection;
use crate::modules::server_api::models::window_model::Window;

pub fn get_all_windows() -> Result<Vec<Window>, String> {
    // Get database connection
    let conn: Connection = get_connection().map_err(|error| error.to_string())?;

    // Fetch all windows
    let mut statement = conn
        .prepare(
            r#"
            SELECT
                id,
                name,
                height,
                width,
                position_x,
                position_y,
                status,
                fullscreen
            FROM "window"
            ORDER BY id ASC
            "#,
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            Ok(Window {
                id: row.get(0)?,
                name: row.get(1)?,
                height: row.get(2)?,
                width: row.get(3)?,
                position_x: row.get(4)?,
                position_y: row.get(5)?,
                fullscreen: row.get(7)?,
                status: row.get(6)?,
            })
        })
        .map_err(|error| error.to_string())?;

    let mut windows = Vec::new();

    for window in rows {
        windows.push(window.map_err(|error| error.to_string())?);
    }

    Ok(windows)
}

pub fn get_window_by_id(id: i32) -> Result<Window, String> {
    let conn = get_connection().map_err(|error| error.to_string())?;

    conn.query_row(
        r#"
        SELECT
            id,
            name,
            height,
            width,
            position_x,
            position_y,
            status,
            fullscreen
        FROM "window"
        WHERE id = ?1
        "#,
        [id],
        |row| {
            Ok(Window {
                id: row.get(0)?,
                name: row.get(1)?,
                height: row.get(2)?,
                width: row.get(3)?,
                position_x: row.get(4)?,
                position_y: row.get(5)?,
                fullscreen: row.get(7)?,
                status: row.get(6)?,
            })
        },
    )
    .map_err(|error| match error {
        rusqlite::Error::QueryReturnedNoRows => format!("Window with ID {} not found", id),
        error => error.to_string(),
    })
}
