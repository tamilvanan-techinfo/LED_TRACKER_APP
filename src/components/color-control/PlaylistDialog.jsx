import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import {
  THEME,
  fieldSx,
  primaryButtonSx,
  secondaryButtonSx,
  cmykToRgb,
  rgbToCmyk,
  rgbToHex,
  hexToRgb,
} from "./colorUtils";

export default function PlaylistDialog({
  open,
  mode = "RGB",
  initialColor,
  initialCmyk,
  initialName,
  error,
  onClose,
  onSave,
}) {
  const [name, setName] = useState("Color 1");
  const [rgb, setRgb] = useState({ r: 255, g: 0, b: 0 });
  const [cmyk, setCmyk] = useState({ c: 0, m: 100, y: 100, k: 0 });

  useEffect(() => {
    if (open) {
      setName(initialName || "Color 1");
      const nextRgb = initialColor || { r: 255, g: 0, b: 0 };
      setRgb(nextRgb);
      setCmyk(initialCmyk || rgbToCmyk(nextRgb));
    }
  }, [open, initialColor, initialCmyk, initialName]);

  const update = (key, value) => {
    const max = mode === "CMYK" ? 100 : 255;
    const parsed = value === "" ? 0 : Number(value);
    const nextValue = Math.max(0, Math.min(max, Number.isFinite(parsed) ? parsed : 0));

    if (mode === "CMYK") {
      const nextCmyk = { ...cmyk, [key]: nextValue };
      setCmyk(nextCmyk);
      setRgb(cmykToRgb(nextCmyk));
      return;
    }

    const nextRgb = { ...rgb, [key]: nextValue };
    setRgb(nextRgb);
    setCmyk(rgbToCmyk(nextRgb));
  };

  const hex = `#${rgbToHex(rgb)}`;
  const textColor = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 145 ? "#111" : "#fff";
  const channels = mode === "CMYK" ? ["c", "m", "y", "k"] : ["r", "g", "b"];

  return (
    <Dialog open={open} onClose={onClose}
      PaperProps={{ sx: { bgcolor: THEME.card, color: THEME.text, border: `1px solid ${THEME.border}`, minWidth: 320 } }}>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>
        Save {mode} Playlist Color
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <TextField label="Color name" value={name} onChange={(e) => setName(e.target.value)}
            size="small" fullWidth sx={fieldSx} />
          <Stack sx={{ height: 78, borderRadius: 1.5, bgcolor: hex, border: `1px solid ${THEME.border}`,
            alignItems: "end", justifyContent: "space-between", p: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: textColor }}>Color Preview</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: textColor }}>{hex}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            {channels.map((key) => (
              <TextField key={key} label={key.toUpperCase()} type="number" size="small" fullWidth
                value={mode === "CMYK" ? cmyk[key] : rgb[key]}
                onChange={(e) => update(key, e.target.value)}
                inputProps={{ min: 0, max: mode === "CMYK" ? 100 : 255 }}
                sx={fieldSx} />
            ))}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, color: THEME.muted }}>Pick</Typography>
            <input type="color" value={hex} aria-label={`Choose ${mode} color`}
              onChange={(e) => {
                const next = hexToRgb(e.target.value);
                if (next) {
                  setRgb(next);
                  setCmyk(rgbToCmyk(next));
                }
              }}
              style={{ width: 48, height: 32, padding: 0, border: 0, background: "transparent" }} />
          </Stack>
          {error && (
            <Typography role="alert" sx={{ fontSize: 12, color: "#f87171" }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} sx={secondaryButtonSx}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ name, rgb, cmyk })} sx={primaryButtonSx}>
          Save Color
        </Button>
      </DialogActions>
    </Dialog>
  );
}
