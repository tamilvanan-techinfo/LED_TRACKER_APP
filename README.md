# LED Tracker App

A desktop application for managing LED display windows and monitoring their status in a dashboard-style control panel. The project combines a React + MUI frontend with a Rust + Tauri backend, a local SQLite database, and lightweight HTTP/WebSocket services for status and communication endpoints.

## Overview

This app is designed to manage multiple display windows with different content types such as static images, dynamic video, and screen-share sources. It provides a single control surface for creating, selecting, enabling, and inspecting windows, while the backend persists configuration in SQLite and exposes health/status data.

## Features

- Window management dashboard
  - Add, select, edit, and delete display windows
  - Toggle individual windows on/off
  - Toggle all windows at once
- Static and dynamic window types
  - Static image windows
  - Dynamic video windows
  - Screen share windows
- Detailed window inspection panel
  - Name, ID, type, resolution, position, and status
- Local persistence using SQLite
- Tauri desktop shell with a frontend built in React and MUI
- Backend APIs for health checks and LED status retrieval
- WebSocket echo server for live message handling

## Tech Stack

- Frontend: React 19, Vite, Material UI
- Desktop shell: Tauri 2
- Backend: Rust, Tokio, Axum
- Persistence: SQLite via rusqlite
- Real-time communication: tokio-tungstenite

## Project Structure

```text
LED_TRACKER_APP/
├── src/                          # React frontend
│   ├── components/               # Dashboard widgets and controls
│   ├── screen/                   # Main application layout
│   ├── App.jsx                  # App entry
│   └── main.jsx                 # Frontend bootstrap
├── src-tauri/                   # Tauri/Rust application
│   ├── src/
│   │   ├── database/             # SQLite setup and schema
│   │   ├── modules/              # API, socket, and backend modules
│   │   ├── lib.rs                # Tauri app bootstrap
│   │   └── main.rs               # Application entry
│   └── Cargo.toml                # Rust dependencies
├── public/                      # Static assets
├── package.json                 # Frontend scripts and dependencies
├── vite.config.js               # Vite configuration
├── index.html                   # App HTML shell
├── README.md                    # Project documentation
└── .gitignore                   # Git ignore rules
```

## Backend API

The Rust backend exposes lightweight endpoints:

- `GET /health` — Health check endpoint
- `GET /api/led/status` — Returns a JSON status object with LED state and power values
- Fallback 404 handler for invalid routes

Example health response:

```json
{
  "success": true,
  "message": "LED backend is running",
  "data": "OK"
}
```

The app also starts a WebSocket server on `ws://0.0.0.0:9001` that echoes incoming text messages back to the client.

## Local Database

The app initializes a local SQLite database at:

```text
src-tauri/data/LED CONTROL PANEL.db
```

The database contains a `window` table with fields for:

- `id`
- `name`
- `height`
- `width`
- `position_x`
- `position_y`
- `status`

## Prerequisites

Before running the app, ensure you have:

- Node.js 18 or newer
- npm
- Rust stable toolchain and Cargo
- Tauri platform dependencies for your operating system

## Getting Started

1. Install frontend dependencies:

```bash
npm install
```

2. Start the development app:

```bash
npm run tauri dev
```

3. Optional: build the app for production:

```bash
npm run tauri build
```

## Development Notes

This project is currently structured as an early-stage desktop control panel. The frontend is fully styled for a dashboard experience, while the backend provides the foundation for persistence and status APIs that can be extended for real hardware control or richer LED management features.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri VS Code extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

This project does not currently declare a license. Add a license file if you plan to distribute or publish the application.
