import React, { useState } from "react";

import {
  Box,
  Typography,
  Stack,
  Switch,
  IconButton,
  Tooltip,
} from "@mui/material";

import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import MonitorIcon from "@mui/icons-material/Monitor";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircle";
import SettingsPowerIcon from "@mui/icons-material/SettingsPower";
import DashboardIcon from "@mui/icons-material/Dashboard";

// --------------------------------------------------
// INITIAL WINDOW DATA
// --------------------------------------------------

const initialWindows = [
  {
    id: "WIN-001",
    name: "Static Window RGB",
    type: "Static",
    enabled: true,
  },
  {
    id: "WIN-002",
    name: "Static Window CMYK",
    type: "Static",
    enabled: true,
  },
  {
    id: "WIN-003",
    name: "Dynamic Window 02",
    type: "Dynamic",
    enabled: true,
  },
  {
    id: "WIN-004",
    name: "Live Dashboard Window",
    type: "Dashboard",
    enabled: true,
  },
];

// --------------------------------------------------
// RESPONSIVE CUSTOM SWITCH
// --------------------------------------------------

function WindowSwitch({
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      disableRipple
      sx={{
        // Responsive switch dimensions
        width: {
          xs: 30,
          sm: 34,
          md: 36,
        },

        minWidth: {
          xs: 30,
          sm: 34,
          md: 36,
        },

        height: {
          xs: 18,
          sm: 20,
          md: 22,
        },

        p: 0,

        flexShrink: 0,

        overflow: "hidden",

        "& .MuiSwitch-switchBase": {
          p: "2px",

          transition: "transform 180ms ease",

          "&.Mui-checked": {
            // Responsive thumb movement
            transform: {
              xs: "translateX(12px)",
              sm: "translateX(14px)",
              md: "translateX(14px)",
            },

            color: "#ffffff",

            "& + .MuiSwitch-track": {
              bgcolor: "#00c96b",
              opacity: 1,
              border: "1px solid #00c96b",
            },
          },

          "&.Mui-disabled": {
            opacity: 0.45,
          },
        },

        "& .MuiSwitch-thumb": {
          width: {
            xs: 14,
            sm: 16,
            md: 18,
          },

          height: {
            xs: 14,
            sm: 16,
            md: 18,
          },

          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        },

        "& .MuiSwitch-track": {
          borderRadius: 999,

          bgcolor: "#475569",

          border: "1px solid #475569",

          opacity: 1,

          transition: "background-color 180ms ease",
        },
      }}
    />
  );
}

// --------------------------------------------------
// WINDOW ICON (by window type)
// --------------------------------------------------

function WindowTypeIcon({ type }) {
  if (type === "Static") {
    return (
      <MonitorIcon
        sx={{
          fontSize: {
            xs: 14,
            sm: 16,
            md: 18,
          },

          color: "#e2e8f0",
        }}
      />
    );
  }

  if (type === "Dashboard") {
    return (
      <DashboardIcon
        sx={{
          fontSize: {
            xs: 14,
            sm: 16,
            md: 18,
          },

          color: "#e2e8f0",
        }}
      />
    );
  }

  return (
    <PlayCircleOutlineIcon
      sx={{
        fontSize: {
          xs: 15,
          sm: 17,
          md: 19,
        },

        color: "#e2e8f0",
      }}
    />
  );
}

// --------------------------------------------------
// RESPONSIVE WINDOW ITEM
// --------------------------------------------------

