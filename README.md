# LED Tracker App

A desktop application for configuring LED display windows and monitoring them
from a dashboard. The frontend is built with React and Material UI, the desktop
shell and backend use Tauri and Rust, and window configuration is stored in
SQLite.

## Features

- Create, edit, select, enable, and delete LED display windows
- View window type, resolution, position, and status
- Persist window configuration locally in SQLite
- Communicate with the Rust backend through Tauri commands, HTTP, and WebSocket

## Technology

- Frontend: React 19, Vite, Material UI
- Desktop: Tauri 2
- Backend: Rust, Tokio, Axum
- Database: SQLite (`rusqlite`)
- WebSocket: `tokio-tungstenite`

## Project structure

```text
LED_TRACKER_APP/
├── public/                         # Static files served by Vite
├── src/                            # React frontend
│   ├── assets/                     # Frontend assets
│   ├── components/                 # Dashboard, window, and control panels
│   ├── context/                    # Shared React state
│   ├── screen/                     # Application screens (Dashboard)
│   ├── utils/                      # Frontend helpers and theme
│   ├── App.jsx                     # Application component
│   ├── App.css                     # Application styles
│   └── main.jsx                    # Frontend entry point
├── src-tauri/                      # Tauri desktop application
│   ├── capabilities/               # Tauri permissions
│   ├── data/                       # Local SQLite database
│   ├── icons/                      # Application icons
│   ├── src/
│   │   ├── database.rs             # Database module declaration
│   │   ├── database/
│   │   │   └── connection.rs       # SQLite setup, migrations, and connection
│   │   ├── modules.rs              # Backend module declarations
│   │   ├── modules/
│   │   │   ├── api.rs              # Tauri API module declaration
│   │   │   ├── api/
│   │   │   │   └── window_api.rs   # Tauri window commands
│   │   │   ├── response.rs         # Shared API response envelope
│   │   │   ├── server_api/
│   │   │   │   ├── handlers/       # Axum request handlers
│   │   │   │   ├── models/         # HTTP response models
│   │   │   │   ├── services/       # Database-backed window queries
│   │   │   │   ├── main.rs         # HTTP server startup
│   │   │   │   └── routes.rs       # HTTP route definitions
│   │   │   └── socket_server.rs    # WebSocket server and window resolution
│   │   ├── lib.rs                  # Tauri setup and service startup
│   │   ├── main.rs                 # Native application entry point
│   ├── Cargo.toml                  # Rust dependencies and build settings
│   ├── tauri.conf.json             # Tauri application configuration
│   └── build.rs                    # Tauri build script
├── package.json                    # Frontend dependencies and scripts
├── vite.config.js                  # Vite configuration
├── index.html                      # Frontend HTML shell
└── README.md
```

## Backend services

The desktop app starts an HTTP server at `http://127.0.0.1:8765` and a
WebSocket server at `ws://0.0.0.0:9001`.

### HTTP

- `GET http://127.0.0.1:8765/api/windows` — return the configured windows.

### Tauri commands

The `create_playlist_color` command saves a named color for a window in the
`playlist_color` table. Invoke it with a `playlist` object containing the
database window ID, name, and JSON color data:

```js
import { invoke } from "@tauri-apps/api/core";

await invoke("create_playlist_color", {
  playlist: {
    windowId: 1,
    name: "Warm orange",
    color: {
      hex: "#FF5521",
      c: 0,
      m: 67,
      y: 87,
      k: 0,
    },
  },
});
```

Saving a new color in the RGB or CMYK playlist dialog now invokes this command
for that tab's configured window ID.

The `get_playlist_colors` command lists saved colors for one window:

```js
const colors = await invoke("get_playlist_colors", { windowId: 2 });
```

`update_playlist_color` accepts `{ playlist: { id, name, color } }`.
`delete_playlist_color` accepts `{ id }`, and `clear_playlist_colors` accepts
`{ windowId }` to clear only that window's playlist. The color panel uses these
commands for edit, remove, and clear actions.

The color panel loads window `1` for the RGB playlist and window `2` for the
CMYK playlist when it opens.

### WebSocket

The root socket URL (`ws://127.0.0.1:9001/`) keeps the existing behavior: it
sends the current windows when a client connects, echoes text messages, and
receives messages broadcast by the app.

To get one window's resolution, connect using its database ID in the URL path:

```text
ws://127.0.0.1:9001/windows/{window_id}/resolution
```

For example:

```js
const socket = new WebSocket(
  "ws://127.0.0.1:9001/windows/1/resolution",
);

socket.addEventListener("message", ({ data }) => {
  console.log(JSON.parse(data));
});
```

The path accepts a numeric database ID (for example `1`) or the display ID
format used by the UI (for example `WIN-001`). On connection, the server sends
an envelope with the selected window's dimensions and formatted resolution:

```json
{
  "status": true,
  "message": "Window resolution retrieved",
  "data": {
    "windowId": 1,
    "name": "Static Window RGB",
    "width": 200,
    "height": 100,
    "resolution": "200 × 100"
  }
}
```

If the ID is invalid or does not exist, the server sends a response with
`"status": false` and an explanatory message.

To send data only to the client connected for a window, call the registered
Tauri `send_message` command. The `windowId` argument accepts either the
numeric database ID or its `WIN-###` display ID. For an image, pass its URL or
data URL as part of the message:

```js
import { invoke } from "@tauri-apps/api/core";

await invoke("send_message", {
  message: { type: "image", src: "data:image/png;base64,..." },
  windowId: "WIN-001",
});
```

The dashboard sends tab actions to their configured windows: RGB Static
Content uses ID `1`, CMYK Static Content uses ID `2`, and Dynamic Content uses
ID `3`.

The corresponding WebSocket must already be connected to that window's
resolution URL. The command returns the number of connected clients that
received the message, or an error if no client is connected for that ID.

## Local database

The backend creates and migrates `data/LED CONTROL PANEL.db` under the
application's working directory. The `window` table stores each window's ID,
category, name, height, width, position, and status.

## Getting started

Prerequisites: Node.js 18+, npm, Rust stable with Cargo, and the Tauri
platform dependencies for your operating system.

```bash
npm install
npm run tauri dev
```

To build the desktop application:

```bash
npm run tauri build
```
