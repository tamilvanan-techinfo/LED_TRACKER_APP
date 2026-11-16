use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};

use crate::database::connection::get_connection;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlaylistColor {
    pub window_id: i32,
    pub name: String,
    pub color: PlaylistColorData,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePlaylistColor {
    pub id: i32,
    pub name: String,
    pub color: PlaylistColorData,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct PlaylistColorData {
    pub hex: String,
    pub c: u8,
    pub m: u8,
    pub y: u8,
    pub k: u8,
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistColor {
    pub id: i32,
    pub window_id: i32,
    pub name: String,
    pub color: PlaylistColorData,
}

fn ensure_window_exists(connection: &Connection, window_id: i32) -> Result<(), String> {
    if window_id <= 0 {
        return Err("windowId must be a positive integer".to_string());
    }

    let window_exists: bool = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM window WHERE id = ?1)",
            [window_id],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    if !window_exists {
        return Err(format!("Window with ID {} not found", window_id));
    }

    Ok(())
}

fn validate_color(color: &PlaylistColorData) -> Result<(), String> {
    let hex = color.hex.strip_prefix('#').unwrap_or(&color.hex);
    if hex.len() != 6 || !hex.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err("Playlist color hex must be a six-digit RGB value".to_string());
    }

    if [color.c, color.m, color.y, color.k]
        .iter()
        .any(|value| *value > 100)
    {
        return Err("CMYK channel values must be between 0 and 100".to_string());
    }

    Ok(())
}

fn insert_playlist_color(
    connection: &Connection,
    playlist: CreatePlaylistColor,
) -> Result<PlaylistColor, String> {
    let name = playlist.name.trim().to_string();
    if name.is_empty() {
        return Err("Playlist color name cannot be empty".to_string());
    }

    ensure_window_exists(connection, playlist.window_id)?;
    validate_color(&playlist.color)?;

    let color_json = serde_json::to_string(&playlist.color).map_err(|error| error.to_string())?;

    connection
        .execute(
            "
            INSERT INTO playlist_color (window_id, name, color)
            VALUES (?1, ?2, ?3)
            ",
            params![playlist.window_id, name, color_json],
        )
        .map_err(|error| error.to_string())?;

    Ok(PlaylistColor {
        id: connection.last_insert_rowid() as i32,
        window_id: playlist.window_id,
        name,
        color: playlist.color,
    })
}

fn update_playlist_color_in_connection(
    connection: &Connection,
    playlist: UpdatePlaylistColor,
) -> Result<PlaylistColor, String> {
    if playlist.id <= 0 {
        return Err("Playlist color ID must be a positive integer".to_string());
    }

    let window_id = connection
        .query_row(
            "SELECT window_id FROM playlist_color WHERE id = ?1",
            [playlist.id],
            |row| row.get::<_, i32>(0),
        )
        .map_err(|error| match error {
            rusqlite::Error::QueryReturnedNoRows => {
                format!("Playlist color with ID {} not found", playlist.id)
            }
            error => error.to_string(),
        })?;

    let name = playlist.name.trim().to_string();
    if name.is_empty() {
        return Err("Playlist color name cannot be empty".to_string());
    }
    validate_color(&playlist.color)?;

    let color_json = serde_json::to_string(&playlist.color).map_err(|error| error.to_string())?;
    let updated = connection
        .execute(
            "
            UPDATE playlist_color
            SET name = ?1, color = ?2
            WHERE id = ?3
            ",
            params![name, color_json, playlist.id],
        )
        .map_err(|error| error.to_string())?;

    if updated == 0 {
        return Err(format!("Playlist color with ID {} not found", playlist.id));
    }

    Ok(PlaylistColor {
        id: playlist.id,
        window_id,
        name,
        color: playlist.color,
    })
}

fn delete_playlist_color_from_connection(connection: &Connection, id: i32) -> Result<(), String> {
    if id <= 0 {
        return Err("Playlist color ID must be a positive integer".to_string());
    }

    let deleted = connection
        .execute("DELETE FROM playlist_color WHERE id = ?1", [id])
        .map_err(|error| error.to_string())?;

    if deleted == 0 {
        return Err(format!("Playlist color with ID {} not found", id));
    }

    Ok(())
}

fn clear_playlist_colors_from_connection(
    connection: &Connection,
    window_id: i32,
) -> Result<usize, String> {
    ensure_window_exists(connection, window_id)?;
    connection
        .execute(
            "DELETE FROM playlist_color WHERE window_id = ?1",
            [window_id],
        )
        .map_err(|error| error.to_string())
}

fn load_playlist_colors(
    connection: &Connection,
    window_id: i32,
) -> Result<Vec<PlaylistColor>, String> {
    ensure_window_exists(connection, window_id)?;

    let mut statement = connection
        .prepare(
            "
            SELECT id, window_id, name, color
            FROM playlist_color
            WHERE window_id = ?1
            ORDER BY id
            ",
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([window_id], |row| {
            Ok((
                row.get::<_, i32>(0)?,
                row.get::<_, i32>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|error| error.to_string())?;

    let mut playlist_colors = Vec::new();
    for row in rows {
        let (id, window_id, name, color_json) = row.map_err(|error| error.to_string())?;
        let color = serde_json::from_str(&color_json).map_err(|error| error.to_string())?;
        playlist_colors.push(PlaylistColor {
            id,
            window_id,
            name,
            color,
        });
    }

    Ok(playlist_colors)
}

#[tauri::command]
pub fn create_playlist_color(playlist: CreatePlaylistColor) -> Result<PlaylistColor, String> {
    let connection = get_connection()?;
    insert_playlist_color(&connection, playlist)
}

#[tauri::command]
pub fn get_playlist_colors(window_id: i32) -> Result<Vec<PlaylistColor>, String> {
    let connection = get_connection()?;
    load_playlist_colors(&connection, window_id)
}

#[tauri::command]
pub fn update_playlist_color(playlist: UpdatePlaylistColor) -> Result<PlaylistColor, String> {
    let connection = get_connection()?;
    update_playlist_color_in_connection(&connection, playlist)
}

#[tauri::command]
pub fn delete_playlist_color(id: i32) -> Result<(), String> {
    let connection = get_connection()?;
    delete_playlist_color_from_connection(&connection, id)
}

#[tauri::command]
pub fn clear_playlist_colors(window_id: i32) -> Result<usize, String> {
    let connection = get_connection()?;
    clear_playlist_colors_from_connection(&connection, window_id)
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::{
        CreatePlaylistColor, PlaylistColorData, UpdatePlaylistColor,
        clear_playlist_colors_from_connection, delete_playlist_color_from_connection,
        insert_playlist_color, load_playlist_colors, update_playlist_color_in_connection,
    };

    fn test_color() -> PlaylistColorData {
        PlaylistColorData {
            hex: "#123456".to_string(),
            c: 10,
            m: 20,
            y: 30,
            k: 40,
        }
    }

    #[test]
    fn inserts_playlist_color_for_a_window_and_returns_saved_data() {
        let connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch(
                "
                PRAGMA foreign_keys = ON;
                CREATE TABLE window (id INTEGER PRIMARY KEY);
                CREATE TABLE playlist_color (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    window_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    color TEXT NOT NULL CHECK (json_valid(color)),
                    FOREIGN KEY (window_id) REFERENCES window (id) ON DELETE CASCADE,
                    UNIQUE (window_id, name)
                );
                INSERT INTO window (id) VALUES (2);
                ",
            )
            .unwrap();

        let color = test_color();
        let saved = insert_playlist_color(
            &connection,
            CreatePlaylistColor {
                window_id: 2,
                name: "  Blue  ".to_string(),
                color: color.clone(),
            },
        )
        .unwrap();

        assert_eq!(saved.id, 1);
        assert_eq!(saved.window_id, 2);
        assert_eq!(saved.name, "Blue");
        assert_eq!(saved.color, color);

        let stored_color: String = connection
            .query_row(
                "SELECT color FROM playlist_color WHERE id = ?1",
                [saved.id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(
            serde_json::from_str::<PlaylistColorData>(&stored_color).unwrap(),
            color
        );
    }

    #[test]
    fn rejects_empty_names_and_unknown_windows() {
        let connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch(
                "
                CREATE TABLE window (id INTEGER PRIMARY KEY);
                CREATE TABLE playlist_color (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    window_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    color TEXT NOT NULL
                );
                ",
            )
            .unwrap();

        let empty_name = insert_playlist_color(
            &connection,
            CreatePlaylistColor {
                window_id: 1,
                name: "  ".to_string(),
                color: test_color(),
            },
        );
        assert_eq!(
            empty_name.unwrap_err(),
            "Playlist color name cannot be empty"
        );

        let missing_window = insert_playlist_color(
            &connection,
            CreatePlaylistColor {
                window_id: 1,
                name: "Blue".to_string(),
                color: test_color(),
            },
        );
        assert_eq!(missing_window.unwrap_err(), "Window with ID 1 not found");
    }

    #[test]
    fn lists_only_playlist_colors_for_the_requested_window() {
        let connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch(
                "
                CREATE TABLE window (id INTEGER PRIMARY KEY);
                CREATE TABLE playlist_color (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    window_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    color TEXT NOT NULL,
                    FOREIGN KEY (window_id) REFERENCES window (id),
                    UNIQUE (window_id, name)
                );
                INSERT INTO window (id) VALUES (1), (2);
                ",
            )
            .unwrap();

        for (window_id, name) in [(1, "RGB red"), (1, "RGB blue"), (2, "CMYK green")] {
            insert_playlist_color(
                &connection,
                CreatePlaylistColor {
                    window_id,
                    name: name.to_string(),
                    color: test_color(),
                },
            )
            .unwrap();
        }

        let colors = load_playlist_colors(&connection, 1).unwrap();
        assert_eq!(colors.len(), 2);
        assert!(colors.iter().all(|color| color.window_id == 1));
        assert_eq!(colors[0].name, "RGB red");
        assert_eq!(colors[1].name, "RGB blue");
    }

    #[test]
    fn updates_a_playlist_color_without_changing_its_window() {
        let connection = test_connection();
        let created = insert_playlist_color(
            &connection,
            CreatePlaylistColor {
                window_id: 1,
                name: "Old name".to_string(),
                color: test_color(),
            },
        )
        .unwrap();
        let updated_color = PlaylistColorData {
            hex: "#ABCDEF".to_string(),
            c: 1,
            m: 2,
            y: 3,
            k: 4,
        };

        let updated = update_playlist_color_in_connection(
            &connection,
            UpdatePlaylistColor {
                id: created.id,
                name: "New name".to_string(),
                color: updated_color.clone(),
            },
        )
        .unwrap();

        assert_eq!(updated.window_id, 1);
        assert_eq!(updated.name, "New name");
        assert_eq!(updated.color, updated_color);
        let colors = load_playlist_colors(&connection, 1).unwrap();
        assert_eq!(colors, vec![updated]);
    }

    #[test]
    fn deletes_one_color_or_clears_only_the_requested_window() {
        let connection = test_connection();
        let first = insert_playlist_color(
            &connection,
            CreatePlaylistColor {
                window_id: 1,
                name: "First".to_string(),
                color: test_color(),
            },
        )
        .unwrap();
        insert_playlist_color(
            &connection,
            CreatePlaylistColor {
                window_id: 1,
                name: "Second".to_string(),
                color: test_color(),
            },
        )
        .unwrap();
        insert_playlist_color(
            &connection,
            CreatePlaylistColor {
                window_id: 2,
                name: "Other window".to_string(),
                color: test_color(),
            },
        )
        .unwrap();

        delete_playlist_color_from_connection(&connection, first.id).unwrap();
        assert_eq!(load_playlist_colors(&connection, 1).unwrap().len(), 1);

        assert_eq!(
            clear_playlist_colors_from_connection(&connection, 1).unwrap(),
            1
        );
        assert!(load_playlist_colors(&connection, 1).unwrap().is_empty());
        assert_eq!(load_playlist_colors(&connection, 2).unwrap().len(), 1);
    }

    fn test_connection() -> Connection {
        let connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch(
                "
                PRAGMA foreign_keys = ON;
                CREATE TABLE window (id INTEGER PRIMARY KEY);
                CREATE TABLE playlist_color (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    window_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    color TEXT NOT NULL CHECK (json_valid(color)),
                    FOREIGN KEY (window_id) REFERENCES window (id) ON DELETE CASCADE,
                    UNIQUE (window_id, name)
                );
                INSERT INTO window (id) VALUES (1), (2);
                ",
            )
            .unwrap();
        connection
    }
}
