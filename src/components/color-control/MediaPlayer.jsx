import React from "react";
import { Box, Chip, IconButton, Slider, Stack, Typography } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import { THEME, formatTime } from "./colorUtils";

export default function MediaPlayer({
  activeMedia, videoRef, isPlaying, volume, currentTime, duration,
  onPlay, onTimeUpdate, onMetadata, onPause, onEnded, onSeek, onVolume, onFullscreen,
}) {
  const isVideo = activeMedia?.type === "Video";
  return (
    <Box sx={{ flex: 1, minWidth: 0, borderRadius: 1, overflow: "hidden",
      bgcolor: "#000", border: `1px solid ${THEME.border}`, display: "flex", flexDirection: "column" }}>
      <Box sx={{ position: "relative", width: "100%", height: 112, bgcolor: "#000" }}>
        {activeMedia ? (
          <>
            {isVideo ? (
              <Box key={activeMedia.id} component="video" ref={videoRef} src={activeMedia.url}
                onLoadedMetadata={onMetadata} onTimeUpdate={onTimeUpdate}
                onPlay={onPlay} onPause={onPause} onEnded={onEnded}
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <Box component="img" src={activeMedia.url} alt={activeMedia.name}
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            )}
            <Chip size="small" icon={isVideo ? <PlayCircleIcon /> : <ImageIcon />}
              label={activeMedia.type} sx={{ position: "absolute", top: 6, left: 6, height: 19,
                bgcolor: "rgba(0,0,0,.65)", color: THEME.text, fontSize: 10 }} />
            {isVideo && !isPlaying && (
              <Box role="button" aria-label="Play video" onClick={onPlay}
                sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                  width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(0,0,0,.6)",
                  border: "2px solid white", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <PlayArrowIcon sx={{ color: "#fff" }} />
              </Box>
            )}
          </>
        ) : (
          <Stack alignItems="center" justifyContent="center" spacing={0.5}
            sx={{ position: "absolute", inset: 0, color: THEME.muted }}>
            <PermMediaIcon sx={{ fontSize: 24 }} />
            <Typography sx={{ fontSize: 11 }}>Upload images or videos to preview</Typography>
          </Stack>
        )}
      </Box>
      {isVideo && (
        <Stack direction="row" alignItems="center" spacing={0.7} sx={{ px: 1, py: 0.5, bgcolor: THEME.field }}>
          <Typography sx={{ fontSize: 10, color: THEME.text, whiteSpace: "nowrap" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
          <Slider size="small" min={0} max={duration || 1}
            value={Math.min(currentTime, duration || 0)} onChange={onSeek}
            sx={{ flex: 1, color: THEME.accent, height: 4, "& .MuiSlider-thumb": { width: 10, height: 10 } }} />
          <VolumeUpIcon sx={{ fontSize: 15, color: THEME.muted }} />
          <Slider size="small" min={0} max={100} value={volume} onChange={onVolume}
            sx={{ width: 48, color: THEME.accent, height: 4, "& .MuiSlider-thumb": { width: 10, height: 10 } }} />
          <IconButton size="small" onClick={onFullscreen} sx={{ color: THEME.muted }}>
            <FullscreenIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      )}
    </Box>
  );
}
