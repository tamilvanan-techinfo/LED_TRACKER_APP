import { useEffect, useState } from "react";
import {
  AppBar as MuiAppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Stack,
  Tooltip,
  Button,
  Popover,
  Switch,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";

import BoltIcon from "@mui/icons-material/Bolt";
import MinimizeIcon from "@mui/icons-material/Remove";
import MaximizeIcon from "@mui/icons-material/CropSquare";
import CloseIcon from "@mui/icons-material/Close";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import TuneIcon from "@mui/icons-material/Tune";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { keyframes } from "@mui/system";

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { palette } from "../utils/theme";

// --------------------------------------------------
// ANIMATION
// --------------------------------------------------

const glowPulse = keyframes`
  0% {
    box-shadow:
      0 0 2px rgba(34, 224, 107, 0.35),
      0 0 5px rgba(34, 224, 107, 0.15);

    opacity: 0.75;
    transform: scale(0.92);
  }

  50% {
    box-shadow:
      0 0 5px rgba(34, 224, 107, 0.85),
      0 0 12px rgba(34, 224, 107, 0.45),
      0 0 20px rgba(34, 224, 107, 0.2);

    opacity: 1;
    transform: scale(1.12);
  }

  100% {
    box-shadow:
      0 0 2px rgba(34, 224, 107, 0.35),
      0 0 5px rgba(34, 224, 107, 0.15);

    opacity: 0.75;
    transform: scale(0.92);
  }
`;

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

// Works controlled (value + onChange) or uncontrolled (defaultValue)
function useControllableState(value, defaultValue, onChange) {
  const [inner, setInner] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;

  const set = (next) => {
    if (!isControlled) setInner(next);
    if (onChange) onChange(next);
  };

  return [current, set];
}

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: palette.primary,
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: palette.primary,
    opacity: 0.5,
  },
};

// --------------------------------------------------
// PERSISTENCE
// --------------------------------------------------

const IS_PLAYLIST_KEY = "is_playlist";
const PLAYLIST_DURATION_KEY = "playlist_duration";

export const DEFAULT_PLAYLIST_DURATION = 5; // seconds per color
export const MIN_PLAYLIST_DURATION = 1;
export const MAX_PLAYLIST_DURATION = 3600;

const isValidDuration = (value) =>
  Number.isInteger(value) &&
  value >= MIN_PLAYLIST_DURATION &&
  value <= MAX_PLAYLIST_DURATION;

function writeIsPlaylist(value) {
  try {
    localStorage.setItem(IS_PLAYLIST_KEY, String(value));
  } catch {
    // ignore write failures; the UI state still works for this session
  }
}

// Gets is_playlist from localStorage.
// If it doesn't exist (first launch) or is invalid, it is created
// with the default (playlist mode = true) and that default is returned.
export function readIsPlaylist(defaultValue = true) {
  try {
    const raw = localStorage.getItem(IS_PLAYLIST_KEY);

    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    // localStorage can throw (privacy mode, disabled storage)
    return defaultValue;
  }

  // Missing or corrupted value -> create it in playlist mode
  writeIsPlaylist(defaultValue);
  return defaultValue;
}

function writePlaylistDuration(value) {
  try {
    localStorage.setItem(PLAYLIST_DURATION_KEY, String(value));
  } catch {
    // ignore write failures; the UI state still works for this session
  }
}

// Gets playlist_duration (seconds per color) from localStorage.
// If it doesn't exist or is invalid, it is created with the default (5).
export function readPlaylistDuration(defaultValue = DEFAULT_PLAYLIST_DURATION) {
  try {
    const raw = localStorage.getItem(PLAYLIST_DURATION_KEY);
    const parsed = Number(raw);

    if (raw !== null && isValidDuration(parsed)) return parsed;
  } catch {
    return defaultValue;
  }

  writePlaylistDuration(defaultValue);
  return defaultValue;
}

// Tells the socket server the current mode so it can push is_playlist
// to every connected window (true = playlist, false = quick color)
function notifyPlaylistMode(isPlaylist) {
  invoke("set_is_playlist", { isPlaylist }).catch((error) => {
    console.error("Failed to send is_playlist to the socket server:", error);
  });
}

// Tells the socket server how many seconds each playlist color is shown
function notifyPlaylistDuration(playlistDuration) {
  invoke("set_playlist_duration", { playlistDuration }).catch((error) => {
    console.error("Failed to send playlist duration to the socket server:", error);
  });
}

// --------------------------------------------------
// STATUS ITEM
// --------------------------------------------------

