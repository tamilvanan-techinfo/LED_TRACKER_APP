import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";

import WindowDetails from "../components/WindowDetails";
import WindowManager from "../components/WindowManager";
import WindowControl from "../components/WindowControl";
import ContentDisplyer from "../components/ContentDisplyer";

import ColorControlPanel from "../components/color-control/ColorControlPanel";

import ModbusConfig from "../components/ModbusConfig";
import EditWindowDialog from "../components/EditWindowDialog";

// Adjust this path to wherever your AppBar file lives
import { readIsPlaylist } from "../components/AppBar";

function Dashboard() {
  const [windows, setWindows] = useState([]);
  const [selectedWindowId, setSelectedWindowId] = useState(null);
  const [editingWindowId, setEditingWindowId] = useState(null);

  // ----------------------------------------------
  // LOAD WINDOWS FROM ELECTRON
  // ----------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadWindows = async () => {
      try {
        const result = await invoke("get_all_windows");

        if (cancelled) return;
        setWindows(result);

        const initial =
          result.find((item) => item.active) ?? result[0];

        setSelectedWindowId(initial?.id ?? null);
      } catch (error) {
        console.error("Failed to load windows:", error);
      }
    };

    loadWindows();

    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------
  // DERIVED STATE
  // ----------------------------------------------

  const selectedWindow =
    windows.find(
      (item) => item.id === selectedWindowId
    ) ?? null;

  const editingWindow =
    windows.find(
      (item) => item.id === editingWindowId
    ) ?? null;

  // ----------------------------------------------
  // SEND SOCKET MESSAGE
  // is_playlist is mandatory: it is read from localStorage at send time,
  // so it always reflects the latest dropdown selection.
  // ----------------------------------------------

  const sendWindowSocketMessage = (message) => {
    const windowId = message.windowId ?? selectedWindowId;
    if (windowId == null) {
      console.error("Cannot send a socket message without a selected window ID.");
      return;
    }

    invoke("send_message", {
      message,
      windowId,
      isPlaylist: readIsPlaylist(), // true = playlist, false = quick color
    }).catch((error) => {
      console.error(`Failed to send socket message to window ${windowId}:`, error);
    });
  };

  // ----------------------------------------------
  // SELECT WINDOW
  // ----------------------------------------------

  const handleSelectWindow = (windowData) => {
    setSelectedWindowId(windowData.id);

    setWindows((previous) =>
      previous.map((item) => ({
        ...item,
        active: item.id === windowData.id,
      }))
    );
  };

  // ----------------------------------------------
  // ADD WINDOW
  // ----------------------------------------------

  const handleAddWindow = (newWindow) => {
    setWindows((previous) => [
      ...previous,
      newWindow,
    ]);
  };

  // ----------------------------------------------
  // EDIT WINDOW
  // ----------------------------------------------

  const handleEditWindow = (windowData) => {
    if (!windowData) return;

    handleSelectWindow(windowData);
    setEditingWindowId(windowData.id);
  };

  const handleSaveWindow = async (updatedWindow) => {
    const databaseId = Number(String(updatedWindow.id).replace(/^WIN-/, ""));
    if (!Number.isInteger(databaseId) || databaseId <= 0) {
      console.error("Cannot save window with an invalid ID:", updatedWindow.id);
      return;
    }

    try {
      await invoke("update_window", {
        window: {
          id: databaseId,
          category_id: updatedWindow.content === "Image" ? 1 : 2,
          name: updatedWindow.name,
          height: updatedWindow.height,
          width: updatedWindow.width,
          position_x: updatedWindow.left,
          position_y: updatedWindow.top,
          status: updatedWindow.status ?? true,
          fullscreen: updatedWindow.fullscreen,
        },
      });

      sendWindowSocketMessage({
        type: "window-updated",
        windowId: updatedWindow.id,
        window: updatedWindow,
      });

      setWindows((previous) =>
        previous.map((item) =>
          item.id === updatedWindow.id ? updatedWindow : item
        )
      );
      setEditingWindowId(null);
    } catch (error) {
      console.error("Failed to save window:", error);
    }
  };

  // ----------------------------------------------
  // DELETE WINDOW
  // ----------------------------------------------

  const handleDeleteWindow = async (windowData) => {
    if (!windowData) return;

    try {
      await window.electronAPI?.closeManagedWindow?.(
        windowData.id
      );

      setWindows((previous) =>
        previous.filter(
          (item) => item.id !== windowData.id
        )
      );

      if (selectedWindowId === windowData.id) {
        setSelectedWindowId(null);
      }

      if (editingWindowId === windowData.id) {
        setEditingWindowId(null);
      }
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  // ----------------------------------------------
  // APPLY COLOR
  // ----------------------------------------------

  const handleApplyColor = (colorData) => {
    const windowId = colorData?.windowId ?? selectedWindowId;
    console.log("Applied color:", {
      windowId,
      ...colorData,
    });

    sendWindowSocketMessage({
      type: "color",
      ...colorData,
      windowId,
    });
  };

  // ----------------------------------------------
  // APPLY BRIGHTNESS / OPACITY
  // ----------------------------------------------

  const handleApplySettings = (settings) => {
    const windowId = settings?.windowId ?? selectedWindowId;
    console.log("Applied settings:", {
      windowId,
      ...settings,
    });

    sendWindowSocketMessage({
      type: "settings",
      ...settings,
      windowId,
    });
  };

  // ----------------------------------------------
  // APPLY DYNAMIC CONTENT
  // ----------------------------------------------

  const handleApplyDynamic = (data) => {
    const windowId = data?.windowId ?? selectedWindowId;
    const item = data?.item;
    console.log("Applied dynamic content:", {
      windowId,
      ...data,
    });

    sendWindowSocketMessage({
      type: "dynamic-content",
      windowId,
      item: item
        ? { id: item.id, name: item.name, type: item.type }
        : null,
    });
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 42px)",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "8fr 3fr 4fr",
        gridTemplateRows: "minmax(0, 1fr)",
        gap: 2,
        p: 2,
        boxSizing: "border-box",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* COLUMN 1: CONTENT + COLOR CONTROL */}

      <Box
        sx={{
          bgcolor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 2,
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        <ContentDisplyer />

        <ColorControlPanel
          onApplyColor={handleApplyColor}
          onApplySettings={handleApplySettings}
          onApplyDynamic={handleApplyDynamic}
        />
      </Box>

      {/* COLUMN 2: WINDOW MANAGEMENT */}

      <Box
        sx={{
          bgcolor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 2,
          p: 0.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          minWidth: 0,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        <WindowManager
          windows={windows}
          selectedWindowId={selectedWindowId}
          onSelectWindow={handleSelectWindow}
          onAddWindow={handleAddWindow}
          onEditWindow={handleEditWindow}
          onDeleteWindow={handleDeleteWindow}
        />

        <WindowControl />

        <WindowDetails
          windowData={selectedWindow}
          onEdit={() => handleEditWindow(selectedWindow)}
          onDelete={() => handleDeleteWindow(selectedWindow)}
        />
      </Box>

      {/* COLUMN 3: MODBUS CONFIGURATION */}

      <Box
        sx={{
          bgcolor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 2,
          overflowY: "auto",
          p: 2,
          display: "flex",
          justifyContent: "center",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <ModbusConfig />
      </Box>

      {/* EDIT WINDOW DIALOG */}

      <EditWindowDialog
        open={Boolean(editingWindow)}
        windowData={editingWindow}
        onClose={() => setEditingWindowId(null)}
        onSave={handleSaveWindow}
      />
    </Box>
  );
}

export default Dashboard;