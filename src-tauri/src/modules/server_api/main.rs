use axum::Router;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

use super::routes::create_routes;

pub async fn start_server() -> Result<(), std::io::Error> {

    let app = Router::new()
        .merge(create_routes())
        .layer(CorsLayer::permissive());

    let address = SocketAddr::from(([127, 0, 0, 1], 8765));

    let listener = TcpListener::bind(address).await?;

    println!("========================================");
    println!("     LED POWER TRACKER BACKEND");
    println!("========================================");
    println!(" HTTP Server: http://127.0.0.1:8765");
    println!(" Health API:  http://127.0.0.1:8765/api/health");
    println!(" Windows API: http://127.0.0.1:8765/api/windows");
    println!("========================================");

    axum::serve(listener, app).await?;

    Ok(())
}