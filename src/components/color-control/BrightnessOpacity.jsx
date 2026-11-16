import React from "react";
import { Box, Button, IconButton, Slider, Stack, Typography } from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import LayersIcon from "@mui/icons-material/Layers";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ColorSection from "./ColorSection";
import { THEME, clamp, primaryButtonSx, secondaryButtonSx } from "./colorUtils";
import { invoke } from "@tauri-apps/api/core";
function SliderRow({ value, onChange }) {
  const step = (amount) => onChange(clamp(value + amount, 0, 100));
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <IconButton size="small" onClick={() => step(-1)} sx={{ color: THEME.text, bgcolor: THEME.field }}>
        <RemoveIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <Slider value={value} min={0} max={100} onChange={(_, next) => onChange(next)}
        sx={{ flex: 1, color: THEME.accent, height: 4,
          "& .MuiSlider-thumb": { width: 16, height: 16 },
          "& .MuiSlider-rail": { bgcolor: THEME.border, opacity: 1 } }} />
      <IconButton size="small" onClick={() => step(1)} sx={{ color: THEME.text, bgcolor: THEME.field }}>
        <AddIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Stack>
  );
}

export default function BrightnessOpacity({
  brightness, opacity, setBrightness, setOpacity, onApply, onReset, status,
}) {
  return (
    <Stack spacing={0.9}>
      <ColorSection icon={<WbSunnyIcon sx={{ fontSize: 18, color: THEME.text }} />}
        title="Brightness" badge={`${brightness}%`}>
        <SliderRow value={brightness} onChange={setBrightness} />
      </ColorSection>
      <ColorSection icon={<LayersIcon sx={{ fontSize: 18, color: THEME.text }} />}
        title="Opacity" badge={`${opacity}%`}>
        <SliderRow value={opacity} onChange={setOpacity} />
      </ColorSection>
      <Stack direction="row" spacing={1}>
        <Button  fullWidth variant="contained" startIcon={<CheckIcon />} onClick={()=>{
          invoke("send_message", { message: "apply_settings",windowId:1,isPlaylist: false });
        }}
          sx={primaryButtonSx}>Apply Settings</Button>
        <Button fullWidth startIcon={<RefreshIcon />} onClick={onReset}
          sx={secondaryButtonSx}>Reset</Button>
      </Stack>
      <Box sx={{ minHeight: 20 }}>
        {status && (
          <Stack direction="row" alignItems="center" spacing={0.75} justifyContent="center">
            <CheckCircleIcon sx={{ fontSize: 16, color: THEME.accent }} />
            <Typography sx={{ fontSize: 12, color: THEME.accent, fontWeight: 600 }}>{status}</Typography>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
