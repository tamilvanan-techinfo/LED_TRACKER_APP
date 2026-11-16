import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Tab, Tabs, Stack, Typography } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ColorPicker from "./ColorPicker";
import ColorPlaylist from "./ColorPlaylist";
import BrightnessOpacity from "./BrightnessOpacity";
import DynamicContent from "./DynamicContent";
import PlaylistDialog from "./PlaylistDialog";
import { invoke } from "@tauri-apps/api/core";
import {
  THEME, DEFAULT_HSV, DEFAULT_BRIGHTNESS, DEFAULT_OPACITY,
  clamp, hsvToRgb, rgbToHsv, rgbToCmyk, cmykToRgb, rgbToHex, hexToRgb,
} from "./colorUtils";

const TABS = [
  { value: "rgb", label: "RGB Static Content", icon: <ImageIcon sx={{ fontSize: 16 }} /> },
  { value: "cmyk", label: "CMYK Static Content", icon: <ImageIcon sx={{ fontSize: 16 }} /> },
  { value: "dynamic", label: "Dynamic Content", icon: <PlayCircleIcon sx={{ fontSize: 16 }} /> },
];

const WINDOW_ID_BY_TAB = {
  rgb: 1,
  cmyk: 2,
  dynamic: 3,
};

const mapSavedPlaylistColor = (savedColor, playlistKey) => {
  const cmyk = savedColor.color;
  return {
    id: savedColor.id,
    name: savedColor.name,
    mode: playlistKey.toUpperCase(),
    hex: savedColor.color.hex.startsWith("#")
      ? savedColor.color.hex
      : `#${savedColor.color.hex}`,
    rgb: cmykToRgb(cmyk),
    cmyk,
    gradientType: "Solid",
    gradientDirection: "Linear",
  };
};

