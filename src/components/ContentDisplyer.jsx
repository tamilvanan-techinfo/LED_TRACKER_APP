import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";

import ImageIcon from "@mui/icons-material/Image";
import MonitorIcon from "@mui/icons-material/Monitor";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// --------------------------------------------------
// DEFAULT WINDOW LIST
// Pass your own `windows` prop to override this.
// Each window has a local `url` that is loaded in the preview area.
// The url is only used internally and is never shown in the UI.
// Change the ports to match your local servers.
// --------------------------------------------------

const DEFAULT_WINDOWS = [
  {
    id: "WIN-001",
    name: "Static Window RGB",
    type: "Static",
    enabled: true,
    resolution: "1920 × 1080",
    url: "http://localhost:3001",
  },
  {
    id: "WIN-002",
    name: "Static Window CMYK",
    type: "Static",
    enabled: true,
    resolution: "1920 × 1080",
    url: "http://localhost:3002",
  },
  {
    id: "WIN-003",
    name: "Dynamic Window 02",
    type: "Dynamic",
    enabled: true,
    resolution: "1920 × 1080",
    url: "http://localhost:3003",
  },
];

// --------------------------------------------------
// URL HELPER
// Lets you write "localhost:3001" or "127.0.0.1:8000/page"
// without the protocol. Addresses default to http://.
// --------------------------------------------------

function normalizeUrl(rawUrl) {
  const value = (rawUrl ?? "").trim();

  if (!value) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    return value;
  }

  return `http://${value}`;
}

// --------------------------------------------------
// LINK REACHABILITY HOOK
// status: "idle" | "checking" | "online" | "offline"
//
// Uses fetch with mode "no-cors": it succeeds when the server
// answers, and fails on connection refused (server not running),
// no network, or timeout.
// --------------------------------------------------

function useLinkStatus({
  url,
  enabled,
  retryKey,
  timeoutMs = 6000,
  recheckMs = 15000,
}) {
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!url || !enabled) {
      setStatus("idle");
      return undefined;
    }

    let cancelled = false;
    let retryTimer;

    const check = async (silent) => {
      if (!silent) {
        setStatus("checking");
      }

      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        timeoutMs
      );

      let reachable = false;

      try {
        await fetch(url, {
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal,
        });

        reachable = true;
      } catch {
        reachable = false;
      } finally {
        clearTimeout(timeout);
      }

      if (cancelled) {
        return;
      }

      setStatus(reachable ? "online" : "offline");

      // While offline, keep checking quietly so the content
      // comes back by itself when the server starts.
      if (!reachable && recheckMs > 0) {
        retryTimer = setTimeout(() => check(true), recheckMs);
      }
    };

    check(false);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [url, enabled, retryKey, timeoutMs, recheckMs]);

  return status;
}

// --------------------------------------------------
// TONES (colors used by the preview messages)
// --------------------------------------------------

const TONES = {
  error: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.35)",
  },
  muted: {
    color: "#64748b",
    bg: "rgba(100,116,139,0.12)",
    border: "rgba(100,116,139,0.35)",
  },
};

// --------------------------------------------------
// PREVIEW MESSAGE (offline / off / no source / connecting)
// --------------------------------------------------

function PreviewMessage({
  icon,
  tone = "muted",
  title,
  description,
  onRetry,
  loading = false,
}) {
  const palette = TONES[tone] ?? TONES.muted;

  return (
    <Stack
      role="status"
      aria-live="polite"
      
      spacing={1}
      sx={{
        position: "absolute",
        inset: 0,
        px: 2,
        textAlign: "center",
        bgcolor: "#0b1220",
        alignItems:"center",
      justifyContent:"center"
      }}
    >
      {/* ICON BADGE */}
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: loading ? "transparent" : palette.bg,
          border: loading ? "none" : `1px solid ${palette.border}`,
        }}
      >
        {loading ? (
          <CircularProgress size={28} sx={{ color: "#00c96b" }} />
        ) : (
          icon
        )}
      </Box>

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 700,
          color: "#e2e8f0",
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          sx={{
            maxWidth: 320,
            fontSize: 12,
            color: "#94a3b8",
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      )}

      {onRetry && (
        <Button
          size="small"
          onClick={onRetry}
          startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
          sx={{
            mt: 0.5,
            px: 1.5,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "none",
            color: "#e2e8f0",
            border: "1px solid #334155",
            borderRadius: 1,

            "&:hover": {
              bgcolor: "rgba(255,255,255,0.08)",
              borderColor: "#475569",
            },
          }}
        >
          Try again
        </Button>
      )}
    </Stack>
  );
}

