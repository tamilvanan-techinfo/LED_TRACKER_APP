
use rusqlite::Connection;
use std::path::PathBuf;

// ============================================================
// DATABASE PATH
// ============================================================

pub fn get_database_path() -> Result<PathBuf, String> {
    let mut directory =
        std::env::current_dir().map_err(|e| e.to_string())?;

    directory.push("data");

    std::fs::create_dir_all(&directory)
        .map_err(|e| format!("Failed to create database directory: {}", e))?;

    Ok(directory.join("LED CONTROL PANEL.db"))
}

// ============================================================
// DATABASE CONNECTION
// ============================================================

pub fn get_connection() -> Result<Connection, String> {
    let database_path = get_database_path()?;

    println!("Database path: {:?}", database_path);

    let connection = Connection::open(&database_path)
        .map_err(|e| format!("Database connection failed: {}", e))?;

    connection
        .execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| e.to_string())?;

    Ok(connection)
}

// ============================================================
// STEP 1: CREATE ALL TABLES
// ============================================================

fn create_all_tables(connection: &Connection) -> Result<(), String> {

    connection
        .execute_batch(
            "
            -- ========================================
            -- WINDOW CATEGORY TABLE
            -- ========================================

            CREATE TABLE IF NOT EXISTS window_category (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );

            -- ========================================
            -- WINDOW TABLE
            -- ========================================

            CREATE TABLE IF NOT EXISTS window (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                category_id INTEGER NOT NULL,

                name TEXT NOT NULL,

                height INTEGER NOT NULL DEFAULT 100,

                width INTEGER NOT NULL DEFAULT 200,

                position_x INTEGER NOT NULL DEFAULT 0,

                position_y INTEGER NOT NULL DEFAULT 0,

                status INTEGER NOT NULL DEFAULT 1,

                fullscreen INTEGER NOT NULL DEFAULT 0,

                FOREIGN KEY (category_id)
                    REFERENCES window_category (id)
                    ON DELETE RESTRICT
            );

            -- ========================================
            -- PLAYLIST COLOR TABLE
            -- ========================================

            CREATE TABLE IF NOT EXISTS playlist_color (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                window_id INTEGER NOT NULL,

                name TEXT NOT NULL,

                color TEXT NOT NULL
                    CHECK (json_valid(color)),

                FOREIGN KEY (window_id)
                    REFERENCES window (id)
                    ON DELETE CASCADE
            );

            -- ========================================
            -- INDEXES
            -- ========================================

            CREATE INDEX IF NOT EXISTS idx_playlist_color_window_id
            ON playlist_color (window_id);
            ",
        )
        .map_err(|e| format!("Table creation failed: {}", e))?;

    println!("All database tables created successfully.");

    Ok(())
}

// ============================================================
// STEP 2: INSERT DEFAULT CATEGORY VALUES
// ============================================================

fn insert_default_categories(
    connection: &Connection,
) -> Result<(), String> {

    let transaction = connection
        .unchecked_transaction()
        .map_err(|e| e.to_string())?;

    transaction
        .execute(
            "
            INSERT OR IGNORE INTO window_category (name)
            VALUES (?1)
            ",
            ["Static Window"],
        )
        .map_err(|e| format!("Static category insertion failed: {}", e))?;

    transaction
        .execute(
            "
            INSERT OR IGNORE INTO window_category (name)
            VALUES (?1)
            ",
            ["Dynamic Window"],
        )
        .map_err(|e| format!("Dynamic category insertion failed: {}", e))?;

    transaction
        .commit()
        .map_err(|e| e.to_string())?;

    println!("Default categories inserted successfully.");

    Ok(())
}

// ============================================================
// STEP 3: INSERT DEFAULT WINDOW VALUES
// ============================================================

