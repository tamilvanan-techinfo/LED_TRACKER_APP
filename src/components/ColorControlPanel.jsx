import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Select,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PaletteIcon from "@mui/icons-material/Palette";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import LayersIcon from "@mui/icons-material/Layers";
import MonitorIcon from "@mui/icons-material/Monitor";
import GradientIcon from "@mui/icons-material/Gradient";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { invoke } from "@tauri-apps/api/core";

// ---------- theme ----------
const THEME = {
  bg: "#151f2d",
  header: "#1b2638",
  card: "#1b2638",
  field: "#0f172a",
  border: "#2a3850",
  accent: "#00c96b",
  accentHover: "#00b85f",
  text: "#e2e8f0",
  muted: "#94a3b8",
};

// ---------- tabs ----------
const TABS = [
  { value: "rgb", label: "RGB Static Content", icon: <ImageIcon sx={{ fontSize: 16 }} /> },
  { value: "cmyk", label: "CMYK Static Content", icon: <ImageIcon sx={{ fontSize: 16 }} /> },
  { value: "dynamic", label: "Dynamic Content", icon: <PlayCircleIcon sx={{ fontSize: 16 }} /> },
];

// ---------- color helpers ----------
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function hsvToRgb({ h, s, v }) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;

  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;

  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function rgbToCmyk({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);

  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function cmykToRgb({ c, m, y, k }) {
  const cn = c / 100, mn = m / 100, yn = y / 100, kn = k / 100;
  return {
    r: Math.round(255 * (1 - cn) * (1 - kn)),
    g: Math.round(255 * (1 - mn) * (1 - kn)),
    b: Math.round(255 * (1 - yn) * (1 - kn)),
  };
}

const rgbToHex = ({ r, g, b }) =>
  [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();

const hexToRgb = (hex) => {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const SWATCHES = ["#FF2222", "#FF8C00", "#FFFF00", "#00FF66", "#00E5FF", "#0055FF", "#AA00FF"];
const DEFAULT_HSV = { h: 14, s: 0.87, v: 1 };
const DEFAULT_BRIGHTNESS = 82;
const DEFAULT_OPACITY = 100;

// ---------- shared styles ----------
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 28,
    fontSize: 12,
    color: THEME.text,
    bgcolor: THEME.field,
    borderRadius: 1,
    "& fieldset": { borderColor: THEME.border },
    "&:hover fieldset": { borderColor: "#475569" },
    "&.Mui-focused fieldset": { borderColor: THEME.accent },
  },
  "& input": { p: "4px 8px", textAlign: "center" },
};

const selectSx = {
  height: 28,
  fontSize: 12,
  color: THEME.text,
  bgcolor: THEME.field,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: THEME.border },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#475569" },
  "& .MuiSvgIcon-root": { color: THEME.muted },
};

const primaryButtonSx = {
  height: 34,
  borderRadius: 1.25,
  bgcolor: THEME.accent,
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "none",
  "&:hover": { bgcolor: THEME.accentHover },
  "&.Mui-disabled": { bgcolor: "#1e293b", color: "#64748b" },
};

const secondaryButtonSx = {
  height: 34,
  borderRadius: 1.25,
  bgcolor: THEME.field,
  color: THEME.text,
  border: `1px solid ${THEME.border}`,
  fontSize: 12,
  fontWeight: 600,
  textTransform: "none",
  "&:hover": { bgcolor: THEME.border },
  "&.Mui-disabled": { color: "#64748b", borderColor: THEME.border },
};

const dangerButtonSx = {
  height: 34,
  borderRadius: 1.25,
  bgcolor: THEME.field,
  color: "#f87171",
  border: `1px solid ${THEME.border}`,
  fontSize: 12,
  fontWeight: 600,
  textTransform: "none",
  "&:hover": { bgcolor: "rgba(239,68,68,0.12)", borderColor: "#ef4444" },
  "&.Mui-disabled": { color: "#64748b", borderColor: THEME.border },
};