export default function ColorControlPanel({
  onApplyColor, onApplyDynamic, onApplySettings: onApplySettingsProp,
}) {
  const [tab, setTab] = useState("rgb");
  const [hsv, setHsv] = useState(DEFAULT_HSV);
  const [drafts, setDrafts] = useState({ rgb: {}, cmyk: {}, hex: "" });
  const editingRef = useRef(null);
  const [gradientType, setGradientType] = useState("Gradient");
  const [gradientDirection, setGradientDirection] = useState("Linear");

  const [colorPlaylists, setColorPlaylists] = useState({ rgb: [], cmyk: [] });
  const [activePlaylistColorIds, setActivePlaylistColorIds] = useState({
    rgb: null,
    cmyk: null,
  });
  const activePlaylistKey = tab === "cmyk" ? "cmyk" : "rgb";
  const colorPlaylist = colorPlaylists[activePlaylistKey];
  const activePlaylistColorId = activePlaylistColorIds[activePlaylistKey];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlaylistItem, setEditingPlaylistItem] = useState(null);
  const [dialogError, setDialogError] = useState("");

  const [mediaFiles, setMediaFiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRef = useRef([]);

  const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [status, setStatus] = useState("");
  const svRef = useRef(null);
  const hueRef = useRef(null);

  const rgb = useMemo(() => hsvToRgb(hsv), [hsv]);
  const cmyk = useMemo(() => rgbToCmyk(rgb), [rgb]);
  const hex = rgbToHex(rgb);
  const activeMedia = mediaFiles.find((item) => item.id === activeId) ?? null;
  const isVideo = activeMedia?.type === "Video";
  const imageCount = mediaFiles.filter((item) => item.type === "Image").length;
  const videoCount = mediaFiles.filter((item) => item.type === "Video").length;
  const isHexValid = drafts.hex.length === 6;

  useEffect(() => {
    let cancelled = false;

    const loadPlaylist = async (playlistKey) => {
      try {
        const savedColors = await invoke("get_playlist_colors", {
          windowId: WINDOW_ID_BY_TAB[playlistKey],
        });
        if (cancelled) return;

        const loadedItems = savedColors.map((item) =>
          mapSavedPlaylistColor(item, playlistKey)
        );
        setColorPlaylists((prev) => {
          const itemsById = new Map(loadedItems.map((item) => [item.id, item]));
          prev[playlistKey].forEach((item) => itemsById.set(item.id, item));
          return { ...prev, [playlistKey]: Array.from(itemsById.values()) };
        });
      } catch (error) {
        if (!cancelled) {
          console.error(`Failed to load ${playlistKey.toUpperCase()} playlist:`, error);
          setStatus(`Failed to load ${playlistKey.toUpperCase()} playlist`);
        }
      }
    };

    ["rgb", "cmyk"].forEach((playlistKey) => {
      loadPlaylist(playlistKey);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const draftsFromColor = (group) => group === "rgb"
    ? { r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) }
    : group === "cmyk"
      ? { c: String(cmyk.c), m: String(cmyk.m), y: String(cmyk.y), k: String(cmyk.k) }
      : hex;

  useEffect(() => {
    const editing = editingRef.current;
    setDrafts((prev) => ({
      rgb: editing === "rgb" ? prev.rgb : draftsFromColor("rgb"),
      cmyk: editing === "cmyk" ? prev.cmyk : draftsFromColor("cmyk"),
      hex: editing === "hex" ? prev.hex : hex,
    }));
  }, [hex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!status) return undefined;
    const timer = setTimeout(() => setStatus(""), 2200);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => { mediaRef.current = mediaFiles; }, [mediaFiles]);
  useEffect(() => () => mediaRef.current.forEach((item) => URL.revokeObjectURL(item.url)), []);

  const updateSV = (clientX, clientY) => {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHsv((prev) => ({
      ...prev, s: clamp((clientX - rect.left) / rect.width, 0, 1),
      v: clamp(1 - (clientY - rect.top) / rect.height, 0, 1),
    }));
  };
  const updateHue = (clientY) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHsv((prev) => ({ ...prev, h: clamp(((clientY - rect.top) / rect.height) * 360, 0, 359) }));
  };

  const handleChannelInput = (group, channel) => (event) => {
    editingRef.current = group;
    const max = group === "rgb" ? 255 : 100;
    const value = event.target.value.replace(/\D/g, "").slice(0, 3);
    setDrafts((prev) => ({ ...prev, [group]: { ...prev[group], [channel]: value } }));
    if (value !== "" && Number(value) <= max) {
      const current = group === "rgb" ? rgb : cmyk;
      const next = { ...current, [channel]: Number(value) };
      setHsv(rgbToHsv(group === "rgb" ? next : cmykToRgb(next)));
    }
  };
  const handleGroupBlur = (group) => () => {
    editingRef.current = null;
    setDrafts((prev) => ({ ...prev, [group]: draftsFromColor(group) }));
  };
  const handleHexInput = (event) => {
    editingRef.current = "hex";
    const value = event.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
    setDrafts((prev) => ({ ...prev, hex: value }));
    const parsed = hexToRgb(value);
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

  const buildColorPayload = (source = {}) => ({
    mode: source.mode ?? (tab === "cmyk" ? "CMYK" : "RGB"),
    hex: source.hex ?? `#${hex}`,
    rgb: source.rgb ?? rgb,
    cmyk: source.cmyk ?? cmyk,
    gradientType: source.gradientType ?? gradientType,
    gradientDirection: source.gradientDirection ?? gradientDirection,
    windowId: WINDOW_ID_BY_TAB[tab],
  });
  const handleApplyColor = () => {
    onApplyColor?.(buildColorPayload());
    setStatus("Color applied");
  };

  const openNewPlaylistDialog = () => {
    setEditingPlaylistItem(null);
    setDialogError("");
    setDialogOpen(true);
  };
  const savePlaylistColor = async ({ name, rgb: savedRgb, cmyk: savedCmyk }) => {
    const playlistKey = editingPlaylistItem
      ? (editingPlaylistItem.mode === "CMYK" ? "cmyk" : "rgb")
      : (tab === "cmyk" ? "cmyk" : "rgb");
    let item = {
      id: editingPlaylistItem?.id ?? `color-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || `Color ${colorPlaylists[playlistKey].length + 1}`,
      mode: playlistKey.toUpperCase(),
      hex: `#${rgbToHex(savedRgb)}`,
      rgb: savedRgb,
      cmyk: savedCmyk ?? rgbToCmyk(savedRgb),
      gradientType: "Solid",
      gradientDirection: "Linear",
    };

    try {
      const playlistColor = {
        name: item.name,
        color: {
          hex: item.hex,
          c: item.cmyk.c,
          m: item.cmyk.m,
          y: item.cmyk.y,
          k: item.cmyk.k,
        },
      };
      const savedPlaylistColor = editingPlaylistItem
        ? await invoke("update_playlist_color", {
          playlist: { id: editingPlaylistItem.id, ...playlistColor },
        })
        : await invoke("create_playlist_color", {
          playlist: {
            windowId: WINDOW_ID_BY_TAB[playlistKey],
            ...playlistColor,
          },
        });
      item = { ...item, id: savedPlaylistColor.id };
    } catch (error) {
      console.error("Failed to save playlist color:", error);
      setDialogError(String(error));
      setStatus("Failed to save playlist color");
      return;
    }

    setColorPlaylists((prev) => ({
      ...prev,
      [playlistKey]: editingPlaylistItem
        ? prev[playlistKey].map((entry) => entry.id === item.id ? item : entry)
        : [...prev[playlistKey], item],
    }));
    setActivePlaylistColorIds((prev) => ({ ...prev, [playlistKey]: item.id }));
    setDialogError("");
    setDialogOpen(false);
    setEditingPlaylistItem(null);
    setStatus(`${item.name} saved to ${item.mode} playlist`);
  };
  const handleApplyPlaylistColor = (item) => {
    const playlistKey = item.mode === "CMYK" ? "cmyk" : "rgb";
    setActivePlaylistColorIds((prev) => ({ ...prev, [playlistKey]: item.id }));
    onApplyColor?.(buildColorPayload(item));
    setStatus(`${item.hex} applied from playlist`);
  };
  const handleRemovePlaylistColor = async (id) => {
    try {
      await invoke("delete_playlist_color", { id });
      setColorPlaylists((prev) => ({
        ...prev,
        [activePlaylistKey]: prev[activePlaylistKey].filter((item) => item.id !== id),
      }));
      setActivePlaylistColorIds((prev) => ({
        ...prev,
        [activePlaylistKey]: prev[activePlaylistKey] === id
          ? null
          : prev[activePlaylistKey],
      }));
    } catch (error) {
      console.error("Failed to delete playlist color:", error);
      setStatus("Failed to delete playlist color");
    }
  };
  const handleClearPlaylist = async () => {
    try {
      await invoke("clear_playlist_colors", {
        windowId: WINDOW_ID_BY_TAB[activePlaylistKey],
      });
      setColorPlaylists((prev) => ({ ...prev, [activePlaylistKey]: [] }));
      setActivePlaylistColorIds((prev) => ({ ...prev, [activePlaylistKey]: null }));
      setStatus("Color playlist cleared");
    } catch (error) {
      console.error("Failed to clear playlist colors:", error);
      setStatus("Failed to clear playlist colors");
    }
  };

  const selectMedia = (id) => {
    setActiveId(id);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (videoRef.current) videoRef.current.pause();
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
    if (selected.length) {
      setMediaFiles((prev) => [...prev, ...selected]);
      if (!activeId) selectMedia(selected[0].id);
      setStatus(`${selected.length} file(s) added`);
    }
    event.target.value = "";
  };
  const removeMedia = (id) => {
    const item = mediaFiles.find((entry) => entry.id === id);
    if (!item) return;
    URL.revokeObjectURL(item.url);
    const remaining = mediaFiles.filter((entry) => entry.id !== id);
    setMediaFiles(remaining);
    if (activeId === id) selectMedia(remaining[0]?.id ?? null);
  };
  const clearFiles = () => {
    mediaFiles.forEach((item) => URL.revokeObjectURL(item.url));
    setMediaFiles([]);
    selectMedia(null);
    setStatus("All files cleared");
  };

  const handlePlay = async () => {
    if (!activeMedia) return;
    if (isVideo && videoRef.current) {
      try { await videoRef.current.play(); } catch (error) {
        console.error("Video playback failed:", error);
        setStatus("Unable to play video");
        return;
      }
    }
    setIsPlaying(true);
    onApplyDynamic?.({
      windowId: WINDOW_ID_BY_TAB[tab],
      item: { id: activeMedia.id, name: activeMedia.name, type: activeMedia.type, file: activeMedia.file },
    });
    setStatus(`Playing ${activeMedia.name}`);
  };
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      try { videoRef.current.currentTime = 0; } catch { /* metadata may not be ready */ }
      videoRef.current.load();
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
  const handleMetadata = (event) => {
    setDuration(event.currentTarget.duration || 0);
    event.currentTarget.volume = volume / 100;
  };
  const handleApplySettings = () => {
    onApplySettingsProp?.({
      windowId: WINDOW_ID_BY_TAB[tab],
      brightness,
      opacity,
    });
    setStatus("Brightness & opacity applied");
  };
  const resetAdjustments = () => {
    setBrightness(DEFAULT_BRIGHTNESS);
    setOpacity(DEFAULT_OPACITY);
  };

  return (
    <Box sx={{
      width: "100%", bgcolor: THEME.bg, borderRadius: 2,
      border: `1px solid ${THEME.border}`, overflow: "hidden", boxSizing: "border-box",
      display: "flex", flex: "1 1 0", flexDirection: "column", minHeight: 0,
    }}>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth"
        sx={{
          minHeight: 36, bgcolor: THEME.header, borderBottom: `1px solid ${THEME.border}`,
          flexShrink: 0,
          "& .MuiTabs-indicator": { display: "none" },
        }}>
        {TABS.map((item) => (
          <Tab key={item.value} value={item.value} icon={item.icon} iconPosition="start"
            label={item.label} sx={{
              minHeight: 36, textTransform: "none", fontSize: 11, fontWeight: 700,
              color: THEME.muted, "&.Mui-selected": { color: "#fff", bgcolor: THEME.accent },
            }} />
        ))}
      </Tabs>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 1 }}>
        {tab === "dynamic" ? (
          <Stack spacing={1}>
            <DynamicContent
              mediaFiles={mediaFiles} activeId={activeId} activeMedia={activeMedia}
              fileInputRef={fileInputRef} videoRef={videoRef} isPlaying={isPlaying}
              currentTime={currentTime} duration={duration} volume={volume}
              imageCount={imageCount} videoCount={videoCount}
              onOpenPicker={openFilePicker} onFilesSelected={handleFilesSelected}
              onSelectMedia={selectMedia} onRemoveMedia={removeMedia} onClearFiles={clearFiles}
              onPlay={handlePlay} onStop={handleStop}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onMetadata={handleMetadata} onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)} onSeek={handleSeek}
              onVolume={handleVolume} onFullscreen={() => videoRef.current?.requestFullscreen?.()}
            />
            <BrightnessOpacity brightness={brightness} opacity={opacity}
              setBrightness={setBrightness} setOpacity={setOpacity}
              onApply={handleApplySettings} onReset={resetAdjustments} status={status} />
          </Stack>
        ) : (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="stretch">
            <Stack spacing={0.9} sx={{ flex: 1, minWidth: 0 }}>
              <ColorPicker
                tab={tab} hsv={hsv} rgb={rgb} cmyk={cmyk} hex={hex} drafts={drafts}
                isHexValid={isHexValid} svRef={svRef} hueRef={hueRef}
                updateSV={updateSV} updateHue={updateHue}
                handleChannelInput={handleChannelInput} handleGroupBlur={handleGroupBlur}
                handleHexInput={handleHexInput} handleHexBlur={handleHexBlur}
                applySwatch={applySwatch} gradientType={gradientType}
                setGradientType={setGradientType} gradientDirection={gradientDirection}
                setGradientDirection={setGradientDirection} onApply={handleApplyColor}
                onReset={() => { setHsv(DEFAULT_HSV); setGradientType("Gradient"); setGradientDirection("Linear"); }}
                onAddToPlaylist={openNewPlaylistDialog}
              />
              <ColorPlaylist
                title={activePlaylistKey === "cmyk" ? "CMYK Color Playlist" : "RGB Color Playlist"}
                items={colorPlaylist}
                activeId={activePlaylistColorId}
                onApply={handleApplyPlaylistColor}
                onEdit={(item) => {
                  setEditingPlaylistItem(item);
                  setDialogError("");
                  setDialogOpen(true);
                }}
                onRemove={handleRemovePlaylistColor} onClear={handleClearPlaylist} />
            </Stack>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <BrightnessOpacity brightness={brightness} opacity={opacity}
                setBrightness={setBrightness} setOpacity={setOpacity}
                onApply={handleApplySettings} onReset={resetAdjustments} status={status} />
            </Box>
          </Stack>
        )}
      </Box>

      <PlaylistDialog open={dialogOpen}
        mode={editingPlaylistItem?.mode ?? activePlaylistKey.toUpperCase()}
        initialColor={editingPlaylistItem?.rgb ?? rgb}
        initialCmyk={editingPlaylistItem?.cmyk ?? cmyk}
        initialName={editingPlaylistItem?.name ?? `Color ${colorPlaylist.length + 1}`}
        error={dialogError}
        onClose={() => {
          setDialogOpen(false);
          setEditingPlaylistItem(null);
          setDialogError("");
        }}
        onSave={savePlaylistColor} />
    </Box>
  );
}
