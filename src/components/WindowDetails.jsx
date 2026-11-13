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

function WindowDetails({
  windowData = {
    name: "Static Window 01",
    id: "WIN-01",
    type: "Static",
    resolution: "1920 × 1080",
    position: "(0, 0)",
    status: "Active",
  },

  onEdit,
  onDelete,
}) {
  const isActive = windowData.status === "Active";

  const details = [
    {
      label: "Name",
      value: windowData.name,
    },
    {
      label: "ID",
      value: windowData.id,
    },
    {
      label: "Type",
      value: windowData.type,
    },
    {
      label: "Resolution",
      value: windowData.resolution,
    },
    {
      label: "Position",
      value: windowData.position,
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",

        // Responsive component height
        height: "clamp(250px, 38vh, 320px)",
        minHeight: 250,
        maxHeight: 220,

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

              gridTemplateColumns: {
                xs: "58px 10px minmax(0, 1fr)",
                sm: "64px 12px minmax(0, 1fr)",
              },

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
                color: "#e2e8f0",

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

            gridTemplateColumns: {
              xs: "58px 10px minmax(0, 1fr)",
              sm: "64px 12px minmax(0, 1fr)",
            },

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
              {windowData.status}
            </Typography>
          </Stack>
        </Box>
      </Stack>

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
          }}
        >
          Edit
        </Button>

        {/* DELETE */}

        <Button
          fullWidth
          variant="outlined"
          color="error"
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
          }}
        >
          Delete
        </Button>
      </Stack>
    </Box>
  );
}

export default WindowDetails;