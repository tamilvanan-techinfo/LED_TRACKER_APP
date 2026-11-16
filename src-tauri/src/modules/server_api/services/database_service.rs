
use rusqlite::Connection;

use crate::database::connection::get_connection;

// Get the existing SQLite connection
pub fn get_db_connection() -> Result<Connection, String> {
    get_connection()
}

// Check database connection
pub fn check_database() -> Result<bool, String> {
    let conn = get_db_connection()?;

    let result: i32 = conn
        .query_row("SELECT 1", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    Ok(result == 1)
}