// ---------- small reusable pieces ----------
function Section({ icon, title, badge, flat = false, children }) {
  return (
    <Box
      sx={{
        bgcolor: flat ? THEME.field : THEME.card,
        borderRadius: 1.5,
        p: 1.1,
        border: `1px solid ${THEME.border}`,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon}
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: THEME.text }}>{title}</Typography>
        </Stack>
        {badge !== undefined && (
          <Chip
            size="small"
            label={badge}
            sx={{
              height: 20,
              bgcolor: "rgba(0,201,107,0.15)",
              color: THEME.accent,
              fontWeight: 700,
              fontSize: 11,
            }}
          />
        )}
      </Stack>
      {children}
    </Box>
  );
}

function SliderRow({ value, onChange }) {
  const stepButtonSx = {
    width: 26,
    height: 26,
    color: THEME.text,
    bgcolor: THEME.field,
    border: `1px solid ${THEME.border}`,
    "&:hover": { bgcolor: THEME.border },
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <IconButton size="small" aria-label="decrease" onClick={() => onChange(clamp(value - 1, 0, 100))} sx={stepButtonSx}>
        <RemoveIcon sx={{ fontSize: 16 }} />
      </IconButton>

      <Slider
        value={value}
        min={0}
        max={100}
        onChange={(_, next) => onChange(next)}
        sx={{
          flex: 1,
          color: THEME.accent,
          height: 4,
          "& .MuiSlider-thumb": {
            width: 16,
            height: 16,
            "&:hover, &.Mui-focusVisible": { boxShadow: "0 0 0 6px rgba(0,201,107,0.2)" },
          },
          "& .MuiSlider-rail": { bgcolor: THEME.border, opacity: 1 },
        }}
      />

      <IconButton size="small" aria-label="increase" onClick={() => onChange(clamp(value + 1, 0, 100))} sx={stepButtonSx}>
        <AddIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Stack>
  );
}

function ChannelInput({ label, value, onChange, onFocus, onBlur, ariaLabel }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography sx={{ fontSize: 12, color: THEME.muted, width: 16 }}>{label}</Typography>
      <TextField
        size="small"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        inputProps={{ inputMode: "numeric", "aria-label": ariaLabel }}
        sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
      />
    </Stack>
  );
}

function SourceTile({ icon, label, hint, selected, disabled, onClick }) {
  return (
    <Box
      role="button"
      aria-disabled={disabled}
      aria-pressed={selected}
      onClick={disabled ? undefined : onClick}
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        py: 0.75,
        px: 0.5,
        borderRadius: 1.25,
        cursor: disabled ? "not-allowed" : "pointer",
        bgcolor: selected ? "rgba(0,201,107,0.12)" : THEME.field,
        border: `1px solid ${selected ? THEME.accent : THEME.border}`,
        opacity: disabled ? 0.45 : 1,
        transition: "border-color 0.15s",
        "&:hover": disabled ? {} : { borderColor: THEME.accent },
      }}
    >
      {React.cloneElement(icon, {
        sx: { fontSize: 20, color: selected ? THEME.accent : THEME.muted },
      })}
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: THEME.text, textAlign: "center" }}>
        {label}
      </Typography>
      {hint && <Typography sx={{ fontSize: 9.5, color: THEME.muted }}>{hint}</Typography>}
    </Box>
  );
}