function WindowItem({
  windowData,
  onToggle,
}) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,

        // Responsive item height
        height: {
          xs: 34,
          sm: 38,
          md: 40,
        },

        minHeight: {
          xs: 34,
          sm: 38,
          md: 40,
        },

        px: {
          xs: 0.5,
          sm: 0.75,
          md: 1,
        },

        display: "flex",

        alignItems: "center",

        gap: {
          xs: 0.5,
          sm: 0.75,
          md: 1,
        },

        bgcolor: "#172333",

        border: "1px solid #26364b",

        borderRadius: {
          xs: 1,
          sm: 1.25,
        },

        boxSizing: "border-box",

        overflow: "hidden",

        flexShrink: 0,

        transition: "background-color 150ms ease",

        "&:hover": {
          bgcolor: "#1d2b3d",
        },
      }}
    >
      {/* RESPONSIVE WINDOW ICON */}

      <Box
        sx={{
          width: {
            xs: 24,
            sm: 28,
            md: 32,
          },

          minWidth: {
            xs: 24,
            sm: 28,
            md: 32,
          },

          height: {
            xs: 20,
            sm: 22,
            md: 24,
          },

          flexShrink: 0,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          bgcolor: "#15243a",

          border: "1px solid #475569",

          borderRadius: 0.75,

          boxSizing: "border-box",
        }}
      >
        <WindowTypeIcon type={windowData.type} />
      </Box>

      {/* RESPONSIVE WINDOW NAME */}

      <Typography
        sx={{
          flex: "1 1 0",

          minWidth: 0,

          fontSize: {
            xs: 9,
            sm: 10,
            md: 11,
          },

          fontWeight: 500,

          color: windowData.enabled
            ? "#e2e8f0"
            : "#64748b",

          whiteSpace: "nowrap",

          overflow: "hidden",

          textOverflow: "ellipsis",

          lineHeight: 1.2,
        }}
        title={windowData.name}
      >
        {windowData.name}
      </Typography>

      {/* RESPONSIVE WINDOW SWITCH */}

      <WindowSwitch
        checked={windowData.enabled}
        onChange={(event) =>
          onToggle(windowData.id, event.target.checked)
        }
      />
    </Box>
  );
}

// --------------------------------------------------
// WINDOW CONTROL
// --------------------------------------------------

