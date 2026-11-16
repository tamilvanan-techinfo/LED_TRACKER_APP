import React, { useState } from "react";

import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";

import MonitorIcon from "@mui/icons-material/Monitor";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ImageIcon from "@mui/icons-material/Image";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircle";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";

// --------------------------------------------------
// WINDOW THUMBNAIL
// --------------------------------------------------

function WindowThumbnail({ content, active }) {
  return (
    <Box
      sx={{
        width: 50,
        height: 34,

        flexShrink: 0,

        borderRadius: 1,

        overflow: "hidden",

        border: "1px solid #475569",

        position: "relative",

        bgcolor: "#0f172a",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        boxShadow: active
          ? "0 0 8px rgba(0,230,118,0.15)"
          : "none",
      }}
    >
      {/* IMAGE */}

      {content === "Image" && (
        <Box
          sx={{
            width: "100%",
            height: "100%",

            background:
              "linear-gradient(135deg, #4338ca 0%, #06b6d4 45%, #10b981 65%, #d946ef 100%)",

            position: "relative",

            "&::before": {
              content: '""',

              position: "absolute",

              width: "100%",
              height: "100%",

              background:
                "linear-gradient(45deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)",
            },
          }}
        />
      )}

      {/* VIDEO */}

      {content === "Video" && (
        <Box
          sx={{
            width: "100%",
            height: "100%",

            bgcolor: "#172554",

            background:
              "linear-gradient(135deg, #0f172a, #1d4ed8)",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",
          }}
        >
          <PlayCircleOutlineIcon
            sx={{
              fontSize: 24,
              color: "#e2e8f0",
            }}
          />
        </Box>
      )}

      {/* SCREEN SHARE */}

      {content === "Screen Share" && (
        <Box
          sx={{
            width: "100%",
            height: "100%",

            bgcolor: "#172554",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",
          }}
        >
          <MonitorIcon
            sx={{
              fontSize: 24,
              color: "#cbd5e1",
            }}
          />
        </Box>
      )}
    </Box>
  );
}

// --------------------------------------------------
// WINDOW CARD
// --------------------------------------------------

