import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

// --------------------------------------------------
// OPTIONS + HELPERS
// --------------------------------------------------

const CONTENT_OPTIONS = ["Image", "Video", "Screen Share"];

// Static for images, Dynamic for video and screen share
const typeFromContent = (content) =>
  content === "Image" ? "Static" : "Dynamic";

// "(120, -40)" -> { left: "120", top: "-40" }
function parsePosition(position) {
  const numbers = String(position ?? "").match(/-?\d+/g) ?? [];

  return {
    left: numbers[0] ?? "0",
    top: numbers[1] ?? "0",
  };
}

// "1920 × 1080" -> { width: "1920", height: "1080" }
function parseResolution(resolution) {
  const match = String(resolution ?? "").match(/(\d+)\D+(\d+)/);

  return {
    width: match?.[1] ?? "1920",
    height: match?.[2] ?? "1080",
  };
}

const isPositiveInt = (value) => /^\d+$/.test(value) && Number(value) > 0;

const isInt = (value) => /^-?\d+$/.test(value);

// Reads width, height, top and left from the window.
// Falls back to the "resolution" / "position" strings and to the
// database names (position_x / position_y).
function buildForm(windowData) {
  const fromResolution = parseResolution(windowData?.resolution);
  const fromPosition = parsePosition(windowData?.position);

  return {
    name: windowData?.name ?? "",
    content: windowData?.content ?? "Image",
    width: String(windowData?.width ?? fromResolution.width),
    height: String(windowData?.height ?? fromResolution.height),
    top: String(
      windowData?.top ?? windowData?.position_y ?? fromPosition.top
    ),
    left: String(
      windowData?.left ?? windowData?.position_x ?? fromPosition.left
    ),
    fullscreen: Boolean(windowData?.fullscreen),
  };
}

// --------------------------------------------------
// DARK FIELD STYLE
// --------------------------------------------------

const fieldSx = {
  "& .MuiInputLabel-root": {
    color: "#94a3b8",
    fontSize: 13,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#00c96b",
  },

  "& .MuiInputLabel-root.Mui-error": {
    color: "#f87171",
  },

  "& .MuiOutlinedInput-root": {
    color: "#e2e8f0",
    fontSize: 13,
    bgcolor: "#151f2d",

    "& fieldset": {
      borderColor: "#334155",
    },

    "&:hover fieldset": {
      borderColor: "#475569",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#00c96b",
    },

    "&.Mui-error fieldset": {
      borderColor: "#f87171",
    },
  },

  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: "#64748b",
  },

  "& .MuiSelect-icon": {
    color: "#94a3b8",
  },

  "& .MuiFormHelperText-root": {
    fontSize: 11,
    mx: 0.25,
  },
};

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "#ffffff",
  },

  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    bgcolor: "#00c96b",
    opacity: 1,
  },

  "& .MuiSwitch-track": {
    bgcolor: "#475569",
    opacity: 1,
  },
};

// --------------------------------------------------
// EDIT WINDOW DIALOG
// --------------------------------------------------