// --------------------------------------------------
// LINK FRAME (shows the page from the link)
// --------------------------------------------------

function LinkFrame({ url, title, onFailed }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <iframe
        src={url}
        title={title}
        onLoad={() => setLoaded(true)}
        onError={onFailed}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerPolicy="no-referrer"
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
          background: "#ffffff",
        }}
      />

      {!loaded && (
        <PreviewMessage loading title="Loading content…" />
      )}
    </>
  );
}

// --------------------------------------------------
// STATUS CHIP STYLES
// --------------------------------------------------

const STATUS_CHIPS = {
  online: {
    label: "Active",
    color: "#00c96b",
    bg: "rgba(0,201,107,0.18)",
    border: "rgba(0,201,107,0.4)",
  },
  offline: {
    label: "Offline",
    color: "#f87171",
    bg: "rgba(248,113,113,0.15)",
    border: "rgba(248,113,113,0.4)",
  },
  checking: {
    label: "Connecting",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.15)",
    border: "rgba(251,191,36,0.4)",
  },
};

function ContentDisplyer({
  // List of windows shown in the dropdown
  windows = DEFAULT_WINDOWS,

  // Optional controlled selection (window id)
  selectedWindowId,

  // Called when the user picks a window in the dropdown
  onWindowChange,

  onFullscreen,
  onContentTypeChange,
}) {
  // Internal selection, used when selectedWindowId is not controlled
  const [internalWindowId, setInternalWindowId] = useState(
    windows[0]?.id ?? ""
  );

  // Changing this value forces a new reachability check
  const [retryKey, setRetryKey] = useState(0);

  // Set when the iframe itself reports an error
  const [frameFailed, setFrameFailed] = useState(false);

  const currentWindowId = selectedWindowId ?? internalWindowId;

  const selectedWindow =
    windows.find((windowData) => windowData.id === currentWindowId) ??
    windows[0];

  const url = normalizeUrl(selectedWindow?.url);
  const windowEnabled = selectedWindow?.enabled ?? false;
  const resolution = selectedWindow?.resolution ?? "1920 × 1080";

  const linkStatus = useLinkStatus({
    url,
    enabled: windowEnabled,
    retryKey,
  });

  const status = frameFailed ? "offline" : linkStatus;

  const handleWindowChange = (event) => {
    const nextId = event.target.value;

    setInternalWindowId(nextId);
    setFrameFailed(false);

    onWindowChange?.(
      nextId,
      windows.find((windowData) => windowData.id === nextId)
    );
  };

  const handleRetry = () => {
    setFrameFailed(false);
    setRetryKey((previous) => previous + 1);
  };

  const statusChip = windowEnabled ? STATUS_CHIPS[status] : null;

  // ----------------------------------------------
  // PREVIEW CONTENT
  // ----------------------------------------------

  const renderPreview = () => {
    if (!windowEnabled) {
      return (
        <PreviewMessage
          tone="muted"
          icon={
            <PowerSettingsNewIcon
              sx={{ fontSize: 28, color: TONES.muted.color }}
            />
          }
          title="Window is off"
          description="Turn this window on to show its content."
        />
      );
    }

    if (!url) {
      return (
        <PreviewMessage
          tone="muted"
          icon={
            <LinkOffIcon
              sx={{ fontSize: 28, color: TONES.muted.color }}
            />
          }
          title="No content source"
          description="This window has no content source configured."
        />
      );
    }

    if (status === "offline") {
      return (
        <PreviewMessage
          tone="error"
          icon={
            <LinkOffIcon
              sx={{ fontSize: 28, color: TONES.error.color }}
            />
          }
          title="Content unavailable"
          description="We couldn't reach the source for this window."
          onRetry={handleRetry}
        />
      );
    }

    if (status === "online") {
      return (
        <LinkFrame
          key={`${url}-${retryKey}`}
          url={url}
          title={selectedWindow?.name}
          onFailed={() => setFrameFailed(true)}
        />
      );
    }

    // "checking" or "idle"
    return <PreviewMessage loading title="Connecting…" />;
  };

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#151f2d",
        borderRadius: 2,
        border: "1px solid #1e293b",
        overflow: "hidden",
        boxSizing: "border-box",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
      }}
    >
      {/* HEADER */}
      <Stack
        direction="row"
        
        spacing={1}
        sx={{
          px: 1.25,
          py: 0.75,
          bgcolor: "#1b2638",
          minWidth: 0,
          alignItems:"center",
          justifyContent:"space-between"
        }}
      >
        {/* LEFT HEADER */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ minWidth: 0,alignItems:'center' }}
        >
          <ImageIcon
            sx={{
              fontSize: 20,
              color: "#e2e8f0",
              flexShrink: 0,
            }}
          />

          {/* WINDOW SELECT DROPDOWN */}
          <Select
            value={selectedWindow?.id ?? ""}
            onChange={handleWindowChange}
            size="small"
            variant="outlined"
            displayEmpty
            inputProps={{ "aria-label": "Select window" }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: "#1b2638",
                  color: "#e2e8f0",
                  border: "1px solid #26364b",
                  mt: 0.5,

                  "& .MuiMenuItem-root": {
                    fontSize: 12,
                    minHeight: 32,

                    "&:hover": {
                      bgcolor: "#223149",
                    },

                    "&.Mui-selected": {
                      bgcolor: "rgba(0,201,107,0.15)",

                      "&:hover": {
                        bgcolor: "rgba(0,201,107,0.22)",
                      },
                    },
                  },
                },
              },
            }}
            sx={{
              minWidth: 0,
              maxWidth: { xs: 150, sm: 220 },
              height: 28,
              fontSize: 13,
              fontWeight: 700,
              color: "#e2e8f0",
              bgcolor: "#151f2d",
              borderRadius: 1,

              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#26364b",
              },

              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#475569",
              },

              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#00c96b",
                borderWidth: 1,
              },

              "& .MuiSelect-select": {
                py: 0,
                pl: 1,
                pr: "28px !important",
                display: "flex",
                alignItems: "center",
                height: "28px !important",
                minHeight: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },

              "& .MuiSelect-icon": {
                color: "#94a3b8",
                right: 4,
              },
            }}
          >
            {windows.map((windowData) => (
              <MenuItem key={windowData.id} value={windowData.id}>
                {windowData.name}
              </MenuItem>
            ))}
          </Select>

          {/* STATUS CHIP */}
          {statusChip && (
            <Chip
              label={statusChip.label}
              size="small"
              sx={{
                height: 20,
                bgcolor: statusChip.bg,
                color: statusChip.color,
                fontSize: 10,
                fontWeight: 700,
                border: `1px solid ${statusChip.border}`,
                "& .MuiChip-label": {
                  px: 1,
                },
              }}
            />
          )}
        </Stack>

        {/* RIGHT HEADER */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexShrink: 0,alignItems:'center' }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            sx={{alignItems:'center'}}
          >
            <MonitorIcon
              sx={{
                fontSize: 15,
                color: "#94a3b8",
              }}
            />

            <Typography
              sx={{
                fontSize: 11,
                color: "#94a3b8",
                whiteSpace: "nowrap",
              }}
            >
              {resolution}
            </Typography>
          </Stack>

          <IconButton
            size="small"
            aria-label="Open fullscreen"
            onClick={() => onFullscreen?.(selectedWindow)}
            sx={{
              color: "#94a3b8",
              p: 0.5,
              "&:hover": {
                color: "#e2e8f0",
                bgcolor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            <FullscreenIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Stack>

      {/* RESPONSIVE PREVIEW AREA */}
      <Box
        sx={{
          p: 1,
        }}
      >
        <Box
          sx={{
            position: "relative",

            width: "100%",

            // Responsive height according to screen height
            height: "clamp(160px, 35vh, 420px)",

            borderRadius: 1,
            border: "2px solid #0b1220",
            overflow: "hidden",
            bgcolor: "#0b1220",

            transition: "height 0.2s ease",
          }}
        >
          {renderPreview()}
        </Box>
      </Box>
    </Box>
  );
}

export default ContentDisplyer;