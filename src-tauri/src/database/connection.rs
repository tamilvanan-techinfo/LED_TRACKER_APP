use rusqlite::Connection;
use std::path::PathBuf;

pub fn get_database_path() -> Result<PathBuf, String> {
    let mut directory =
        std::env::current_dir().map_err(|error| error.to_string())?;

    directory.push("data");

    std::fs::create_dir_all(&directory)
        .map_err(|error| error.to_string())?;

    Ok(directory.join("LED CONTROL PANEL.db"))
}

pub fn get_connection() -> Result<Connection, String> {
    let database_path = get_database_path()?;

    let connection = Connection::open(database_path)
        .map_err(|error| error.to_string())?;

    // SQLite does not enforce foreign keys unless this is enabled per connection
    connection
        .execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|error| error.to_string())?;

    Ok(connection)
}

fn column_exists(connection: &Connection, table: &str, column: &str) -> Result<bool, String> {
    let mut statement = connection
        .prepare(&format!("PRAGMA table_info({})", table))
        .map_err(|error| error.to_string())?;

    let names = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|error| error.to_string())?;

    for name in names {
        if name.map_err(|error| error.to_string())? == column {
            return Ok(true);
        }
    }

    Ok(false)
}

fn migrate_window_table(connection: &Connection) -> Result<(), String> {
    let window_exists: bool = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'window')",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    if !window_exists || column_exists(connection, "window", "category_id")? {
        return Ok(());
    }

    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS window_category (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );

            INSERT OR IGNORE INTO window_category (name) VALUES ('Static Window');
            INSERT OR IGNORE INTO window_category (name) VALUES ('Dynamic Window');

            ALTER TABLE window ADD COLUMN category_id INTEGER REFERENCES window_category (id);

            UPDATE window
            SET category_id = (SELECT id FROM window_category WHERE name = 'Static Window')
            WHERE category_id IS NULL;
            ",
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn create_database() -> Result<(), String> {
    let connection = get_connection()?;

    // Upgrade an older window table before the schema and seed statements run
    migrate_window_table(&connection)?;

    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS window_category (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS window (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                height INTEGER NOT NULL,
                width INTEGER NOT NULL,
                position_x INTEGER NOT NULL,
                position_y INTEGER NOT NULL,
                status INTEGER NOT NULL,
                FOREIGN KEY (category_id) REFERENCES window_category (id)
                    ON DELETE RESTRICT
            );

            -- Seed categories (skipped if they already exist)
            INSERT OR IGNORE INTO window_category (name) VALUES ('Static Window');
            INSERT OR IGNORE INTO window_category (name) VALUES ('Dynamic Window');

            -- Seed one window per category (skipped if the category already has a window)
            INSERT INTO window (category_id, name, height, width, position_x, position_y, status)
            SELECT c.id, 'Static Window 1', 100, 200, 0, 0, 1
            FROM window_category c
            WHERE c.name = 'Static Window'
              AND NOT EXISTS (SELECT 1 FROM window w WHERE w.category_id = c.id);

            INSERT INTO window (category_id, name, height, width, position_x, position_y, status)
            SELECT c.id, 'Dynamic Window 1', 150, 250, 50, 50, 1
            FROM window_category c
            WHERE c.name = 'Dynamic Window'
              AND NOT EXISTS (SELECT 1 FROM window w WHERE w.category_id = c.id);
            ",
        )
        .map_err(|error| error.to_string())?;

    println!("Database created successfully");

    Ok(())
}