function EditWindowDialog({
  open,
  windowData,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => buildForm(windowData));

  // Reset the form each time the dialog opens or a different window is edited
  useEffect(() => {
    if (open) {
      setForm(buildForm(windowData));
    }
  }, [open, windowData?.id]);

  const setField = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  // ----------------------------------------------
  // VALIDATION
  // ----------------------------------------------

  const errors = {
    name: form.name.trim() === "" ? "Name is required" : "",
    width: isPositiveInt(form.width) ? "" : "Enter a positive number",
    height: isPositiveInt(form.height) ? "" : "Enter a positive number",
    top: isInt(form.top) ? "" : "Enter a whole number",
    left: isInt(form.left) ? "" : "Enter a whole number",
  };

  const canSave = Object.values(errors).every((message) => !message);

  // ----------------------------------------------
  // SAVE
  // ----------------------------------------------

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!canSave || !windowData) return;

    const width = Number(form.width);
    const height = Number(form.height);
    const top = Number(form.top);
    const left = Number(form.left);

    onSave?.({
      ...windowData,
      name: form.name.trim(),
      content: form.content,
      type: typeFromContent(form.content),
      width,
      height,
      top,
      left,
      fullscreen: form.fullscreen,
      resolution: `${width} × ${height}`,
      position: `(${left}, ${top})`,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          component: "form",
          onSubmit: handleSubmit,
          noValidate: true,
          sx: {
            bgcolor: "#182230",
            color: "#e2e8f0",
            border: "1px solid #2b394b",
            borderRadius: 2,
            backgroundImage: "none",
          },
        },
      }}
    >
      {/* TITLE */}

      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5,
          px: 2,
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        Edit Window

        <IconButton
          size="small"
          aria-label="Close"
          onClick={onClose}
          sx={{
            color: "#94a3b8",

            "&:hover": {
              color: "#ffffff",
              bgcolor: "rgba(255,255,255,0.08)",
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      {/* FIELDS */}

      <DialogContent sx={{ px: 2, pt: 1 }}>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {/* ID + TYPE (read only) */}
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="ID"
              size="small"
              fullWidth
              disabled
              value={windowData?.id ?? ""}
              sx={fieldSx}
            />

            <TextField
              label="Type"
              size="small"
              fullWidth
              disabled
              value={typeFromContent(form.content)}
              sx={fieldSx}
            />
          </Stack>

          {/* NAME */}
          <TextField
            label="Name"
            size="small"
            fullWidth
            autoFocus
            value={form.name}
            onChange={setField("name")}
            error={Boolean(errors.name)}
            helperText={errors.name}
            sx={fieldSx}
          />

          {/* CONTENT */}
          <TextField
            select
            label="Content"
            size="small"
            fullWidth
            value={form.content}
            onChange={setField("content")}
            helperText="Static for images, Dynamic for video and screen share"
            sx={fieldSx}
            slotProps={{
              select: {
                MenuProps: {
                  slotProps: {
                    paper: {
                      sx: {
                        bgcolor: "#1e293b",
                        color: "#e2e8f0",
                        border: "1px solid #334155",
                      },
                    },
                  },
                },
              },
            }}
          >
            {CONTENT_OPTIONS.map((option) => (
              <MenuItem key={option} value={option} sx={{ fontSize: 13 }}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          {/* FULLSCREEN */}
          <FormControlLabel
            label={
              <Typography sx={{ fontSize: 13, color: "#e2e8f0" }}>
                Fullscreen
              </Typography>
            }
            control={
              <Switch
                checked={form.fullscreen}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    fullscreen: event.target.checked,
                  }))
                }
                sx={switchSx}
              />
            }
            sx={{ mx: 0, justifyContent: "space-between", flexDirection: "row-reverse" }}
          />

          {/* WIDTH + HEIGHT */}
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Width (px)"
              size="small"
              fullWidth
              value={form.width}
              onChange={setField("width")}
              error={Boolean(errors.width)}
              helperText={errors.width}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
              sx={fieldSx}
            />

            <TextField
              label="Height (px)"
              size="small"
              fullWidth
              value={form.height}
              onChange={setField("height")}
              error={Boolean(errors.height)}
              helperText={errors.height}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
              sx={fieldSx}
            />
          </Stack>

          {/* TOP + LEFT */}
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Top (px)"
              size="small"
              fullWidth
              value={form.top}
              onChange={setField("top")}
              error={Boolean(errors.top)}
              helperText={errors.top}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
              sx={fieldSx}
            />

            <TextField
              label="Left (px)"
              size="small"
              fullWidth
              value={form.left}
              onChange={setField("left")}
              error={Boolean(errors.left)}
              helperText={errors.left}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
              sx={fieldSx}
            />
          </Stack>
        </Stack>
      </DialogContent>

      {/* ACTIONS */}

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            height: 32,
            borderRadius: 1.25,
            borderColor: "#334155",
            color: "#e2e8f0",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "none",

            "&:hover": {
              bgcolor: "rgba(148,163,184,0.08)",
              borderColor: "#64748b",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="contained"
          disableElevation
          disabled={!canSave}
          sx={{
            height: 32,
            borderRadius: 1.25,
            bgcolor: "#00c96b",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "none",

            "&:hover": {
              bgcolor: "#00b85f",
            },

            "&.Mui-disabled": {
              bgcolor: "#1e3a2f",
              color: "#64748b",
            },
          }}
        >
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditWindowDialog;