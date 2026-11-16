import React from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import ColorSection from "./ColorSection";
import { THEME, secondaryButtonSx } from "./colorUtils";

export default function ColorPlaylist({
  title = "Color Playlist",
  items,
  activeId,
  onApply,
  onEdit,
  onRemove,
  onClear,
}) {
  return (
    <ColorSection icon={<LayersIcon sx={{ fontSize: 18, color: THEME.text }} />}
      title={title} badge={`${items.length} colors`}>
      {!items.length ? (
        <Typography sx={{ fontSize: 11, color: THEME.muted, textAlign: "center", py: 1.5 }}>
          No colors added. Select a color and click Add to Playlist.
        </Typography>
      ) : (
        <Stack spacing={0.6} sx={{ maxHeight: 170, overflowY: "auto" }}>
          {items.map((item, index) => (
            <Stack key={item.id} direction="row" alignItems="center" spacing={0.8}
              sx={{
                p: 0.65, borderRadius: 1,
                bgcolor: item.id === activeId ? "rgba(0,201,107,.12)" : THEME.field,
                border: `1px solid ${item.id === activeId ? THEME.accent : THEME.border}`,
              }}>
              <Box sx={{ width: 25, height: 25, flexShrink: 0, borderRadius: 0.75,
                bgcolor: item.hex, border: "1px solid rgba(255,255,255,.35)" }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, color: THEME.text, fontWeight: 700 }}>
                  {item.name || `Color ${index + 1}`}
                </Typography>
                <Typography sx={{ fontSize: 10, color: THEME.muted }}>{item.hex} · {item.mode}</Typography>
              </Box>
              <Button size="small" onClick={() => onApply(item)}
                sx={{ minWidth: 42, fontSize: 10, textTransform: "none", color: THEME.accent }}>Apply</Button>
              <Button size="small" onClick={() => onEdit(item)}
                sx={{ minWidth: 36, fontSize: 10, textTransform: "none", color: THEME.muted }}>Edit</Button>
              <IconButton size="small" aria-label={`Remove ${item.hex}`}
                onClick={() => onRemove(item.id)} sx={{ color: THEME.muted, p: 0.5 }}>
                <DeleteOutlineIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}
      {!!items.length && (
        <Button fullWidth size="small" startIcon={<DeleteSweepIcon />}
          onClick={onClear} sx={{ ...secondaryButtonSx, mt: 0.8, color: "#f87171" }}>
          Clear Playlist
        </Button>
      )}
    </ColorSection>
  );
}