function MediaRow({ media, selected, onSelect, onRemove }) {
  const Icon = media.type === "Video" ? PlayCircleIcon : ImageIcon;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      onClick={onSelect}
      sx={{
        px: 1,
        py: 0.5,
        borderRadius: 1,
        cursor: "pointer",
        bgcolor: selected ? "rgba(0,201,107,0.12)" : THEME.card,
        border: `1px solid ${selected ? THEME.accent : THEME.border}`,
      }}
    >
      <Icon sx={{ fontSize: 16, color: selected ? THEME.accent : THEME.muted, flexShrink: 0 }} />
      <Typography
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: THEME.text,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {media.name}
      </Typography>
      {selected && (
        <Chip
          size="small"
          label="Selected"
          sx={{
            height: 16,
            bgcolor: "rgba(0,201,107,0.18)",
            color: THEME.accent,
            fontSize: 9,
            fontWeight: 700,
          }}
        />
      )}
      <Typography sx={{ fontSize: 10, color: THEME.muted }}>{media.type}</Typography>
      <IconButton
        size="small"
        aria-label={`Remove ${media.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        sx={{ color: THEME.muted, "&:hover": { color: "#ef4444" } }}
      >
        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Stack>
  );
}

// ---------- main component ----------
function ColorControlPanel({ onApplyColor, onApplyDynamic, onApplySettings: onApplySettingsProp }) {
  const [tab, setTab] = useState("rgb");

  const [hsv, setHsv] = useState(DEFAULT_HSV);
  const [drafts, setDrafts] = useState({ rgb: {}, cmyk: {}, hex: "" });
  const editingRef = useRef(null); // which input group the user is typing in

  const [gradientType, setGradientType] = useState("Gradient");
  const [gradientDirection, setGradientDirection] = useState("Linear");

  // dynamic content state
  const [mediaFiles, setMediaFiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRef = useRef([]); // latest list, used for cleanup on unmount

  const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);

  const [status, setStatus] = useState("");

  const svRef = useRef(null);
  const hueRef = useRef(null);

  const rgb = hsvToRgb(hsv);
  const cmyk = rgbToCmyk(rgb);
  const hex = rgbToHex(rgb);

  const activeMedia = mediaFiles.find((media) => media.id === activeId) ?? null;
  const isVideo = activeMedia?.type === "Video";
  const imageCount = mediaFiles.filter((media) => media.type === "Image").length;
  const videoCount = mediaFiles.filter((media) => media.type === "Video").length;

  const draftsFromColor = (group) => {
    if (group === "rgb") return { r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) };
    if (group === "cmyk") return { c: String(cmyk.c), m: String(cmyk.m), y: String(cmyk.y), k: String(cmyk.k) };
    return hex;
  };

  // keep text inputs in sync with the picker, except the one being typed in
  useEffect(() => {
    const editing = editingRef.current;
    setDrafts((prev) => ({
      rgb: editing === "rgb" ? prev.rgb : draftsFromColor("rgb"),
      cmyk: editing === "cmyk" ? prev.cmyk : draftsFromColor("cmyk"),
      hex: editing === "hex" ? prev.hex : hex,
    }));
  }, [hex]); // eslint-disable-line react-hooks/exhaustive-deps

  // hide the status message after a moment
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  // keep a ref of the latest media list so cleanup can release every URL
  useEffect(() => {
    mediaRef.current = mediaFiles;
  }, [mediaFiles]);

  // release object URLs when the component unmounts
  useEffect(() => {
    return () => {
      mediaRef.current.forEach((media) => URL.revokeObjectURL(media.url));
    };
  }, []);

  // ----- saturation / value box -----
  const updateSV = (clientX, clientY) => {
    const rect = svRef.current.getBoundingClientRect();
    setHsv((prev) => ({
      ...prev,
      s: clamp((clientX - rect.left) / rect.width, 0, 1),
      v: clamp(1 - (clientY - rect.top) / rect.height, 0, 1),
    }));
  };

  // ----- hue slider -----
  const updateHue = (clientY) => {
    const rect = hueRef.current.getBoundingClientRect();
    setHsv((prev) => ({
      ...prev,
      h: clamp(((clientY - rect.top) / rect.height) * 360, 0, 359),
    }));
  };

  // ----- RGB and CMYK inputs: accept partial typing, commit when valid -----
  const handleChannelInput = (group, channel) => (event) => {
    editingRef.current = group;
    const max = group === "rgb" ? 255 : 100;
    const text = event.target.value.replace(/\D/g, "").slice(0, 3);

    setDrafts((prev) => ({ ...prev, [group]: { ...prev[group], [channel]: text } }));

    if (text !== "" && Number(text) <= max) {
      const current = group === "rgb" ? rgb : cmyk;
      const next = { ...current, [channel]: Number(text) };
      const nextRgb = group === "rgb" ? next : cmykToRgb(next);
      setHsv(rgbToHsv(nextRgb));
    }
  };

  const handleGroupBlur = (group) => () => {
    editingRef.current = null;
    setDrafts((prev) => ({ ...prev, [group]: draftsFromColor(group) }));
  };

  // ----- hex input -----
  const handleHexInput = (event) => {
    editingRef.current = "hex";
    const text = event.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
    setDrafts((prev) => ({ ...prev, hex: text }));

    const parsed = hexToRgb(text);
    if (parsed) setHsv(rgbToHsv(parsed));
  };

  const handleHexBlur = () => {
    editingRef.current = null;
    setDrafts((prev) => ({ ...prev, hex }));
  };

  const applySwatch = (swatch) => {
    const parsed = hexToRgb(swatch);
    if (parsed) setHsv(rgbToHsv(parsed));
  };

  const isHexValid = drafts.hex.length === 6;

  // ----- color actions -----
  const handleApplyColor = () => {
    onApplyColor?.({
      mode: tab === "cmyk" ? "CMYK" : "RGB",
      hex: `#${hex}`,
      rgb,
      cmyk,
      gradientType,
      gradientDirection,
    });
    setStatus("Color applied");
    invoke("send_to_clients", { message: "data" }).catch((error) =>
      console.error("send_to_clients failed:", error)
    );
  };

  const handleResetColor = () => {
    setHsv(DEFAULT_HSV);
    setGradientType("Gradient");
    setGradientDirection("Linear");
  };

  // ----- dynamic content: selection -----
  const selectMedia = (id) => {
    setActiveId(id);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFilesSelected = (event) => {
    const selected = Array.from(event.target.files ?? []).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      type: file.type.startsWith("video/") ? "Video" : "Image",
      url: URL.createObjectURL(file),
      file,
    }));

    if (selected.length > 0) {
      setMediaFiles((prev) => [...prev, ...selected]);
      if (!activeId) selectMedia(selected[0].id);
      setStatus(`${selected.length} file(s) added`);
    }

    event.target.value = ""; // allows selecting the same file again
  };

  const handleRemoveMedia = (id) => {
    const item = mediaFiles.find((media) => media.id === id);
    if (!item) return;

    URL.revokeObjectURL(item.url);
    const remaining = mediaFiles.filter((media) => media.id !== id);
    setMediaFiles(remaining);

    if (activeId === id) selectMedia(remaining[0]?.id ?? null);
  };

  // Clears every uploaded file, matching the Files section (separate from Reset, which only resets brightness/opacity)
  const handleClearAllFiles = () => {
    mediaFiles.forEach((media) => URL.revokeObjectURL(media.url));
    setMediaFiles([]);
    selectMedia(null);
    setStatus("All files cleared");
  };

  // ----- dynamic content: playback -----
  const handlePlay = () => {
    if (!activeMedia) return;

    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(true);

    onApplyDynamic?.({
      item: {
        id: activeMedia.id,
        name: activeMedia.name,
        type: activeMedia.type,
        file: activeMedia.file,
      },
    });
    setStatus(`Playing ${activeMedia.name}`);
  };

  // Stop always rewinds fully, so the next Play starts from the beginning
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);

    if (isVideo && videoRef.current) {
      const video = videoRef.current;
      video.pause();

      try {
        video.currentTime = 0;
      } catch {
        // currentTime can throw if metadata isn't ready yet; load() resets it instead
      }

      // Guarantees a full rewind even if the browser hasn't applied currentTime = 0 yet
      video.load();
    }

    setStatus(activeMedia ? `Stopped ${activeMedia.name}` : "Stopped");
  };

  const handleSeek = (_, value) => {
    if (isVideo && videoRef.current) videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolume = (_, value) => {
    setVolume(value);
    if (videoRef.current) videoRef.current.volume = value / 100;
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  // ----- brightness / opacity actions -----
  const handleApplySettings = () => {
    onApplySettingsProp?.({ brightness, opacity });
    setStatus("Brightness & opacity applied");
  };

  const handleResetAdjustments = () => {
    setBrightness(DEFAULT_BRIGHTNESS);
    setOpacity(DEFAULT_OPACITY);
  };

  // ----- Brightness / Opacity + its own Apply/Reset -----
  const adjustmentSections = (
    <>
      <Section icon={<WbSunnyIcon sx={{ fontSize: 18, color: THEME.text }} />} title="Brightness" badge={`${brightness}%`}>
        <SliderRow value={brightness} onChange={setBrightness} />
      </Section>

      <Section icon={<LayersIcon sx={{ fontSize: 18, color: THEME.text }} />} title="Opacity" badge={`${opacity}%`}>
        <SliderRow value={opacity} onChange={setOpacity} />
      </Section>

      <Stack direction="row" spacing={1}>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
          onClick={handleApplySettings}
          sx={primaryButtonSx}
        >
          Apply Settings
        </Button>
        <Button
          fullWidth
          startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
          onClick={handleResetAdjustments}
          sx={secondaryButtonSx}
        >
          Reset
        </Button>
      </Stack>

      <Box sx={{ minHeight: 20 }}>
        {status && (
          <Stack direction="row" alignItems="center" spacing={0.75} justifyContent="center">
            <CheckCircleIcon sx={{ fontSize: 16, color: THEME.accent }} />
            <Typography sx={{ fontSize: 12, color: THEME.accent, fontWeight: 600 }}>{status}</Typography>
          </Stack>
        )}
      </Box>
    </>
  );

  // ----- Files section: its own matching action is "Clear All", not "Apply Settings" -----
  const filesSection = (
    <Section
      icon={<PermMediaIcon sx={{ fontSize: 18, color: THEME.text }} />}
      title="Files"
      badge={`${imageCount} img · ${videoCount} vid`}
    >
      <Box
        sx={{
          maxHeight: 140,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          mb: 1.25,
        }}
      >
        {mediaFiles.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: THEME.muted, textAlign: "center", py: 2 }}>
            No files uploaded yet
          </Typography>
        ) : (
          mediaFiles.map((media) => (
            <MediaRow
              key={media.id}
              media={media}
              selected={media.id === activeId}
              onSelect={() => selectMedia(media.id)}
              onRemove={() => handleRemoveMedia(media.id)}
            />
          ))
        )}
      </Box>

      <Stack direction="row" spacing={1}>
        <Button
          fullWidth
          startIcon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
          onClick={openFilePicker}
          sx={secondaryButtonSx}
        >
          Add More Files
        </Button>
        <Button
          fullWidth
          startIcon={<DeleteSweepIcon sx={{ fontSize: 16 }} />}
          onClick={handleClearAllFiles}
          disabled={mediaFiles.length === 0}
          sx={dangerButtonSx}
        >
          Clear All
        </Button>
      </Stack>
    </Section>
  );

  // ----- dynamic content player (fixed height) -----
  const PLAYER_HEIGHT = 100;

  const playerArea = (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "#000",
        border: `1px solid ${THEME.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ position: "relative", width: "100%", height: PLAYER_HEIGHT, bgcolor: "#000" }}>
        {activeMedia ? (
          <>
            {isVideo ? (
              <Box
                key={activeMedia.id}
                component="video"
                ref={videoRef}
                src={activeMedia.url}
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
                  e.currentTarget.volume = volume / 100;
                }}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <Box
                key={activeMedia.id}
                component="img"
                src={activeMedia.url}
                alt={activeMedia.name}
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
              />
            )}

            {/* Type label on top of the preview */}
            <Chip
              size="small"
              icon={
                isVideo ? (
                  <PlayCircleIcon sx={{ fontSize: "12px !important" }} />
                ) : (
                  <ImageIcon sx={{ fontSize: "12px !important" }} />
                )
              }
              label={activeMedia.type}
              sx={{
                position: "absolute",
                top: 6,
                left: 6,
                height: 18,
                bgcolor: "rgba(0,0,0,0.6)",
                color: THEME.text,
                fontSize: 9.5,
                fontWeight: 700,
              }}
            />

            {/* Centered play overlay: videos only, shown while stopped or paused */}
            {isVideo && !isPlaying && (
              <Box
                role="button"
                aria-label="Play"
                onClick={handlePlay}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: "rgba(0,0,0,0.55)",
                  border: "2px solid rgba(255,255,255,0.85)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                  "&:hover": { bgcolor: "rgba(0,201,107,0.35)" },
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 22, color: "#fff", ml: "2px" }} />
              </Box>
            )}
          </>
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={0.5}
            sx={{ position: "absolute", inset: 0, color: THEME.muted }}
          >
            <PermMediaIcon sx={{ fontSize: 24 }} />
            <Typography sx={{ fontSize: 11 }}>Upload images or videos to preview</Typography>
          </Stack>
        )}
      </Box>

      {/* Playback bar: videos only */}
      {isVideo && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1, py: 0.5, bgcolor: THEME.field }}>
          <Typography sx={{ fontSize: 10.5, color: THEME.text, whiteSpace: "nowrap", minWidth: 88 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>

          <Slider
            size="small"
            min={0}
            max={duration || 1}
            value={Math.min(currentTime, duration || 0)}
            onChange={handleSeek}
            aria-label="Seek"
            sx={{
              flex: 1,
              color: THEME.accent,
              height: 4,
              "& .MuiSlider-thumb": { width: 10, height: 10 },
              "& .MuiSlider-rail": { bgcolor: THEME.border, opacity: 1 },
            }}
          />

          <VolumeUpIcon sx={{ fontSize: 15, color: THEME.muted }} />
          <Slider
            size="small"
            min={0}
            max={100}
            value={volume}
            onChange={handleVolume}
            aria-label="Volume"
            sx={{
              width: 44,
              color: THEME.accent,
              height: 4,
              "& .MuiSlider-thumb": { width: 10, height: 10 },
              "& .MuiSlider-rail": { bgcolor: THEME.border, opacity: 1 },
            }}
          />

          <IconButton size="small" aria-label="Fullscreen" onClick={handleFullscreen} sx={{ color: THEME.muted, p: 0.5 }}>
            <FullscreenIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      )}
    </Box>
  );

  const contentSourceCard = (
    <Section
      icon={<MonitorIcon sx={{ fontSize: 18, color: THEME.text }} />}
      title="Content Source"
      flat
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "stretch" }}>
        {/* Source options */}
        <Stack spacing={0.75} sx={{ width: 100, flexShrink: 0 }}>
          <SourceTile
            icon={<PermMediaIcon />}
            label="Upload Image / Video"
            hint={`${imageCount} img · ${videoCount} vid`}
            selected
            onClick={openFilePicker}
          />
          <SourceTile
            icon={<ScreenShareIcon />}
            label="Screen Sharing"
            hint="Coming soon"
            disabled
          />
        </Stack>

        {/* Player */}
        {playerArea}

        {/* Playback actions: button labels match what each one actually does */}
        <Stack spacing={0.75} sx={{ width: 100, flexShrink: 0 }}>
          <Button
            fullWidth
            size="small"
            startIcon={<FolderOpenIcon sx={{ fontSize: 15 }} />}
            onClick={openFilePicker}
            sx={{ ...secondaryButtonSx, height: 30, fontSize: 11 }}
          >
            Browse File
          </Button>
          <Button
            fullWidth
            size="small"
            variant="contained"
            disableElevation
            startIcon={isPlaying ? <PlayCircleIcon sx={{ fontSize: 15 }} /> : <PlayArrowIcon sx={{ fontSize: 15 }} />}
            onClick={handlePlay}
            disabled={!activeMedia}
            sx={{ ...primaryButtonSx, height: 30, fontSize: 11 }}
          >
            {isPlaying ? "Playing" : "Play"}
          </Button>
          <Button
            fullWidth
            size="small"
            startIcon={<StopIcon sx={{ fontSize: 15 }} />}
            onClick={handleStop}
            disabled={!activeMedia || (!isPlaying && currentTime === 0)}
            sx={{ ...secondaryButtonSx, height: 30, fontSize: 11 }}
          >
            Stop
          </Button>
        </Stack>
      </Stack>
    </Section>
  );

  const TAB_CONTENT_HEIGHT = "min(440px, 65vh)"; // responsive tab content height

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: THEME.bg,
        borderRadius: 2,
        border: `1px solid ${THEME.border}`,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Hidden file input shared by the upload tile and Browse File */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={handleFilesSelected}
      />

      {/* ================= TABS ================= */}
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          bgcolor: THEME.header,
          borderBottom: `1px solid ${THEME.border}`,
          "& .MuiTabs-indicator": { display: "none" },
        }}
      >
        {TABS.map((item) => (
          <Tab
            key={item.value}
            value={item.value}
            icon={item.icon}
            iconPosition="start"
            label={item.label}
            sx={{
              minHeight: 36,
              textTransform: "none",
              fontSize: 12,
              fontWeight: 700,
              color: THEME.muted,
              borderRadius: "6px 6px 0 0",
              "&.Mui-selected": { color: "#fff", bgcolor: THEME.accent },
            }}
          />
        ))}
      </Tabs>

      {/* ================= TAB CONTENT: fixed height across all tabs ================= */}
      <Box
        sx={{
          minHeight: TAB_CONTENT_HEIGHT,
          maxHeight: TAB_CONTENT_HEIGHT,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {tab === "dynamic" ? (
          /* ================= DYNAMIC LAYOUT ================= */
          <Stack spacing={1} sx={{ p: 1, flex: 1 }}>
            {contentSourceCard}

            <Stack direction="row" spacing={1} sx={{ alignItems: "stretch", flex: 1 }}>
              <Stack spacing={0.9} sx={{ flex: 1, minWidth: 0 }}>{adjustmentSections}</Stack>
              <Stack spacing={0.9} sx={{ flex: 1, minWidth: 0 }}>{filesSection}</Stack>
            </Stack>
          </Stack>
        ) : (
          /* ================= STATIC / CMYK LAYOUT ================= */
          <Stack direction="row" spacing={1} sx={{ p: 1, alignItems: "stretch", flex: 1 }}>
            {/* LEFT: COLOR */}
            <Stack spacing={0.9} sx={{ flex: 1, minWidth: 0 }}>
              <Section icon={<PaletteIcon sx={{ fontSize: 18, color: THEME.text }} />} title="Color">
                <Stack direction="row" spacing={1.25}>
                  {/* Saturation / value box */}
                  <Box
                    ref={svRef}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      updateSV(e.clientX, e.clientY);
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons === 1) updateSV(e.clientX, e.clientY);
                    }}
                    sx={{
                      position: "relative",
                      width: 140,
                      height: 100,
                      borderRadius: 1,
                      cursor: "crosshair",
                      touchAction: "none",
                      flexShrink: 0,
                      bgcolor: `hsl(${hsv.h}, 100%, 50%)`,
                      backgroundImage:
                        "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
                      border: `1px solid ${THEME.border}`,
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: `${hsv.s * 100}%`,
                        top: `${(1 - hsv.v) * 100}%`,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        boxShadow: "0 0 4px rgba(0,0,0,0.7)",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                      }}
                    />
                  </Box>

                  {/* Hue slider */}
                  <Box
                    ref={hueRef}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      updateHue(e.clientY);
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons === 1) updateHue(e.clientY);
                    }}
                    sx={{
                      position: "relative",
                      width: 14,
                      height: 100,
                      borderRadius: 1,
                      cursor: "pointer",
                      touchAction: "none",
                      flexShrink: 0,
                      background:
                        "linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: -3,
                        right: -3,
                        top: `${(hsv.h / 360) * 100}%`,
                        height: 8,
                        borderRadius: 1,
                        border: "2px solid #fff",
                        boxShadow: "0 0 3px rgba(0,0,0,0.6)",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                  </Box>

                  {/* Channel inputs: RGB or CMYK depending on tab */}
                  <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                    {tab === "cmyk"
                      ? ["c", "m", "y", "k"].map((channel) => (
                          <ChannelInput
                            key={channel}
                            label={channel.toUpperCase()}
                            value={drafts.cmyk[channel] ?? ""}
                            onChange={handleChannelInput("cmyk", channel)}
                            onFocus={() => (editingRef.current = "cmyk")}
                            onBlur={handleGroupBlur("cmyk")}
                            ariaLabel={`${channel.toUpperCase()} value`}
                          />
                        ))
                      : ["r", "g", "b"].map((channel) => (
                          <ChannelInput
                            key={channel}
                            label={channel.toUpperCase()}
                            value={drafts.rgb[channel] ?? ""}
                            onChange={handleChannelInput("rgb", channel)}
                            onFocus={() => (editingRef.current = "rgb")}
                            onBlur={handleGroupBlur("rgb")}
                            ariaLabel={`${channel.toUpperCase()} value`}
                          />
                        ))}

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ fontSize: 12, color: THEME.muted, width: 16 }}>#</Typography>
                      <TextField
                        size="small"
                        value={drafts.hex}
                        onChange={handleHexInput}
                        onFocus={() => (editingRef.current = "hex")}
                        onBlur={handleHexBlur}
                        error={drafts.hex.length > 0 && !isHexValid}
                        inputProps={{ maxLength: 6, "aria-label": "Hex color" }}
                        sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
                      />
                    </Stack>
                  </Stack>
                </Stack>

                {/* Swatches */}
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: 11, color: THEME.muted, mr: 0.5 }}>Quick:</Typography>
                  {SWATCHES.map((swatch) => (
                    <Tooltip key={swatch} title={swatch} arrow>
                      <Box
                        role="button"
                        aria-label={`Use color ${swatch}`}
                        onClick={() => applySwatch(swatch)}
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 0.75,
                          bgcolor: swatch,
                          cursor: "pointer",
                          border: `#${hex}` === swatch ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
                          transition: "transform 0.1s",
                          "&:hover": { transform: "scale(1.12)" },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              </Section>

              <Section icon={<GradientIcon sx={{ fontSize: 18, color: THEME.text }} />} title="Fill Style">
                <Stack direction="row" spacing={1} sx={{ mb: 0.75 }}>
                  <Select
                    size="small"
                    value={gradientType}
                    onChange={(e) => setGradientType(e.target.value)}
                    sx={{ ...selectSx, flex: 1 }}
                  >
                    <MenuItem value="Gradient">Gradient</MenuItem>
                    <MenuItem value="Solid">Solid</MenuItem>
                  </Select>
                  <Select
                    size="small"
                    value={gradientDirection}
                    disabled={gradientType === "Solid"}
                    onChange={(e) => setGradientDirection(e.target.value)}
                    sx={{ ...selectSx, flex: 1 }}
                  >
                    <MenuItem value="Linear">Linear</MenuItem>
                    <MenuItem value="Radial">Radial</MenuItem>
                  </Select>
                </Stack>
              </Section>

              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  disableElevation
                  startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                  onClick={handleApplyColor}
                  disabled={!isHexValid}
                  sx={primaryButtonSx}
                >
                  Apply Color
                </Button>
                <Button
                  fullWidth
                  startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                  onClick={handleResetColor}
                  sx={secondaryButtonSx}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>

            {/* RIGHT: ADJUSTMENTS */}
            <Stack spacing={0.9} sx={{ flex: 1, minWidth: 0 }}>
              {adjustmentSections}
            </Stack>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default ColorControlPanel;