fn insert_default_windows(
    connection: &Connection,
) -> Result<(), String> {

    let transaction = connection
        .unchecked_transaction()
        .map_err(|e| e.to_string())?;

    // ========================================
    // STATIC RGB WINDOW
    // ========================================

    transaction
        .execute(
            "
            INSERT INTO window (
                category_id,
                name,
                height,
                width,
                position_x,
                position_y,
                status,
                fullscreen
            )
            SELECT
                id,
                'Static Window RGB',
                100,
                200,
                0,
                0,
                1,
                0
            FROM window_category
            WHERE name = 'Static Window'
            AND NOT EXISTS (
                SELECT 1
                FROM window
                WHERE name = 'Static Window RGB'
            )
            ",
            [],
        )
        .map_err(|e| format!("RGB window insertion failed: {}", e))?;

    // ========================================
    // STATIC CMYK WINDOW
    // ========================================

    transaction
        .execute(
            "
            INSERT INTO window (
                category_id,
                name,
                height,
                width,
                position_x,
                position_y,
                status,
                fullscreen
            )
            SELECT
                id,
                'Static Window CMYK',
                100,
                200,
                200,
                0,
                1,
                0
            FROM window_category
            WHERE name = 'Static Window'
            AND NOT EXISTS (
                SELECT 1
                FROM window
                WHERE name = 'Static Window CMYK'
            )
            ",
            [],
        )
        .map_err(|e| format!("CMYK window insertion failed: {}", e))?;

    // ========================================
    // DYNAMIC WINDOW
    // ========================================

    transaction
        .execute(
            "
            INSERT INTO window (
                category_id,
                name,
                height,
                width,
                position_x,
                position_y,
                status,
                fullscreen
            )
            SELECT
                id,
                'Dynamic Window 1',
                150,
                250,
                50,
                50,
                1,
                0
            FROM window_category
            WHERE name = 'Dynamic Window'
            AND NOT EXISTS (
                SELECT 1
                FROM window
                WHERE name = 'Dynamic Window 1'
            )
            ",
            [],
        )
        .map_err(|e| format!("Dynamic window insertion failed: {}", e))?;

    transaction
        .commit()
        .map_err(|e| format!("Window insertion transaction failed: {}", e))?;

    println!("Default windows inserted successfully.");

    Ok(())
}

// ============================================================
// STEP 4: VERIFY DATABASE TABLES
// ============================================================

fn verify_database(
    connection: &Connection,
) -> Result<(), String> {

    println!("\n========== DATABASE TABLES ==========");

    let mut statement = connection
        .prepare(
            "
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name
            ",
        )
        .map_err(|e| e.to_string())?;

    let tables = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    for table in tables {
        println!("Table: {}", table.map_err(|e| e.to_string())?);
    }

    drop(statement);

    println!("\n========== WINDOW RECORDS ==========");

    let mut statement = connection
        .prepare(
            "
            SELECT
                w.id,
                w.name,
                c.name,
                w.height,
                w.width,
                w.position_x,
                w.position_y,
                w.status,
                w.fullscreen
            FROM window w
            INNER JOIN window_category c
                ON c.id = w.category_id
            ORDER BY w.id
            ",
        )
        .map_err(|e| e.to_string())?;

    let windows = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, i64>(5)?,
                row.get::<_, i64>(6)?,
                row.get::<_, i64>(7)?,
                row.get::<_, i64>(8)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    for window in windows {
        let (
            id,
            name,
            category,
            height,
            width,
            x,
            y,
            status,
            fullscreen,
        ) = window.map_err(|e| e.to_string())?;

        println!(
            "ID: {} | Name: {} | Category: {} | Size: {}x{} | Position: ({}, {}) | Status: {} | Fullscreen: {}",
            id,
            name,
            category,
            width,
            height,
            x,
            y,
            status,
            fullscreen
        );
    }

    println!("====================================\n");

    Ok(())
}

// ============================================================
// MAIN DATABASE INITIALIZATION
// ============================================================

pub fn create_database() -> Result<(), String> {

    println!("========================================");
    println!("LED CONTROL PANEL DATABASE INITIALIZATION");
    println!("========================================");

    // Connect to database
    let connection = get_connection()?;

    // STEP 1: Create all tables
    create_all_tables(&connection)?;

    // STEP 2: Insert default categories
    insert_default_categories(&connection)?;

    // STEP 3: Insert default windows
    insert_default_windows(&connection)?;

    // STEP 4: Verify database
    verify_database(&connection)?;

    println!("Database initialized successfully!");

    Ok(())
}