function StatusItem({ label, value, active = true }) {
  const color = active ? palette.primary : palette.danger;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      data-tauri-drag-region
      sx={{
        whiteSpace: "nowrap",
      }}
    >
      {/* STATUS INDICATOR */}

      <Box
        sx={{
          width: 8,
          height: 8,

          flexShrink: 0,

          borderRadius: "50%",

          bgcolor: color,

          boxShadow: active ? `0 0 6px ${color}` : "none",

          animation: active
            ? `${glowPulse} 2s ease-in-out infinite`
            : "none",

          transition: "background-color 200ms ease",

          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
          },
        }}
      />

      {/* STATUS LABEL */}

      <Typography
        data-tauri-drag-region
        sx={{
          fontSize: 12,
          fontWeight: 500,

          color: palette.textPrimary,

          lineHeight: 1,
        }}
      >
        {label}:

        <Box
          component="span"
          sx={{
            ml: 0.5,

            color,

            fontWeight: 600,

            transition: "color 200ms ease",
          }}
        >
          {value}
        </Box>
      </Typography>
    </Stack>
  );
}

// --------------------------------------------------
// DIVIDER
// --------------------------------------------------

function StatusDivider() {
  return (
    <Box
      data-tauri-drag-region
      sx={{
        width: "2px",
        height: 18,
        bgcolor: palette.border,
        flexShrink: 0,
      }}
    />
  );
}

// --------------------------------------------------
// WINDOW CONTROL BUTTON
// --------------------------------------------------

function WindowButton({ onClick, children, label, danger = false }) {
  return (
    <Tooltip title={label} placement="bottom">
      <IconButton
        aria-label={label}
        onClick={onClick}
        disableRipple
        sx={{
          width: 42,
          height: 40,
          borderRadius: 0,
          color: palette.textSecondary,
          transition: "background-color 120ms ease",

          "&:hover": {
            bgcolor: danger ? "#dc2626" : "rgba(255,255,255,0.08)",
            color: "#ffffff",
          },

          "&:active": {
            bgcolor: danger ? "#b91c1c" : "rgba(255,255,255,0.12)",
          },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

// --------------------------------------------------
// CONTROLS DROPDOWN
// --------------------------------------------------

function ControlsDropdown({
  modbusReading,
  onModbusReadingChange,
  contentMode,
  onContentModeChange,
  playlistDuration,
  onPlaylistDurationChange,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const isQuickColor = contentMode === "quickColor";

  // Draft text so the user can type freely; committed on blur / Enter
  const [durationDraft, setDurationDraft] = useState(String(playlistDuration));

  useEffect(() => {
    setDurationDraft(String(playlistDuration));
  }, [playlistDuration]);

  const parsedDraft = durationDraft === "" ? NaN : Number(durationDraft);
  const isDraftValid = isValidDuration(parsedDraft);

  const commitDuration = () => {
    if (isDraftValid) {
      if (parsedDraft !== playlistDuration) onPlaylistDurationChange(parsedDraft);
    } else {
      // Invalid input: restore the last good value
      setDurationDraft(String(playlistDuration));
    }
  };

  return (
    <>
      {/* TRIGGER */}

      <Button
        disableRipple
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        startIcon={<TuneIcon sx={{ fontSize: 16 }} />}
        endIcon={
          <KeyboardArrowDownIcon
            sx={{
              fontSize: 18,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 150ms ease",
            }}
          />
        }
        sx={{
          height: 28,
          px: 1.25,
          mr: 1,

          textTransform: "none",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",

          color: palette.textPrimary,
          bgcolor: open ? "rgba(255,255,255,0.08)" : "transparent",
          border: `1px solid ${palette.border}`,
          borderRadius: 1,

          "&:hover": {
            bgcolor: "rgba(255,255,255,0.08)",
          },
        }}
      >
        Controls
      </Button>

      {/* DROPDOWN PANEL */}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              minWidth: 290,

              bgcolor: palette.bgPanel,
              backgroundImage: "none",
              color: palette.textPrimary,

              border: `1px solid ${palette.border}`,
              borderRadius: 1.5,
            },
          },
        }}
      >
        {/* MODBUS READ SWITCH */}

        <Stack
          direction="row"
          spacing={2}
          sx={{
            px: 2,
            py: 1.5,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              Read Modbus Data
            </Typography>

            <Typography
              sx={{
                fontSize: 11,
                color: palette.textMuted,
                mt: 0.25,
              }}
            >
              {modbusReading ? "Reading live values" : "Reading paused"}
            </Typography>
          </Box>

          <Switch
            checked={modbusReading}
            onChange={(event) => onModbusReadingChange(event.target.checked)}
            inputProps={{ "aria-label": "Read Modbus data" }}
            sx={switchSx}
          />
        </Stack>

        <Divider sx={{ borderColor: palette.border }} />

        {/* PLAYLIST / QUICK COLOR SWITCH */}

        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.6,
              color: palette.textMuted,
              mb: 0.5,
            }}
          >
            CONTENT MODE
          </Typography>

          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "center",
            }}
            spacing={0.5}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: !isQuickColor ? palette.primary : palette.textMuted,
                transition: "color 150ms ease",
              }}
            >
              Playlist
            </Typography>

            <Switch
              checked={isQuickColor}
              onChange={(event) =>
                onContentModeChange(
                  event.target.checked ? "quickColor" : "playlist"
                )
              }
              inputProps={{ "aria-label": "Playlist or quick color mode" }}
              sx={switchSx}
            />

            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: isQuickColor ? palette.primary : palette.textMuted,
                transition: "color 150ms ease",
              }}
            >
              Quick Color
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: palette.border }} />

        {/* PLAYLIST DURATION (seconds per color) */}

        <Stack
          direction="row"
          spacing={2}
          sx={{
            px: 2,
            py: 1.5,
            alignItems: "center",
            justifyContent: "space-between",
            opacity: isQuickColor ? 0.5 : 1,
            transition: "opacity 150ms ease",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              Playlist Duration
            </Typography>

            <Typography
              sx={{
                fontSize: 11,
                color: isDraftValid ? palette.textMuted : palette.danger,
                mt: 0.25,
              }}
            >
              {isDraftValid
                ? `${playlistDuration} s per color`
                : `Enter ${MIN_PLAYLIST_DURATION}–${MAX_PLAYLIST_DURATION} seconds`}
            </Typography>
          </Box>

          <TextField
            size="small"
            value={durationDraft}
            disabled={isQuickColor}
            error={!isDraftValid}
            onChange={(event) =>
              setDurationDraft(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            onBlur={commitDuration}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.querySelector("input")?.blur();
            }}
            inputProps={{
              inputMode: "numeric",
              "aria-label": "Playlist duration per color in seconds",
              style: { textAlign: "right" },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Typography sx={{ fontSize: 11, color: palette.textMuted }}>
                    sec
                  </Typography>
                </InputAdornment>
              ),
            }}
            sx={{
              width: 96,
              "& .MuiOutlinedInput-root": {
                height: 30,
                fontSize: 13,
                color: palette.textPrimary,
                "& fieldset": { borderColor: palette.border },
                "&:hover fieldset": { borderColor: palette.textMuted },
                "&.Mui-focused fieldset": { borderColor: palette.primary },
              },
              "& input": { py: "5px", px: "8px" },
            }}
          />
        </Stack>
      </Popover>
    </>
  );
}

