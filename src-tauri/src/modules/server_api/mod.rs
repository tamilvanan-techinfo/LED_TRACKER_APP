// API handlers
pub mod handlers;

// API routes
pub mod routes;

// Business logic
pub mod services;

// Request and response models
pub mod models;

// HTTP server
mod main;

// Expose server startup function
pub use main::start_server;