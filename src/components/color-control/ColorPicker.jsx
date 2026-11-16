import React from "react";
import { Box, Button, MenuItem, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import GradientIcon from "@mui/icons-material/Gradient";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import ColorSection from "./ColorSection";
import { THEME, SWATCHES, fieldSx, primaryButtonSx, secondaryButtonSx } from "./colorUtils";

function Channel({ label, value, onChange, onFocus, onBlur }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography sx={{ fontSize: 12, color: THEME.muted, width: 16 }}>{label}</Typography>
      <TextField size="small" value={value} onChange={onChange} onFocus={onFocus}
        onBlur={onBlur} inputProps={{ inputMode: "numeric", "aria-label": `${label} value` }}
        sx={{ ...fieldSx, flex: 1, minWidth: 0 }} />
    </Stack>
  );
}

export default function ColorPicker({
  tab, hsv, rgb, cmyk, hex, drafts, isHexValid, svRef, hueRef,
  updateSV, updateHue, handleChannelInput, handleGroupBlur, handleHexInput,
  handleHexBlur, applySwatch, gradientType, setGradientType,
  gradientDirection, setGradientDirection, onApply, onReset, onAddToPlaylist,
}) {
  const channels = tab === "cmyk" ? ["c", "m", "y", "k"] : ["r", "g", "b"];
  const values = tab === "cmyk" ? drafts.cmyk : drafts.rgb;

  return (
    <Stack spacing={0.9}>
      <ColorSection icon={<PaletteIcon sx={{ fontSize: 18, color: THEME.text }} />} title="Color">
        <Stack direction="row" spacing={1.1} alignItems="stretch">
          <Box ref={svRef}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); updateSV(e.clientX, e.clientY); }}
            onPointerMove={(e) => { if (e.buttons === 1) updateSV(e.clientX, e.clientY); }}
            sx={{
              position: "relative", width: 132, height: 100, flexShrink: 0,
              borderRadius: 1, cursor: "crosshair", touchAction: "none",
              bgcolor: `hsl(${hsv.h},100%,50%)`,
              backgroundImage: "linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent)",
              border: `1px solid ${THEME.border}`,
            }}>
            <Box sx={{
              position: "absolute", left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`,
              width: 14, height: 14, borderRadius: "50%", border: "2px solid white",
              boxShadow: "0 0 4px #000", transform: "translate(-50%,-50%)", pointerEvents: "none",
            }} />
          </Box>
          <Box ref={hueRef}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); updateHue(e.clientY); }}
            onPointerMove={(e) => { if (e.buttons === 1) updateHue(e.clientY); }}
            sx={{
              position: "relative", width: 14, height: 100, flexShrink: 0,
              borderRadius: 1, cursor: "pointer", touchAction: "none",
              background: "linear-gradient(to bottom,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)",
            }}>
            <Box sx={{
              position: "absolute", left: -3, right: -3, top: `${(hsv.h / 360) * 100}%`,
              height: 8, borderRadius: 1, border: "2px solid white",
              transform: "translateY(-50%)", pointerEvents: "none",
            }} />
          </Box>
          <Stack spacing={0.65} sx={{ flex: 1, minWidth: 0 }}>
            {channels.map((channel) => (
              <Channel key={channel} label={channel.toUpperCase()} value={values[channel] ?? ""}
                onChange={handleChannelInput(tab, channel)}
                onFocus={() => {}} onBlur={handleGroupBlur(tab)} />
            ))}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography sx={{ fontSize: 12, color: THEME.muted }}>#</Typography>
              <TextField size="small" value={drafts.hex} onChange={handleHexInput}
                onBlur={handleHexBlur} error={drafts.hex.length > 0 && !isHexValid}
                inputProps={{ maxLength: 6, "aria-label": "Hex color" }}
                sx={{ ...fieldSx, flex: 1, minWidth: 0 }} />
            </Stack>
          </Stack>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: 11, color: THEME.muted }}>Quick:</Typography>
          {SWATCHES.map((swatch) => (
            <Tooltip key={swatch} title={swatch}>
              <Box role="button" aria-label={`Use color ${swatch}`} onClick={() => applySwatch(swatch)}
                sx={{
                  width: 20, height: 20, borderRadius: 0.75, bgcolor: swatch,
                  cursor: "pointer", border: `1px solid ${THEME.border}`,
                  "&:hover": { transform: "scale(1.12)" },
                }} />
            </Tooltip>
          ))}
        </Stack>
      </ColorSection>

      <ColorSection icon={<GradientIcon sx={{ fontSize: 18, color: THEME.text }} />} title="Fill Style">
        <Stack direction="row" spacing={1}>
          <Select size="small" value={gradientType} onChange={(e) => setGradientType(e.target.value)}
            sx={{ height: 30, flex: 1, color: THEME.text, fontSize: 12, bgcolor: THEME.field }}>
            <MenuItem value="Gradient">Gradient</MenuItem>
            <MenuItem value="Solid">Solid</MenuItem>
          </Select>
          <Select size="small" value={gradientDirection} disabled={gradientType === "Solid"}
            onChange={(e) => setGradientDirection(e.target.value)}
            sx={{ height: 30, flex: 1, color: THEME.text, fontSize: 12, bgcolor: THEME.field }}>
            <MenuItem value="Linear">Linear</MenuItem>
            <MenuItem value="Radial">Radial</MenuItem>
          </Select>
        </Stack>
      </ColorSection>

      <Stack direction="row" spacing={1}>
        <Button fullWidth variant="contained" startIcon={<CheckIcon />} onClick={onApply}
          disabled={!isHexValid} sx={primaryButtonSx}>Apply Color</Button>
        <Button fullWidth startIcon={<RefreshIcon />} onClick={onReset}
          sx={secondaryButtonSx}>Reset</Button>
      </Stack>
      <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={onAddToPlaylist}
        sx={{ ...secondaryButtonSx, color: THEME.accent, borderColor: THEME.accent }}>
        Add Color to Playlist
      </Button>
    </Stack>
  );
}