function WindowCard({
  windowData,
  selected,
  onSelect,
  onMenuClick,
}) {
  return (
    <Box
      onClick={onSelect}
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,

        minHeight: 52,

        boxSizing: "border-box",

        display: "flex",

        alignItems: "center",

        gap: 1,

        px: 0.75,
        py: 0.75,

        borderRadius: 1.5,

        border: selected
          ? "1px solid #00e676"
          : "1px solid #263447",

        bgcolor: selected
          ? "rgba(0,230,118,0.07)"
          : "#1b2737",

        cursor: "pointer",

        flexShrink: 0,

        overflow: "hidden",

        transition: "all 150ms ease",

        "&:hover": {
          bgcolor: selected
            ? "rgba(0,230,118,0.10)"
            : "#243246",

          borderColor: selected
            ? "#00e676"
            : "#475569",
        },
      }}
    >
      {/* THUMBNAIL */}

      <WindowThumbnail
        content={windowData.content}
        active={selected}
      />

      {/* WINDOW DETAILS */}

      <Stack
        spacing={0.35}
        sx={{
          flex: 1,

          minWidth: 0,

          overflow: "hidden",
        }}
      >
        {/* NAME + ACTIVE */}

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{
            minWidth: 0,

            overflow: "hidden",
          }}
        >
          <Typography
            sx={{
              flex: 1,

              minWidth: 0,

              fontSize: 10.5,

              fontWeight: 600,

              color: "#e2e8f0",

              whiteSpace: "nowrap",

              overflow: "hidden",

              textOverflow: "ellipsis",
            }}
          >
            {windowData.name}
          </Typography>

          {selected && (
            <Box
              sx={{
                px: 0.65,
                py: 0.15,

                flexShrink: 0,

                borderRadius: 999,

                bgcolor: "#00c96b",

                display: "flex",

                alignItems: "center",

                gap: 0.3,
              }}
            >
              <Typography
                sx={{
                  fontSize: 8,

                  fontWeight: 700,

                  color: "#ffffff",

                  lineHeight: 1.4,
                }}
              >
                Active
              </Typography>
            </Box>
          )}
        </Stack>

        {/* ID + RESOLUTION */}

        <Typography
          sx={{
            fontSize: 9,

            color: "#94a3b8",

            whiteSpace: "nowrap",

            overflow: "hidden",

            textOverflow: "ellipsis",
          }}
        >
          ID: {windowData.id} · {windowData.resolution}
        </Typography>
      </Stack>

      {/* MORE MENU */}

      <Tooltip title="Window options">
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onMenuClick(event, windowData);
          }}
          sx={{
            width: 22,
            height: 30,

            flexShrink: 0,

            color: "#94a3b8",

            borderRadius: 1,

            "&:hover": {
              bgcolor: "rgba(255,255,255,0.08)",
              color: "#ffffff",
            },
          }}
        >
          <MoreVertIcon
            sx={{
              fontSize: 18,
            }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

// Static for images, Dynamic for video and screen share
const typeFromContent = (content) =>
  content === "Image" ? "Static" : "Dynamic";

// Next number after the highest existing WIN-xxx id
const getNextWindowNumber = (windows) =>
  windows.reduce((max, item) => {
    const number = parseInt(String(item.id).replace(/\D/g, ""), 10);

    return Number.isNaN(number) ? max : Math.max(max, number);
  }, 0) + 1;

// --------------------------------------------------
// WINDOW MANAGER
// Windows and selection are controlled by the parent.
// --------------------------------------------------

function WindowManager({
  windows = [],
  selectedWindowId = null,
  onAddWindow,
  onEditWindow,
  onDeleteWindow,
  onSelectWindow,
}) {
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);

  const [windowMenuAnchor, setWindowMenuAnchor] = useState(null);

  const [menuWindow, setMenuWindow] = useState(null);

  // ----------------------------------------------
  // ADD WINDOW
  // ----------------------------------------------

  const handleAddWindow = (content) => {
    setAddMenuAnchor(null);

    const number = getNextWindowNumber(windows);
    const type = typeFromContent(content);

    const newWindow = {
      id: `WIN-${String(number).padStart(3, "0")}`,

      name: `${type} Window ${String(number).padStart(2, "0")}`,

      type,

      resolution: "1920 × 1080",

      position: "(0, 0)",

      content,

      active: false,
    };

    onAddWindow?.(newWindow);
  };

  // ----------------------------------------------
  // WINDOW MENU
  // ----------------------------------------------

  const handleWindowMenu = (event, windowData) => {
    setWindowMenuAnchor(event.currentTarget);

    setMenuWindow(windowData);
  };

  const closeWindowMenu = () => {
    setWindowMenuAnchor(null);
  };

  const handleEdit = () => {
    closeWindowMenu();

    onEditWindow?.(menuWindow);
  };

  const handleDelete = () => {
    closeWindowMenu();

    if (!menuWindow) return;

    onDeleteWindow?.(menuWindow);
  };

  // ----------------------------------------------
  // UI
  // ----------------------------------------------

  return (
    <Box
      sx={{
        width: "100%",

        // Responsive height
        height: "clamp(180px, 35vh, 280px)",
        minHeight:  280,
        maxHeight: 280,

        minWidth: 0,

        display: "flex",
        flexDirection: "column",

        bgcolor: "#151f2d",
        borderRadius: 2,

        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}

      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 1.25,
          py: 1,

          flexShrink: 0,

          minWidth: 0,
        }}
      >
        <MonitorIcon
          sx={{
            fontSize: 20,
            color: "#e2e8f0",

            flexShrink: 0,
          }}
        />

        <Typography
          sx={{
            fontSize: 15,

            fontWeight: 700,

            color: "#e2e8f0",

            whiteSpace: "nowrap",
          }}
        >
          Window Management
        </Typography>
      </Stack>

      {/* ADD WINDOW */}

      <Box
        sx={{
          px: 0.75,

          flexShrink: 0,

          minWidth: 0,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          disableElevation
          startIcon={
            <AddIcon
              sx={{
                fontSize: 18,
              }}
            />
          }
          endIcon={
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 18,
              }}
            />
          }
          onClick={(event) =>
            setAddMenuAnchor(event.currentTarget)
          }
          sx={{
            height: 32,

            minHeight: 32,

            borderRadius: 1.5,

            bgcolor: "#00c96b",

            color: "#ffffff",

            fontSize: 11,

            fontWeight: 700,

            textTransform: "none",

            "& .MuiButton-startIcon": {
              mr: 0.75,
            },

            "& .MuiButton-endIcon": {
              ml: "auto",
            },

            "&:hover": {
              bgcolor: "#00b85f",
            },
          }}
        >
          Add Window
        </Button>

        {/* ADD WINDOW MENU */}

        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={() => setAddMenuAnchor(null)}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "#1e293b",

                color: "#e2e8f0",

                border: "1px solid #334155",

                minWidth: 160,
              },
            },
          }}
        >
          <MenuItem onClick={() => handleAddWindow("Image")}>
            <ImageIcon sx={{ mr: 1, fontSize: 18 }} />
            Static Image
          </MenuItem>

          <MenuItem onClick={() => handleAddWindow("Video")}>
            <PlayCircleOutlineIcon sx={{ mr: 1, fontSize: 18 }} />
            Dynamic Video
          </MenuItem>

          <MenuItem onClick={() => handleAddWindow("Screen Share")}>
            <ScreenShareIcon sx={{ mr: 1, fontSize: 18 }} />
            Screen Share
          </MenuItem>
        </Menu>
      </Box>

      {/* SPACER */}

      <Box sx={{ height: 12, flexShrink: 0 }} />

      {/* WINDOW LIST */}

      <Box
        sx={{
          // Take remaining available height
          flex: "1 1 0",

          // Required for scrolling inside flex layout
          minHeight: 0,
          minWidth: 0,

          width: "100%",
          maxWidth: "100%",

          // Scroll only this section
          overflowY: "auto",
          overflowX: "hidden",

          // Layout
          px: 0.75,
          pb: 1,

          display: "flex",
          flexDirection: "column",

          gap: 0.75,

          boxSizing: "border-box",

          // Scrollbar
          scrollbarWidth: "thin",
          scrollbarColor: "#334155 transparent",

          "&::-webkit-scrollbar": {
            width: 5,
          },

          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },

          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#334155",
            borderRadius: 10,
          },

          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#475569",
          },
        }}
      >
        {windows.map((windowData) => (
          <Box
            key={windowData.id}
            sx={{
              width: "100%",

              minWidth: 0,
              maxWidth: "100%",

              flexShrink: 0,

              boxSizing: "border-box",
            }}
          >
            <WindowCard
              windowData={windowData}
              selected={selectedWindowId === windowData.id}
              onSelect={() => onSelectWindow?.(windowData)}
              onMenuClick={handleWindowMenu}
            />
          </Box>
        ))}

        {/* EMPTY STATE */}

        {windows.length === 0 && (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{
              flex: 1,

              minHeight: 100,

              color: "#64748b",
            }}
          >
            <MonitorIcon
              sx={{
                fontSize: 32,
              }}
            />

            <Typography
              sx={{
                fontSize: 11,
              }}
            >
              No windows available
            </Typography>
          </Stack>
        )}
      </Box>

      {/* WINDOW OPTIONS MENU */}

      <Menu
        anchorEl={windowMenuAnchor}
        open={Boolean(windowMenuAnchor)}
        onClose={closeWindowMenu}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "#1e293b",

              color: "#e2e8f0",

              border: "1px solid #334155",

              minWidth: 130,
            },
          },
        }}
      >
        <MenuItem onClick={handleEdit}>
          Edit Window
        </MenuItem>

        <MenuItem
          onClick={handleDelete}
          sx={{
            color: "#ef4444",
          }}
        >
          Delete Window
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default WindowManager;