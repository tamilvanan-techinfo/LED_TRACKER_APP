
import {
  AppBar as MuiAppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";

import BoltIcon from "@mui/icons-material/Bolt";
import MinimizeIcon from "@mui/icons-material/Remove";
import MaximizeIcon from "@mui/icons-material/CropSquare";
import CloseIcon from "@mui/icons-material/Close";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import MonitorIcon from "@mui/icons-material/Monitor";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { keyframes } from "@mui/system";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { palette } from "../utils/theme";

// --------------------------------------------------
// STATUS ITEM
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
// STATUS ITEM
// --------------------------------------------------

function StatusItem({
  label,
  value,
  active = true,
}) {
  const color = active
    ? palette.primary
    : palette.danger;

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

          boxShadow: active
            ? `0 0 6px ${color}`
            : "none",

          animation: active
            ? `${glowPulse} 2s ease-in-out infinite`
            : "none",

          transition:
            "background-color 200ms ease",

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

            transition:
              "color 200ms ease",
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

function WindowButton({
  onClick,
  children,
  label,
  danger = false,
}) {
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
            bgcolor: danger
              ? "#dc2626"
              : "rgba(255,255,255,0.08)",
            color: "#ffffff",
          },

          "&:active": {
            bgcolor: danger
              ? "#b91c1c"
              : "rgba(255,255,255,0.12)",
          },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
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
}) {
  const appWindow = getCurrentWindow();

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
            alignItems: "center"
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

            bgcolor: 'palette.bgPanel',


            flexShrink: 0,
          alignItems: "center"

          }}
        >
          {/* LED CONTROLLER */}

          <StatusItem
            label="LED Controller"
            value={
              ledConnected
                ? "Connected"
                : "Disconnected"
            }
            active={ledConnected}
          />

          <StatusDivider />

          {/* MODBUS */}

          <StatusItem
            label="Modbus"
            value={
              modbusConnected
                ? "Connected"
                : "Disconnected"
            }
            active={modbusConnected}
          />

          <StatusDivider />

          {/* LIVE MONITORING */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            data-tauri-drag-region
            sx={{
              whiteSpace: "nowrap",
            }}
          >
            <MonitorHeartIcon
              sx={{
                fontSize: 16,

                color: liveMonitoring
                  ? palette.primary
                  : palette.textMuted,
              }}
            />

            <Typography
              data-tauri-drag-region
              sx={{
                fontSize: 12,
                fontWeight: 600,

                color: liveMonitoring
                  ? palette.primary
                  : palette.textMuted,
              }}
            >
              Live Monitoring
            </Typography>
          </Stack>
        </Stack>

        {/* -------------------------------- */}
        {/* RIGHT: WINDOW CONTROLS */}
        {/* -------------------------------- */}

        <Stack
          direction="row"
          
          sx={{
            flex: "1 1 0",
            minWidth: 0,
            ml: 1,
            alignItems: "center",
            justifyContent: "flex-end"
          }}
        >
          {/* MINIMIZE */}

          <WindowButton
            label="Minimize"
            onClick={() => appWindow.minimize()}
          >
            <MinimizeIcon
              sx={{
                fontSize: 17,
              }}
            />
          </WindowButton>

          {/* MAXIMIZE / RESTORE */}

          <WindowButton
            label="Maximize / Restore"
            onClick={() => appWindow.toggleMaximize()}
          >
            <MaximizeIcon
              sx={{
                fontSize: 15,
              }}
            />
          </WindowButton>

          {/* CLOSE */}

          <WindowButton
            label="Close"
            danger
            onClick={() => appWindow.close()}
          >
            <CloseIcon
              sx={{
                fontSize: 18,
              }}
            />
          </WindowButton>
        </Stack>
      </Toolbar>
    </MuiAppBar>
  );
}