// --------------------------------------------------
// APP BAR
// --------------------------------------------------

export default function AppBar({
  title = "LED POWER TRACKER",

  ledConnected = true,
  modbusConnected = true,
  liveMonitoring = true,

  // Dropdown state (controlled if provided, otherwise managed internally)
  modbusReading,
  onModbusReadingChange,
  contentMode, // "playlist" | "quickColor"
  onContentModeChange,
  onPlaylistDurationChange, // optional: (seconds) => void
}) {
  const appWindow = getCurrentWindow();

  const [isModbusReading, setModbusReading] = useControllableState(
    modbusReading,
    true,
    onModbusReadingChange
  );

  // is_playlist: read from localStorage on mount (created in playlist mode
  // if it doesn't exist yet) and persisted on every change
  const isModeControlled = contentMode !== undefined;
  const [storedIsPlaylist, setStoredIsPlaylist] = useState(() =>
    readIsPlaylist(true)
  );

  const isPlaylist = isModeControlled
    ? contentMode === "playlist"
    : storedIsPlaylist;

  const currentMode = isPlaylist ? "playlist" : "quickColor";

  // playlist_duration (seconds per color): read from localStorage on mount
  // (created with the default of 5 if missing) and persisted on every change
  const [playlistDuration, setPlaylistDurationState] = useState(() =>
    readPlaylistDuration()
  );

  // Whenever the mode changes (and once on startup), push it to the socket
  // server so every window receives is_playlist (false = quick color).
  // Works in both controlled and uncontrolled mode.
  useEffect(() => {
    notifyPlaylistMode(isPlaylist);
  }, [isPlaylist]);

  // Same for the duration: pushed on startup and whenever it changes
  useEffect(() => {
    notifyPlaylistDuration(playlistDuration);
  }, [playlistDuration]);

  const setContentMode = (mode) => {
    const next = mode === "playlist";
    writeIsPlaylist(next); // always persist
    if (!isModeControlled) setStoredIsPlaylist(next);
    if (onContentModeChange) onContentModeChange(mode);
  };

  const setPlaylistDuration = (seconds) => {
    if (!isValidDuration(seconds)) return;
    writePlaylistDuration(seconds); // always persist
    setPlaylistDurationState(seconds);
    if (onPlaylistDurationChange) onPlaylistDurationChange(seconds);
  };

  return (
    <MuiAppBar
      position="static"
      elevation={0}
      data-tauri-drag-region
      sx={{
        height: 42,
        minHeight: 42,

        bgcolor: palette.bgApp,

        borderBottom: `1px solid ${palette.border}`,

        backgroundImage: "none",

        userSelect: "none",
        WebkitUserSelect: "none",

        color: palette.textPrimary,
      }}
    >
      <Toolbar
        disableGutters
        data-tauri-drag-region
        sx={{
          height: 42,
          minHeight: "42px !important",

          px: 2,

          display: "flex",
          alignItems: "center",

          gap: 2,
        }}
      >
        {/* -------------------------------- */}
        {/* LEFT: APPLICATION LOGO */}
        {/* -------------------------------- */}

        <Stack
          direction="row"
          spacing={1.25}
          data-tauri-drag-region
          sx={{
            flex: "1 1 0",
            minWidth: 0,
            alignItems: "center",
          }}
        >
          <BoltIcon
            sx={{
              fontSize: 30,
              color: palette.primary,

              filter: `drop-shadow(0 0 5px ${palette.primary})`,
            }}
          />

          <Typography
            data-tauri-drag-region
            sx={{
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 0.45,

              color: palette.textPrimary,

              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
        </Stack>

        {/* -------------------------------- */}
        {/* CENTER: CONNECTION STATUS */}
        {/* -------------------------------- */}

        <Stack
          direction="row"
          spacing={1.5}
          data-tauri-drag-region
          sx={{
            px: 2,
            py: 1,

            borderRadius: 999,

            bgcolor: palette.bgPanel,

            flexShrink: 0,
            alignItems: "center",
          }}
        >
          {/* LED CONTROLLER */}

          <StatusItem
            label="LED Controller"
            value={ledConnected ? "Connected" : "Disconnected"}
            active={ledConnected}
          />

          <StatusDivider />

          {/* MODBUS */}

          <StatusItem
            label="Modbus"
            value={modbusConnected ? "Connected" : "Disconnected"}
            active={modbusConnected}
          />

          <StatusDivider />

          {/* LIVE MONITORING */}

          <Stack
            direction="row"
            spacing={0.75}
            data-tauri-drag-region
            sx={{
              whiteSpace: "nowrap",
              alignItems: "center",
            }}
          >
            <MonitorHeartIcon
              sx={{
                fontSize: 16,

                color: liveMonitoring ? palette.primary : palette.textMuted,
              }}
            />

            <Typography
              data-tauri-drag-region
              sx={{
                fontSize: 12,
                fontWeight: 600,

                color: liveMonitoring ? palette.primary : palette.textMuted,
              }}
            >
              Live Monitoring
            </Typography>
          </Stack>
        </Stack>

        {/* -------------------------------- */}
        {/* RIGHT: DROPDOWN + WINDOW CONTROLS */}
        {/* -------------------------------- */}

        <Stack
          direction="row"
          sx={{
            flex: "1 1 0",
            minWidth: 0,
            ml: 1,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {/* CONTROLS DROPDOWN */}

          <ControlsDropdown
            modbusReading={isModbusReading}
            onModbusReadingChange={setModbusReading}
            contentMode={currentMode}
            onContentModeChange={setContentMode}
            playlistDuration={playlistDuration}
            onPlaylistDurationChange={setPlaylistDuration}
          />

          {/* MINIMIZE */}

          <WindowButton label="Minimize" onClick={() => appWindow.minimize()}>
            <MinimizeIcon sx={{ fontSize: 17 }} />
          </WindowButton>

          {/* MAXIMIZE / RESTORE */}

          <WindowButton
            label="Maximize / Restore"
            onClick={() => appWindow.toggleMaximize()}
          >
            <MaximizeIcon sx={{ fontSize: 15 }} />
          </WindowButton>

          {/* CLOSE */}

          <WindowButton label="Close" danger onClick={() => appWindow.close()}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </WindowButton>
        </Stack>
      </Toolbar>
    </MuiAppBar>
  );
}