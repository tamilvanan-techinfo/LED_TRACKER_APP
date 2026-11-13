
import React from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";

import ImageIcon from "@mui/icons-material/Image";
import MonitorIcon from "@mui/icons-material/Monitor";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

function ContentDisplyer({
  name = "Static Window 01",
  active = true,
  resolution = "1920 × 1080",
  contentType = "Static",
  preview = null,
  onFullscreen,
  onContentTypeChange,
}) {
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
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          px: 1.25,
          py: 0.75,
          bgcolor: "#1b2638",
          minWidth: 0,
        }}
      >
        {/* LEFT HEADER */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ minWidth: 0 }}
        >
          <ImageIcon
            sx={{
              fontSize: 20,
              color: "#e2e8f0",
              flexShrink: 0,
            }}
          />

          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </Typography>

          {active && (
            <Chip
              label="Active"
              size="small"
              sx={{
                height: 20,
                bgcolor: "rgba(0,201,107,0.18)",
                color: "#00c96b",
                fontSize: 10,
                fontWeight: 700,
                border: "1px solid rgba(0,201,107,0.4)",
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
          alignItems="center"
          spacing={1}
          sx={{ flexShrink: 0 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
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
            onClick={onFullscreen}
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
          px: 1,
          pt: 1,
          pb: 1,
        }}
      >
        <Box
          sx={{
            width: "100%",

            // Responsive height according to screen height
            height: "clamp(160px, 35vh, 420px)",

            borderRadius: 1,
            border: "2px solid #0b1220",
            overflow: "hidden",
            bgcolor: "#000",

            background: preview
              ? undefined
              : "linear-gradient(115deg, #8a2be2 0%, #0066ff 18%, #00e5ff 36%, #00ff66 50%, #ffff00 64%, #ff8c00 78%, #ff00cc 100%)",

            backgroundImage: preview
              ? `url(${preview})`
              : undefined,

            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",

            transition: "height 0.2s ease",
          }}
        />
      </Box>

      {/* CONTENT TYPE SECTION */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          px: 1,
          pb: 1,
        }}
      >
      </Stack>
    </Box>
  );
}

export default ContentDisplyer;
