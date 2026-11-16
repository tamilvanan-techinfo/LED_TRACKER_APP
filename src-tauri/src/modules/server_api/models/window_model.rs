use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Window {
    pub id: i32,
    pub name: String,
    pub height: i32,
    pub width: i32,
    pub position_x: i32,
    pub position_y: i32,
    pub fullscreen: bool,
    pub status: bool,
}