function WindowControl({
  onWindowToggle,
  onAllWindowsToggle,
}) {
  const [windows, setWindows] = useState(initialWindows);

  // ----------------------------------------------
  // MASTER STATE
  // ----------------------------------------------

  const allWindowsEnabled =
    windows.length > 0 &&
    windows.every((windowData) => windowData.enabled);

  const someWindowsEnabled =
    windows.some((windowData) => windowData.enabled);

  // ----------------------------------------------
  // TOGGLE ALL WINDOWS
  // ----------------------------------------------

  const handleToggleAll = (event) => {
    const enabled = event.target.checked;

    setWindows((previous) =>
      previous.map((windowData) => ({
        ...windowData,
        enabled,
      }))
    );

    onAllWindowsToggle?.(enabled);

    windows.forEach((windowData) => {
      onWindowToggle?.(windowData.id, enabled);
    });
  };

  // ----------------------------------------------
  // TOGGLE INDIVIDUAL WINDOW
  // ----------------------------------------------

  const handleToggleWindow = (windowId, enabled) => {
    setWindows((previous) =>
      previous.map((windowData) =>
        windowData.id === windowId
          ? {
              ...windowData,
              enabled,
            }
          : windowData
      )
    );

    onWindowToggle?.(windowId, enabled);
  };

  // ----------------------------------------------
  // UI
  // ----------------------------------------------

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,

        // Responsive parent height
        height: "clamp(220px, 32vh, 320px)",

        minHeight: 260,
        maxHeight: 260,

        display: "flex",

        flexDirection: "column",

        bgcolor: "#151f2d",

        border: "1px solid #263447",

        borderRadius: 1.5,

        p: {
          xs: 0.5,
          sm: 0.75,
        },

        boxSizing: "border-box",

        overflow: "hidden",
      }}
    >
      {/* HEADER */}

      <Stack
        direction="row"
        alignItems="center"
        spacing={{
          xs: 0.4,
          sm: 0.5,
        }}
        sx={{
          width: "100%",
          minWidth: 0,

          px: 0.25,

          mb: {
            xs: 0.4,
            sm: 0.5,
            md: 0.75,
          },

          flexShrink: 0,

          overflow: "hidden",
        }}
      >
        <SettingsPowerIcon
          sx={{
            fontSize: {
              xs: 16,
              sm: 18,
              md: 20,
            },

            color: "#e2e8f0",

            flexShrink: 0,
          }}
        />

        <Typography
          sx={{
            minWidth: 0,

            fontSize: {
              xs: 12,
              sm: 13,
              md: 15,
            },

            fontWeight: 700,

            color: "#e2e8f0",

            lineHeight: 1.2,

            whiteSpace: "nowrap",

            overflow: "hidden",

            textOverflow: "ellipsis",
          }}
        >
          Window Controls
        </Typography>
      </Stack>

      {/* MASTER POWER CONTROL */}

      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,

          // Responsive master height
          height: {
            xs: 28,
            sm: 30,
            md: 32,
          },

          minHeight: {
            xs: 28,
            sm: 30,
            md: 32,
          },

          px: {
            xs: 0.4,
            sm: 0.5,
            md: 0.75,
          },

          display: "flex",

          alignItems: "center",

          gap: {
            xs: 0.5,
            sm: 0.75,
            md: 1,
          },

          bgcolor: "#1b2939",

          border: "1px solid #26364b",

          borderRadius: 1.25,

          flexShrink: 0,

          mb: {
            xs: 0.4,
            sm: 0.5,
            md: 0.75,
          },

          boxSizing: "border-box",

          overflow: "hidden",
        }}
      >
        {/* POWER BUTTON */}

        <Tooltip
          title={
            allWindowsEnabled
              ? "Turn all windows off"
              : "Turn all windows on"
          }
        >
          <IconButton
            onClick={() =>
              handleToggleAll({
                target: {
                  checked: !allWindowsEnabled,
                },
              })
            }
            disableRipple
            sx={{
              width: {
                xs: 24,
                sm: 26,
                md: 28,
              },

              minWidth: {
                xs: 24,
                sm: 26,
                md: 28,
              },

              height: {
                xs: 24,
                sm: 26,
                md: 28,
              },

              p: 0,

              flexShrink: 0,

              color: allWindowsEnabled
                ? "#00e676"
                : "#64748b",

              "&:hover": {
                bgcolor: "rgba(0,230,118,0.08)",
              },
            }}
          >
            <PowerSettingsNewIcon
              sx={{
                fontSize: {
                  xs: 17,
                  sm: 19,
                  md: 22,
                },

                filter: allWindowsEnabled
                  ? "drop-shadow(0 0 5px rgba(0,230,118,0.5))"
                  : "none",
              }}
            />
          </IconButton>
        </Tooltip>

        {/* MASTER LABEL */}

        <Typography
          sx={{
            flex: "1 1 0",

            minWidth: 0,

            fontSize: {
              xs: 9,
              sm: 10,
              md: 11,
            },

            fontWeight: 700,

            color: "#e2e8f0",

            whiteSpace: "nowrap",

            overflow: "hidden",

            textOverflow: "ellipsis",

            lineHeight: 1.2,
          }}
        >
          All Windows{" "}
          {allWindowsEnabled
            ? "ON"
            : someWindowsEnabled
              ? "PARTIAL"
              : "OFF"}
        </Typography>

        {/* MASTER SWITCH */}

        <WindowSwitch
          checked={allWindowsEnabled}
          onChange={handleToggleAll}
        />
      </Box>

      {/* INDIVIDUAL WINDOWS */}

      <Stack
        spacing={{
          xs: 0.35,
          sm: 0.4,
          md: 0.5,
        }}
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,

          flex: "1 1 0",

          minHeight: 0,

          boxSizing: "border-box",

          overflowX: "hidden",
          overflowY: "auto",

          scrollbarWidth: "thin",

          "&::-webkit-scrollbar": {
            width: 4,
          },

          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#334155",
            borderRadius: 4,
          },
        }}
      >
        {windows.map((windowData) => (
          <WindowItem
            key={windowData.id}
            windowData={windowData}
            onToggle={handleToggleWindow}
          />
        ))}
      </Stack>
    </Box>
  );
}

export default WindowControl; 