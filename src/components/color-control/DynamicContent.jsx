import React from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import ImageIcon from "@mui/icons-material/Image";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import MonitorIcon from "@mui/icons-material/Monitor";
import ColorSection from "./ColorSection";
import MediaPlayer from "./MediaPlayer";
import { THEME, primaryButtonSx, secondaryButtonSx } from "./colorUtils";

function MediaRow({ media, selected, onSelect, onRemove }) {
  const Icon = media.type === "Video" ? PlayCircleIcon : ImageIcon;
  return (
    <Stack direction="row" alignItems="center" spacing={0.8} onClick={onSelect}
      sx={{ px: 1, py: 0.6, borderRadius: 1, cursor: "pointer",
        bgcolor: selected ? "rgba(0,201,107,.12)" : THEME.card,
        border: `1px solid ${selected ? THEME.accent : THEME.border}` }}>
      <Icon sx={{ fontSize: 16, color: selected ? THEME.accent : THEME.muted }} />
      <Typography sx={{ flex: 1, minWidth: 0, fontSize: 11, color: THEME.text,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{media.name}</Typography>
      <Typography sx={{ fontSize: 10, color: THEME.muted }}>{media.type}</Typography>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRemove(); }}
        sx={{ color: THEME.muted, p: 0.4 }}><DeleteOutlineIcon sx={{ fontSize: 15 }} /></IconButton>
    </Stack>
  );
}

export default function DynamicContent({
  mediaFiles, activeId, activeMedia, fileInputRef, videoRef, isPlaying,
  currentTime, duration, volume, imageCount, videoCount,
  onOpenPicker, onFilesSelected, onSelectMedia, onRemoveMedia, onClearFiles,
  onPlay, onStop, onTimeUpdate, onMetadata, onPause, onEnded, onSeek, onVolume, onFullscreen,
}) {
  return (
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={onFilesSelected} />
      <ColorSection icon={<MonitorIcon sx={{ fontSize: 18, color: THEME.text }} />} title="Content Source">
        <Stack direction="row" spacing={1} alignItems="stretch">
          <Stack spacing={0.7} sx={{ width: 92, flexShrink: 0 }}>
            <Button onClick={onOpenPicker} startIcon={<PermMediaIcon />}
              sx={{ ...secondaryButtonSx, height: "auto", minHeight: 52, fontSize: 10, px: 0.5 }}>
              Upload Image / Video
            </Button>
            <Button disabled startIcon={<ScreenShareIcon />}
              sx={{ ...secondaryButtonSx, height: "auto", minHeight: 52, fontSize: 10, px: 0.5 }}>
              Screen Sharing
            </Button>
          </Stack>
          <MediaPlayer activeMedia={activeMedia} videoRef={videoRef} isPlaying={isPlaying}
            volume={volume} currentTime={currentTime} duration={duration}
            onPlay={onPlay} onTimeUpdate={onTimeUpdate} onMetadata={onMetadata}
            onPause={onPause} onEnded={onEnded} onSeek={onSeek}
            onVolume={onVolume} onFullscreen={onFullscreen} />
          <Stack spacing={0.7} sx={{ width: 88, flexShrink: 0 }}>
            <Button fullWidth onClick={onOpenPicker} startIcon={<FolderOpenIcon />}
              sx={{ ...secondaryButtonSx, fontSize: 10, px: 0.5 }}>Browse File</Button>
            <Button fullWidth variant="contained" onClick={onPlay} disabled={!activeMedia}
              startIcon={<PlayArrowIcon />} sx={{ ...primaryButtonSx, fontSize: 10, px: 0.5 }}>
              {isPlaying ? "Playing" : "Play"}
            </Button>
            <Button fullWidth onClick={onStop} disabled={!activeMedia}
              startIcon={<StopIcon />} sx={{ ...secondaryButtonSx, fontSize: 10, px: 0.5 }}>Stop</Button>
          </Stack>
        </Stack>
      </ColorSection>

      <ColorSection icon={<PermMediaIcon sx={{ fontSize: 18, color: THEME.text }} />}
        title="Files" badge={`${imageCount} img · ${videoCount} vid`}>
        <Stack spacing={0.5} sx={{ maxHeight: 155, overflowY: "auto", mb: 1 }}>
          {!mediaFiles.length ? (
            <Typography sx={{ fontSize: 11, color: THEME.muted, textAlign: "center", py: 2 }}>No files uploaded yet</Typography>
          ) : mediaFiles.map((media) => (
            <MediaRow key={media.id} media={media} selected={media.id === activeId}
              onSelect={() => onSelectMedia(media.id)} onRemove={() => onRemoveMedia(media.id)} />
          ))}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button fullWidth onClick={onOpenPicker} startIcon={<FolderOpenIcon />} sx={secondaryButtonSx}>Add More Files</Button>
          <Button fullWidth onClick={onClearFiles} disabled={!mediaFiles.length}
            startIcon={<DeleteSweepIcon />} sx={{ ...secondaryButtonSx, color: "#f87171" }}>Clear All</Button>
        </Stack>
      </ColorSection>
    </Stack>
  );
}
