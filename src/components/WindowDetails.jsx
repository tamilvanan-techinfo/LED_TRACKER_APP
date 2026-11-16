import React from "react";

import {
  Box,
  Typography,
  Stack,
  Button,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import MonitorIcon from "@mui/icons-material/Monitor";

function WindowDetails({
  // The selected window, or null when nothing is selected
  windowData = null,

  onEdit,
  onDelete,
}) {
  const hasWindow = Boolean(windowData);

  const status =
    windowData?.status ?? (windowData?.active ? "Active" : "Inactive");

  const isActive = status === "Active";

  // Width, height, top and left: use the fields when present, otherwise
  // fall back to the "resolution" / "position" strings or the database names.
  const resolutionParts = String(windowData?.resolution ?? "").match(
    /(\d+)\D+(\d+)/
  );

  const positionParts =
    String(windowData?.position ?? "").match(/-?\d+/g) ?? [];

  const width = windowData?.width ?? resolutionParts?.[1] ?? "—";
  const height = windowData?.height ?? resolutionParts?.[2] ?? "—";

  const top =
    windowData?.top ?? windowData?.position_y ?? positionParts[1] ?? "0";

  const left =
    windowData?.left ?? windowData?.position_x ?? positionParts[0] ?? "0";

  const fullscreen = Boolean(windowData?.fullscreen);

  const details = hasWindow
    ? [
        { label: "Name", value: windowData.name },
        { label: "ID", value: windowData.id },
        { label: "Type", value: windowData.type },
        { label: "Content", value: windowData.content ?? "—" },
        { label: "Resolution", value: `${width} × ${height}` },
        { label: "Width", value: `${width} px` },
        { label: "Height", value: `${height} px` },
        { label: "Top", value: `${top} px` },
        { label: "Left", value: `${left} px` },
        { label: "Fullscreen", value: fullscreen ? "On" : "Off" },
      ]
    : [];

  const rowColumns = {
    xs: "64px 10px minmax(0, 1fr)",
    sm: "70px 12px minmax(0, 1fr)",
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",

        // Responsive component height
        height: "clamp(250px, 38vh, 320px)",
        minHeight: 350,
        maxHeight: 350,

        bgcolor: "#182230",

        border: "1px solid #2b394b",
        borderRadius: 2,

        // Responsive padding
        p: {
          xs: 1.25,
          sm: 1.5,
        },

        boxSizing: "border-box",

        color: "#e2e8f0",

        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",

        display: "flex",
        flexDirection: "column",

        overflow: "hidden",

        minWidth: 0,
      }}
    >
      {/* HEADER */}

      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          mb: {
            xs: 1,
            sm: 1.25,
          },

          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <InfoOutlinedIcon
          sx={{
            fontSize: 20,
            color: "#e2e8f0",
          }}
        />

        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 700,
            color: "#e2e8f0",
          }}
        >
          Window Details
        </Typography>
      </Stack>

      {/* WINDOW INFORMATION */}

      {hasWindow ? (
        <Stack
          spacing={{
            xs: 0.55,
            sm: 0.65,
          }}
          sx={{
            pl: 0.25,

            flex: "1 1 auto",

            minHeight: 0,

            overflowY: "auto",
            overflowX: "hidden",

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
          {details.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: "grid",

                gridTemplateColumns: rowColumns,

                alignItems: "center",

                minHeight: 16,

                flexShrink: 0,
              }}
            >
              {/* LABEL */}

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: "#cbd5e1",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Typography>

              {/* SEPARATOR */}

              <Typography
                sx={{
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                :
              </Typography>

              {/* VALUE */}

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  color:
                    item.label === "Fullscreen" && fullscreen
                      ? "#00e676"
                      : "#e2e8f0",

                  minWidth: 0,

                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={String(item.value)}
              >
                {item.value}
              </Typography>
            </Box>
          ))}

          {/* STATUS */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: rowColumns,

              alignItems: "center",

              minHeight: 16,
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                color: "#cbd5e1",
              }}
            >
              Status
            </Typography>

            <Typography
              sx={{
                fontSize: 11,
                color: "#94a3b8",
              }}
            >
              :
            </Typography>

            <Stack
              direction="row"
              spacing={0.65}
              sx={{
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,

                  flexShrink: 0,

                  borderRadius: "50%",

                  bgcolor: isActive
                    ? "#00e676"
                    : "#64748b",

                  boxShadow: isActive
                    ? "0 0 7px rgba(0,230,118,0.45)"
                    : "none",
                }}
              />

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,

                  color: isActive
                    ? "#00e676"
                    : "#94a3b8",

                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {status}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      ) : (
        /* EMPTY STATE */
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            color: "#64748b",
            textAlign: "center",
          }}
        >
          <MonitorIcon sx={{ fontSize: 30 }} />

          <Typography sx={{ fontSize: 11 }}>
            Select a window to see its details
          </Typography>
        </Stack>
      )}

      {/* ACTION BUTTONS */}

      <Stack
        direction="row"
        spacing={1}
        sx={{
          mt: {
            xs: 1.25,
            sm: 1.75,
          },

          flexShrink: 0,
        }}
      >
        {/* EDIT */}

        <Button
          fullWidth
          variant="outlined"
          disabled={!hasWindow}
          startIcon={
            <EditOutlinedIcon
              sx={{
                fontSize: "16px !important",
              }}
            />
          }
          onClick={onEdit}
          sx={{
            height: 31,
            minHeight: 31,

            minWidth: 0,

            borderRadius: 1.25,
            borderColor: "#334155",
            color: "#e2e8f0",

            fontSize: 11,
            fontWeight: 600,
            textTransform: "none",

            "& .MuiButton-startIcon": {
              mr: 0.75,
            },

            "&:hover": {
              bgcolor: "rgba(148,163,184,0.08)",
              borderColor: "#64748b",
            },

            "&.Mui-disabled": {
              borderColor: "#263447",
              color: "#475569",
            },
          }}
        >
          Edit
        </Button>

        {/* DELETE */}

        <Button
          fullWidth
          variant="outlined"
          color="error"
          disabled={!hasWindow}
          startIcon={
            <DeleteOutlineIcon
              sx={{
                fontSize: "17px !important",
              }}
            />
          }
          onClick={onDelete}
          sx={{
            height: 31,
            minHeight: 31,

            minWidth: 0,

            borderRadius: 1.25,
            borderColor: "#dc2626",
            color: "#ef4444",

            fontSize: 11,
            fontWeight: 600,
            textTransform: "none",

            "& .MuiButton-startIcon": {
              mr: 0.75,
            },

            "&:hover": {
              bgcolor: "rgba(220,38,38,0.10)",
              borderColor: "#ef4444",
            },

            "&.Mui-disabled": {
              borderColor: "#263447",
              color: "#475569",
            },
          }}
        >
          Delete
        </Button>
      </Stack>
    </Box>
  );
}

export default WindowDetails;