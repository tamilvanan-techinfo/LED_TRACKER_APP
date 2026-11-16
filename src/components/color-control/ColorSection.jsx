import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { THEME } from "./colorUtils";

export default function ColorSection({ icon, title, badge, flat = false, children }) {
  return (
    <Box sx={{
      bgcolor: flat ? THEME.field : THEME.card, borderRadius: 1.5, p: 1.1,
      border: `1px solid ${THEME.border}`, minWidth: 0,
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon}
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: THEME.text }}>{title}</Typography>
        </Stack>
        {badge !== undefined && (
          <Chip size="small" label={badge} sx={{
            height: 20, bgcolor: "rgba(0,201,107,.15)", color: THEME.accent,
            fontWeight: 700, fontSize: 10,
          }} />
        )}
      </Stack>
      {children}
    </Box>
  );
}
