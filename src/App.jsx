import { API_URL } from "./config/api";

import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import DashboardHeader from "./components/DashboardHeader";
import { saveMainDashboard } from "./services/saveMainDashboard";
import RestoreWarningModal from "./components/RestoreWarningModal";
import GraphicDisplaySettingsModal from "./components/GraphicDisplaySettingsModal";
import CustomersLocationsPage from "./components/CustomersLocationsPage";

import HmiSymbolsLibrary from "./components/HmiSymbolsLibrary";
import HvacSymbols2DLibrary from "./components/HvacSymbols2DLibrary";
import HvacSymbols3DLibrary from "./components/HvacSymbols3DLibrary";
import ManufacturingSymbols2DLibrary from "./components/ManufacturingSymbols2DLibrary";
import ManufacturingSymbols3DLibrary from "./components/ManufacturingSymbols3DLibrary";
import TanksAndPipesSymbols2DLibrary from "./components/TanksAndPipesSymbols2DLibrary";
import TanksAndPipesSymbols3DLibrary from "./components/TanksAndPipesSymbols3DLibrary";


// ✅ UPDATED IMPORTS (use your helpers)
import {
  getUserKeyFromToken,
  getToken,
  clearAuth,
} from "./utils/authToken";

// PAGES
import HomePage from "./components/HomePage";
import ProfilePage from "./components/ProfilePage";

// SIDEBAR LEFT
import SidebarLeft from "./components/SidebarLeft";

// RIGHT SIDEBAR
import RightSidebar from "./components/RightSidebar";

// IMAGE LIBRARY
import ImageLibrary from "./components/ImageLibrary";

// COREFLEX LIBRARY
import CoreFlexLibrary from "./components/CoreFlexLibrary";

// DASHBOARD CANVAS
import DashboardCanvas from "./components/DashboardCanvas";

// MODALS
import SiloPropertiesModal from "./components/SiloPropertiesModal";
import DisplaySettingsModal from "./components/DisplaySettingsModal";

// HOOKS
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useCanvasSelection from "./hooks/useCanvasSelection";
import useObjectDragging from "./hooks/useObjectDragging";
import useDropHandler from "./hooks/useDropHandler";

export default function App() {
  const navigate = useNavigate();

  // ✅ identify which user is currently logged in (from JWT)
  const [currentUserKey, setCurrentUserKey] = useState(() =>
    getUserKeyFromToken()
  );

  // DEVICE DATA
  const [sensorsData, setSensorsData] = useState([]);

  // OBJECTS ON CANVAS
  const [droppedTanks, setDroppedTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // ✅ UNDO / REDO HISTORY (last 6 actions)
const MAX_HISTORY = 6;
const [history, setHistory] = useState([]);
const [historyIndex, setHistoryIndex] = useState(-1);
const historyIndexRef = useRef(-1);
const skipHistoryRef = useRef(false);
const hasHistoryInitRef = useRef(false);

  // SIDEBARS
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // ⚠️ RESTORE WARNING MODAL
  const [showRestoreWarning, setShowRestoreWarning] = useState(false);

  // MENUS
  const [showDevices, setShowDevices] = useState(false);
  const [showLevelSensors, setShowLevelSensors] = useState(false);

  // CONTEXT MENU
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
  });

  // ACTIVE SILO
  const [activeSiloId, setActiveSiloId] = useState(null);
  const [showSiloProps, setShowSiloProps] = useState(false);

  // DISPLAY SETTINGS MODAL
  const [displaySettingsId, setDisplaySettingsId] = useState(null);
  const openDisplaySettings = (tank) => setDisplaySettingsId(tank.id);
  const closeDisplaySettings = () => setDisplaySettingsId(null);

  // ✅ GRAPHIC DISPLAY SETTINGS MODAL
  const [graphicSettingsId, setGraphicSettingsId] = useState(null);
  const openGraphicDisplaySettings = (tank) => setGraphicSettingsId(tank.id);
  const closeGraphicDisplaySettings = () => setGraphicSettingsId(null);

  // ===============================
  // ✅ NAVIGATION (persist on refresh)
  // ===============================
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("coreflex_activePage") || "home";
  });
  const [activeSubPage, setActiveSubPage] = useState(null);
  const [subPageColor, setSubPageColor] = useState("");

  // Persist activePage changes
  useEffect(() => {
    localStorage.setItem("coreflex_activePage", activePage);
  }, [activePage]);

  // ⭐ DASHBOARD MODE — DEFAULT EDIT
  const [dashboardMode, setDashboardMode] = useState("edit");

  // ⭐ LAST SAVED TIMESTAMP
  const [lastSavedAt, setLastSavedAt] = useState(null);



  // IMAGE LIBRARY WINDOW
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  

  const [imageLibraryPos, setImageLibraryPos] = useState({ x: 260, y: 140 });
  const [imageLibrarySize, setImageLibrarySize] = useState(() => {
  const maxW = window.innerWidth - 80;
  const maxH = window.innerHeight - 140;

  return {
    width: Math.min(720, maxW),  // 400 * 3
    height: Math.min(480, maxH),  // 300 * 3
  };
});
  const [isDraggingLibrary, setIsDraggingLibrary] = useState(false);
  const [isResizingLibrary, setIsResizingLibrary] = useState(false);
  const [libraryDragOffset, setLibraryDragOffset] = useState({ x: 0, y: 0 });

 // COREFLEX LIBRARY WINDOW
const [showCoreflexLibrary, setShowCoreflexLibrary] = useState(false);
const [coreflexLibraryPos, setCoreflexLibraryPos] = useState({
  x: 520,
  y: 120,
});
const [coreflexLibrarySize, setCoreflexLibrarySize] = useState({
  width: 720,   // ⬅️ was 400
  height: 480,   // ⬅️ was 300
});
  const [isDraggingCoreflex, setIsDraggingCoreflex] = useState(false);
  const [isResizingCoreflex, setIsResizingCoreflex] = useState(false);
  const [coreflexDragOffset, setCoreflexDragOffset] = useState({
    x: 0,
    y: 0,
  });

  // ===============================
// ✅ SYMBOL LIBRARIES DRAG / RESIZE
// ===============================
const [activeSymbolWindow, setActiveSymbolWindow] = useState(null);
// "hmi" | "hvac2d" | "hvac3d" | "mfg2d" | "mfg3d" | "tp2d" | "tp3d"

const [isDraggingSymbol, setIsDraggingSymbol] = useState(false);
const [isResizingSymbol, setIsResizingSymbol] = useState(false);

const [symbolDragOffset, setSymbolDragOffset] = useState({
  x: 0,
  y: 0,
});





  // ✅ SYMBOL LIBRARIES WINDOWS
const [showHmiLibrary, setShowHmiLibrary] = useState(false);
const [showHvac2DLibrary, setShowHvac2DLibrary] = useState(false);
const [showHvac3DLibrary, setShowHvac3DLibrary] = useState(false);
const [showManufacturing2DLibrary, setShowManufacturing2DLibrary] = useState(false);
const [showManufacturing3DLibrary, setShowManufacturing3DLibrary] = useState(false);
const [showTanksPipes2DLibrary, setShowTanksPipes2DLibrary] = useState(false);
const [showTanksPipes3DLibrary, setShowTanksPipes3DLibrary] = useState(false);

// positions (you can adjust)
const [hmiPos, setHmiPos] = useState({ x: 520, y: 120 });
const [hvac2DPos, setHvac2DPos] = useState({ x: 560, y: 140 });
const [hvac3DPos, setHvac3DPos] = useState({ x: 600, y: 160 });
const [mfg2DPos, setMfg2DPos] = useState({ x: 640, y: 180 });
const [mfg3DPos, setMfg3DPos] = useState({ x: 680, y: 200 });
const [tp2DPos, setTp2DPos] = useState({ x: 720, y: 220 });
const [tp3DPos, setTp3DPos] = useState({ x: 760, y: 240 });

// get current symbol window position
const getSymbolPos = (key) => {
  const map = {
    hmi: hmiPos,
    hvac2d: hvac2DPos,
    hvac3d: hvac3DPos,
    mfg2d: mfg2DPos,
    mfg3d: mfg3DPos,
    tp2d: tp2DPos,
    tp3d: tp3DPos,
  };
  return map[key];
};

// start dragging a symbol window
const startDragSymbolWindow = (key, e) => {
  e.stopPropagation();

  setActiveSymbolWindow(key);
  setIsDraggingSymbol(true);

  const pos = getSymbolPos(key);
  setSymbolDragOffset({
    x: e.clientX - pos.x,
    y: e.clientY - pos.y,
  });
};

// start resizing a symbol window
const startResizeSymbolWindow = (key, e) => {
  e.stopPropagation();

  setActiveSymbolWindow(key);
  setIsResizingSymbol(true);
};

// sizes (reuse CoreFlex size if you want)
const [symbolsSize, setSymbolsSize] = useState(() => {
  const maxW = window.innerWidth - 120;
  const maxH = window.innerHeight - 180;

  return {
    width: Math.min(820, maxW),
    height: Math.min(560, maxH),
  };
});


  // SENSOR SETUP
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  const getLayerScore = (obj) => {
    const base = obj.zIndex ?? 1;
    let offset = 0;
    if (obj.shape === "textBox") offset = 1;
    else if (obj.shape === "img") offset = 2;
    else if (obj.shape === "displayBox") offset = 3;
    return base * 10 + offset;
  };

  // ===============================
// ⏪ UNDO / REDO HELPERS
// ===============================
const cloneObjects = (objs) => JSON.parse(JSON.stringify(objs || []));

// ⏪ push snapshot
const pushToHistory = (nextObjects) => {
  if (skipHistoryRef.current) {
    skipHistoryRef.current = false;
    return;
  }

  const snap = cloneObjects(nextObjects);

  setHistory((prev) => {
    const idx = historyIndexRef.current;

    // remove redo steps if user makes a new action
    const trimmed = prev.slice(0, idx + 1);

    const updated = [...trimmed, snap];

    // keep last MAX_HISTORY states
    if (updated.length > MAX_HISTORY) updated.shift();

    const newIndex = updated.length - 1;
    setHistoryIndex(newIndex);
    historyIndexRef.current = newIndex;

    return updated;
  });
};

// ✅ ADD THIS RIGHT HERE ⬇⬇⬇
useEffect(() => {
  historyIndexRef.current = historyIndex;
}, [historyIndex]);

const resetHistory = (objects) => {
  const snap = cloneObjects(objects);
  setHistory([snap]);
  setHistoryIndex(0);
  historyIndexRef.current = 0;
  hasHistoryInitRef.current = true;
};

const handleUndo = () => {
  const idx = historyIndexRef.current;
  if (idx <= 0) return;

  skipHistoryRef.current = true;
  setDroppedTanks(cloneObjects(history[idx - 1]));
  setHistoryIndex(idx - 1);

  setSelectedIds([]);
  setSelectedTank(null);
};

const handleRedo = () => {
  const idx = historyIndexRef.current;
  if (idx >= history.length - 1) return;

  skipHistoryRef.current = true;
  setDroppedTanks(cloneObjects(history[idx + 1]));
  setHistoryIndex(idx + 1);

  setSelectedIds([]);
  setSelectedTank(null);
};

// ✅✅✅ STEP 4 — INITIALIZE HISTORY ONCE
useEffect(() => {
  // only on dashboard page
  if (activePage !== "dashboard") return;

  // only run once
  if (hasHistoryInitRef.current) return;

  // initialize history with the current objects
  resetHistory(droppedTanks);
}, [activePage]);  // <-- IMPORTANT: only activePage (NOT droppedTanks)

// ✅ ADD THIS EFFECT RIGHT AFTER STEP 4
useEffect(() => {
  if (activePage !== "dashboard") return;
  if (!hasHistoryInitRef.current) return;

  // will be skipped automatically during undo/redo because skipHistoryRef is true
  pushToHistory(droppedTanks);
}, [droppedTanks]);

// ✅ STEP 6 — KEYBOARD LISTENER (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
useEffect(() => {
  const onKeyDown = (e) => {
    if (activePage !== "dashboard") return;

    const key = (e.key || "").toLowerCase();
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (!mod) return;

    // Ctrl+Z (undo)
    if (key === "z" && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    // Ctrl+Shift+Z (redo) OR Ctrl+Y (redo)
    if ((key === "z" && e.shiftKey) || key === "y") {
      e.preventDefault();
      handleRedo();
      return;
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [activePage, history, handleUndo, handleRedo]);


  // ✅ USER AUTH STATE SYNC (critical)
  useEffect(() => {
    const syncUserFromToken = () => {
      const newUserKey = getUserKeyFromToken();
      const token = getToken();

      // if token missing -> full reset
      if (!token || !newUserKey) {
        setCurrentUserKey(null);
        setDroppedTanks([]);
        setSelectedTank(null);
        setSelectedIds([]);
        setLastSavedAt(null);
        setDashboardMode("edit");
        setActivePage("home");
        return;
      }

      if (newUserKey !== currentUserKey) {
        console.log(
          "🔄 User changed → resetting dashboard state",
          currentUserKey,
          "→",
          newUserKey
        );

        setCurrentUserKey(newUserKey);
        setDroppedTanks([]);
        setSelectedTank(null);
        setSelectedIds([]);
        setLastSavedAt(null);
        setDashboardMode("edit");
        setActivePage("home");
      }
    };

    syncUserFromToken();
    window.addEventListener("coreflex-auth-changed", syncUserFromToken);

    return () => {
      window.removeEventListener("coreflex-auth-changed", syncUserFromToken);
    };
  }, [currentUserKey]);

  // ⭐ COLLAPSE BOTH SIDEBARS WHEN IN PLAY
  useEffect(() => {
    if (dashboardMode === "play") {
      setIsLeftCollapsed(true);
      setIsRightCollapsed(true);
    } else {
      setIsLeftCollapsed(false);
      setIsRightCollapsed(false);
    }
  }, [dashboardMode]);

  // ================================
  // 📡 FETCH LIVE SENSOR DATA FROM API
  // ================================
  useEffect(() => {
    fetch(`${API_URL}/devices`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load devices");
        return res.json();
      })
      .then((data) =>
        setSensorsData(
          data.map((s) => ({
            ...s,
            level_percent: Math.min(100, Math.round((s.level / 55) * 100)),
            date_received: s.last_update?.split("T")[0] || "",
            time_received: s.last_update
              ? new Date(s.last_update).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          }))
        )
      )
      .catch((err) => {
        console.error("Sensor API error:", err);
        setSensorsData([]);
      });
  }, []);

  // ⭐ LOAD LAST SAVED TIMESTAMP (per user)
  useEffect(() => {
    const loadLastSavedTimestamp = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLastSavedAt(null);
          return;
        }

        const res = await fetch(`${API_URL}/dashboard/main`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setLastSavedAt(null);
          return;
        }

        const data = await res.json();
        const savedAt = data?.layout?.meta?.savedAt || data?.meta?.savedAt;

        setLastSavedAt(savedAt ? new Date(savedAt) : null);
      } catch (err) {
        console.error("Failed to load last saved timestamp:", err);
        setLastSavedAt(null);
      }
    };

    loadLastSavedTimestamp();
  }, [currentUserKey]);

  const hideContextMenu = () =>
    setContextMenu((prev) => ({ ...prev, visible: false }));

  const handleRightClick = (id, x, y) => {
    setContextMenu({ visible: true, x, y, targetId: id });
  };

  // ✅ LOGOUT (single source of truth)
  const handleLogout = () => {
    clearAuth();

    setCurrentUserKey(null);
    setDroppedTanks([]);
    setSelectedTank(null);
    setSelectedIds([]);
    setLastSavedAt(null);
    setDashboardMode("edit");
    setActivePage("home");

    window.dispatchEvent(new Event("coreflex-auth-changed"));
    navigate("/");
  };

  // 💾 SAVE PROJECT
  const handleSaveProject = async () => {
    const dashboardPayload = {
      version: "1.0",
      type: "main_dashboard",
      canvas: { objects: droppedTanks },
      meta: { dashboardMode, savedAt: new Date().toISOString() },
    };

    try {
      const token = getToken();
      console.log("✅ SAVE token start:", token?.slice?.(0, 25));
      console.log("✅ SAVE userKey:", getUserKeyFromToken(token));

      await saveMainDashboard(dashboardPayload);

      setLastSavedAt(new Date());
      console.log("✅ Main Dashboard saved");
    } catch (err) {
      console.error("❌ Save failed:", err);
    }
  };

  // ⬆ RESTORE PROJECT (manual button)
  const handleUploadProject = async () => {
    try {
      const token = getToken();
      console.log("⬆️ RESTORE token start:", token?.slice?.(0, 25));
      console.log("⬆️ RESTORE userKey:", getUserKeyFromToken(token));

      if (!token) throw new Error("No auth token found");

      const res = await fetch(`${API_URL}/dashboard/main`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load dashboard from DB");

      const data = await res.json();
      console.log("📦 Dashboard payload from DB:", data);

      setDroppedTanks([]);

      setTimeout(() => {
        const objects =
          data?.canvas?.objects ||
          data?.layout?.canvas?.objects ||
          data?.layout?.objects ||
          [];

        setDroppedTanks([...objects]);

        const mode =
          data?.layout?.meta?.dashboardMode || data?.meta?.dashboardMode;
        if (mode) setDashboardMode(mode);

        const savedAt = data?.layout?.meta?.savedAt || data?.meta?.savedAt;
        setLastSavedAt(savedAt ? new Date(savedAt) : null);

        console.log("✅ Main dashboard restored from DB");
      }, 0);
    } catch (err) {
      console.error("❌ Upload failed:", err);
    }
  };

// ===============================
// ✅ OPEN SYMBOL LIBRARIES (CENTER + SMALL)
// ===============================
const openSymbolLibrary = (key) => {
  // 📐 default smaller size
  const maxW = window.innerWidth - 120;
  const maxH = window.innerHeight - 180;

  const newSize = {
    width: Math.min(820, maxW),
    height: Math.min(560, maxH),
  };

  setSymbolsSize(newSize);

  // 🎯 center on screen
  const centerPos = {
    x: Math.max(20, Math.round((window.innerWidth - newSize.width) / 2)),
    y: Math.max(20, Math.round((window.innerHeight - newSize.height) / 2)),
  };

  // set position per library
  if (key === "hmi") setHmiPos(centerPos);
  if (key === "hvac2d") setHvac2DPos(centerPos);
  if (key === "hvac3d") setHvac3DPos(centerPos);
  if (key === "mfg2d") setMfg2DPos(centerPos);
  if (key === "mfg3d") setMfg3DPos(centerPos);
  if (key === "tp2d") setTp2DPos(centerPos);
  if (key === "tp3d") setTp3DPos(centerPos);

  setActiveSymbolWindow(key);

  if (key === "hmi") setShowHmiLibrary(true);
  if (key === "hvac2d") setShowHvac2DLibrary(true);
  if (key === "hvac3d") setShowHvac3DLibrary(true);
  if (key === "mfg2d") setShowManufacturing2DLibrary(true);
  if (key === "mfg3d") setShowManufacturing3DLibrary(true);
  if (key === "tp2d") setShowTanksPipes2DLibrary(true);
  if (key === "tp3d") setShowTanksPipes3DLibrary(true);
};


  // ==========================================
  // ✅ AUTO-RESTORE FROM DB ON REFRESH (FIX)
  // ==========================================
  const autoRestoreRanRef = useRef(false);

  useEffect(() => {
    const autoRestore = async () => {
      if (autoRestoreRanRef.current) return;

      // only for dashboard page
      if (activePage !== "dashboard") return;

      // don't overwrite if already has objects
      if (droppedTanks.length > 0) return;

      const token = getToken();
      if (!token) return;

      autoRestoreRanRef.current = true;

      try {
        const res = await fetch(`${API_URL}/dashboard/main`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        const objects =
          data?.canvas?.objects ||
          data?.layout?.canvas?.objects ||
          data?.layout?.objects ||
          [];

        setDroppedTanks(objects);

        const mode =
          data?.layout?.meta?.dashboardMode || data?.meta?.dashboardMode;
        if (mode) setDashboardMode(mode);

        const savedAt = data?.layout?.meta?.savedAt || data?.meta?.savedAt;
        setLastSavedAt(savedAt ? new Date(savedAt) : null);

        console.log("✅ Auto restored dashboard on refresh");
      } catch (err) {
        console.error("❌ Auto restore failed:", err);
      }
    };

    autoRestore();
  }, [activePage, currentUserKey]); // important: run when page/user is known

  // KEYBOARD SHORTCUTS
  useKeyboardShortcuts({
    selectedIds,
    setSelectedIds,
    selectedTank,
    setSelectedTank,
    droppedTanks,
    setDroppedTanks,
  });

  // CANVAS SELECTION
  const {
    selectionBox,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  } = useCanvasSelection({
    droppedTanks,
    setSelectedIds,
    setSelectedTank,
    hideContextMenu,
  });

  // OBJECT DRAGGING
  const { dragDelta, setDragDelta, handleDragMove, handleDragEnd, guides } =
    useObjectDragging({
      selectedIds,
      droppedTanks,
      setDroppedTanks,
    });

  // DROP HANDLER
  const { handleDrop } = useDropHandler({
  
    setDroppedTanks,
  });

  const handleSelect = (id) => {
    setSelectedTank(id);
    setSelectedIds([id]);
    hideContextMenu();
  };

  const activeSilo = droppedTanks.find(
    (t) => t.id === activeSiloId && t.shape === "siloTank"
  );

 const displayTarget = droppedTanks.find(
  (t) =>
    t.id === displaySettingsId &&
    (t.shape === "displayBox" || t.shape === "displayOutput")
);


  const graphicTarget = droppedTanks.find(
    (t) => t.id === graphicSettingsId && t.shape === "graphicDisplay"
  );

  // ⭐ GLOBAL MOUSE MOVE / UP FOR DRAGGING + RESIZING WINDOWS
useEffect(() => {
  const handleMouseMove = (e) => {
    // IMAGE LIBRARY
    if (isDraggingLibrary) {
      setImageLibraryPos({
        x: e.clientX - libraryDragOffset.x,
        y: e.clientY - libraryDragOffset.y,
      });
    }

    if (isResizingLibrary) {
      setImageLibrarySize({
        width: Math.max(600, e.clientX - imageLibraryPos.x),
        height: Math.max(400, e.clientY - imageLibraryPos.y),
      });
    }

    // COREFLEX LIBRARY
    if (isDraggingCoreflex) {
      setCoreflexLibraryPos({
        x: e.clientX - coreflexDragOffset.x,
        y: e.clientY - coreflexDragOffset.y,
      });
    }

    if (isResizingCoreflex) {
      setCoreflexLibrarySize({
        width: Math.max(600, e.clientX - coreflexLibraryPos.x),
        height: Math.max(400, e.clientY - coreflexLibraryPos.y),
      });
    }

    // ✅ SYMBOL LIBRARIES DRAG
    if (isDraggingSymbol && activeSymbolWindow) {
      const setters = {
        hmi: setHmiPos,
        hvac2d: setHvac2DPos,
        hvac3d: setHvac3DPos,
        mfg2d: setMfg2DPos,
        mfg3d: setMfg3DPos,
        tp2d: setTp2DPos,
        tp3d: setTp3DPos,
      };

      const setPos = setters[activeSymbolWindow];
      if (setPos) {
        setPos({
          x: e.clientX - symbolDragOffset.x,
          y: e.clientY - symbolDragOffset.y,
        });
      }
    }

    // ✅ SYMBOL LIBRARIES RESIZE
    if (isResizingSymbol && activeSymbolWindow) {
      const pos = getSymbolPos(activeSymbolWindow);

      setSymbolsSize({
        width: Math.max(600, e.clientX - pos.x),
        height: Math.max(400, e.clientY - pos.y),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingLibrary(false);
    setIsResizingLibrary(false);
    setIsDraggingCoreflex(false);
    setIsResizingCoreflex(false);

    // ✅ stop symbol drag/resize too
    setIsDraggingSymbol(false);
    setIsResizingSymbol(false);
    setActiveSymbolWindow(null);
  };

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}, [
  // library
  isDraggingLibrary,
  isResizingLibrary,
  libraryDragOffset,
  imageLibraryPos.x,
  imageLibraryPos.y,

  // coreflex
  isDraggingCoreflex,
  isResizingCoreflex,
  coreflexDragOffset,
  coreflexLibraryPos.x,
  coreflexLibraryPos.y,

  // symbols
  isDraggingSymbol,
  isResizingSymbol,
  activeSymbolWindow,
  symbolDragOffset,

  // positions used by getSymbolPos
  hmiPos,
  hvac2DPos,
  hvac3DPos,
  mfg2DPos,
  mfg3DPos,
  tp2DPos,
  tp3DPos,
]);


  return (
    <div
      className="flex h-screen bg-white"
      onClick={() => {
        if (showRestoreWarning) return;
        hideContextMenu();
      }}
    >
      <SidebarLeft
        isLeftCollapsed={isLeftCollapsed}
        setIsLeftCollapsed={setIsLeftCollapsed}
        activePage={activePage}
        setActivePage={setActivePage}
        showDevices={showDevices}
        setShowDevices={setShowDevices}
        showLevelSensors={showLevelSensors}
        setShowLevelSensors={setShowLevelSensors}
        dashboardMode={dashboardMode}
        onSaveProject={handleSaveProject}
        onRequestRestore={() => setShowRestoreWarning(true)}
        lastSavedAt={lastSavedAt}
      />

      <main className="flex-1 p-6 bg-white overflow-visible relative">
        <Header onLogout={handleLogout} />

        {activePage === "dashboard" ? (
          <DashboardHeader
            dashboardMode={dashboardMode}
            setDashboardMode={setDashboardMode}
            onLaunch={() => window.open("/launchMainDashboard", "_blank")}
          />
        ) : (
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            {activePage === "home"
              ? "Home"
              : activePage === "deviceControls"
              ? "Device Controls"
              : "Main Dashboard"}
          </h1>
        )}

        {activePage === "home" ? (
          <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <div className="w-full h-full p-6">
           {activeSubPage === "profile" ? (
  <ProfilePage
    subPageColor={subPageColor}
    setActiveSubPage={setActiveSubPage}
  />
) : activeSubPage === "customers" ? (
  <CustomersLocationsPage
    subPageColor={subPageColor}
    setActiveSubPage={setActiveSubPage}
  />
) : (
  <HomePage
    setActiveSubPage={setActiveSubPage}
    setSubPageColor={setSubPageColor}
  />
)}

            </div>
          </div>
        ) : activePage === "dashboard" ? (
          <DashboardCanvas
            dashboardMode={dashboardMode}
            sensors={sensors}
            sensorsData={sensorsData}
            droppedTanks={droppedTanks}
            setDroppedTanks={setDroppedTanks}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            selectedTank={selectedTank}
            setSelectedTank={setSelectedTank}
            dragDelta={dragDelta}
            setDragDelta={setDragDelta}
            contextMenu={contextMenu}
            setContextMenu={setContextMenu}
            activeSiloId={activeSiloId}
            setActiveSiloId={setActiveSiloId}
            setShowSiloProps={setShowSiloProps}
            handleSelect={handleSelect}
            handleRightClick={handleRightClick}
            handleDrop={handleDrop}
            handleDragMove={handleDragMove}
            handleDragEnd={handleDragEnd}
            handleCanvasMouseDown={handleCanvasMouseDown}
            handleCanvasMouseMove={handleCanvasMouseMove}
            handleCanvasMouseUp={handleCanvasMouseUp}
            getLayerScore={getLayerScore}
            selectionBox={selectionBox}
            hideContextMenu={hideContextMenu}
            guides={guides}
            onOpenDisplaySettings={openDisplaySettings}
            onOpenGraphicDisplaySettings={openGraphicDisplaySettings}
          />
        ) : activePage === "deviceControls" ? (
          <div className="w-full h-full border rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Device Controls
            </h2>

            <p className="text-sm text-gray-600">
              Here we will add buttons + toggle switches for devices.
            </p>
          </div>
        ) : null}

        {displayTarget && (
          <DisplaySettingsModal
            tank={displayTarget}
            onClose={closeDisplaySettings}
            onSave={(updatedProps) => {
              setDroppedTanks((prev) =>
                prev.map((t) =>
                  t.id === displayTarget.id
                    ? {
                        ...t,
                        properties: {
                          ...(t.properties || {}),
                          ...updatedProps,
                        },
                      }
                    : t
                )
              );
            }}
          />
        )}

        {graphicTarget && (
          <GraphicDisplaySettingsModal
            open={true}
            tank={graphicTarget}
            onClose={closeGraphicDisplaySettings}
            onSave={(updatedTank) => {
              setDroppedTanks((prev) =>
                prev.map((t) => (t.id === updatedTank.id ? updatedTank : t))
              );
              closeGraphicDisplaySettings();
            }}
          />
        )}

        {showSiloProps && activeSilo && (
          <SiloPropertiesModal
            open={showSiloProps}
            silo={activeSilo}
            onClose={() => setShowSiloProps(false)}
            onSave={(updatedSilo) =>
              setDroppedTanks((prev) =>
                prev.map((t) => (t.id === updatedSilo.id ? updatedSilo : t))
              )
            }
          />
        )}

        <ImageLibrary
  visible={showImageLibrary}
  position={imageLibraryPos}
  size={imageLibrarySize}
  onClose={() => setShowImageLibrary(false)}
  onDragStartImage={(e, img) => e.dataTransfer.setData("imageUrl", img.src)}
  onStartDragWindow={(e) => {
    setIsDraggingLibrary(true);
    setLibraryDragOffset({
      x: e.clientX - imageLibraryPos.x,
      y: e.clientY - imageLibraryPos.y,
    });
  }}
  onStartResizeWindow={() => setIsResizingLibrary(true)}
/>


        <CoreFlexLibrary
          visible={showCoreflexLibrary}
          position={coreflexLibraryPos}
          size={coreflexLibrarySize}
          onClose={() => setShowCoreflexLibrary(false)}
          onStartDragWindow={(e) => {
            setIsDraggingCoreflex(true);
            setCoreflexDragOffset({
              x: e.clientX - coreflexLibraryPos.x,
              y: e.clientY - coreflexLibraryPos.y,
            });
          }}
          onStartResizeWindow={() => setIsResizingCoreflex(true)}
        />

        {/* ✅ ADD THEM RIGHT HERE */}

<HmiSymbolsLibrary
  visible={showHmiLibrary}
  position={hmiPos}
  size={symbolsSize}
  onClose={() => setShowHmiLibrary(false)}
  onStartDragWindow={(e) => startDragSymbolWindow("hmi", e)}
  onStartResizeWindow={(e) => startResizeSymbolWindow("hmi", e)}
/>

<HvacSymbols2DLibrary
  visible={showHvac2DLibrary}
  position={hvac2DPos}
  size={symbolsSize}
  onClose={() => setShowHvac2DLibrary(false)}
  onStartDragWindow={(e) => startDragSymbolWindow("hvac2d", e)}
  onStartResizeWindow={(e) => startResizeSymbolWindow("hvac2d", e)}
/>

<HvacSymbols3DLibrary
  visible={showHvac3DLibrary}
  position={hvac3DPos}
  size={symbolsSize}
  onClose={() => setShowHvac3DLibrary(false)}
  onStartDragWindow={(e) => startDragSymbolWindow("hvac3d", e)}
  onStartResizeWindow={(e) => startResizeSymbolWindow("hvac3d", e)}
/>

<ManufacturingSymbols2DLibrary
  visible={showManufacturing2DLibrary}
  position={mfg2DPos}
  size={symbolsSize}
  onClose={() => setShowManufacturing2DLibrary(false)}
  onStartDragWindow={(e) => startDragSymbolWindow("mfg2d", e)}
  onStartResizeWindow={(e) => startResizeSymbolWindow("mfg2d", e)}
/>

<ManufacturingSymbols3DLibrary
  visible={showManufacturing3DLibrary}
  position={mfg3DPos}
  size={symbolsSize}
  onClose={() => setShowManufacturing3DLibrary(false)}
  onStartDragWindow={(e) => startDragSymbolWindow("mfg3d", e)}
  onStartResizeWindow={(e) => startResizeSymbolWindow("mfg3d", e)}
/>

<TanksAndPipesSymbols2DLibrary
  visible={showTanksPipes2DLibrary}
  position={tp2DPos}
  size={symbolsSize}
  onClose={() => setShowTanksPipes2DLibrary(false)}
  onStartDragWindow={(e) => startDragSymbolWindow("tp2d", e)}
  onStartResizeWindow={(e) => startResizeSymbolWindow("tp2d", e)}
/>

<TanksAndPipesSymbols3DLibrary
  visible={showTanksPipes3DLibrary}
  position={tp3DPos}
  size={symbolsSize}
  onClose={() => setShowTanksPipes3DLibrary(false)}
  onStartDragWindow={(e) => startDragSymbolWindow("tp3d", e)}
  onStartResizeWindow={(e) => startResizeSymbolWindow("tp3d", e)}
/>


{/* ✅ END ADD */}

      </main>

      <RestoreWarningModal
        open={showRestoreWarning}
        lastSavedAt={lastSavedAt}
        onCancel={() => setShowRestoreWarning(false)}
        onConfirm={async () => {
          setShowRestoreWarning(false);
          await handleUploadProject();
        }}
      />

      <RightSidebar
        isRightCollapsed={isRightCollapsed}
  setIsRightCollapsed={setIsRightCollapsed}
  setShowImageLibrary={setShowImageLibrary}
  setShowCoreflexLibrary={setShowCoreflexLibrary}
  setShowHmiLibrary={setShowHmiLibrary}
  setShowHvac2DLibrary={setShowHvac2DLibrary}
  setShowHvac3DLibrary={setShowHvac3DLibrary}
  setShowManufacturing2DLibrary={setShowManufacturing2DLibrary}
  setShowManufacturing3DLibrary={setShowManufacturing3DLibrary}
  setShowTanksPipes2DLibrary={setShowTanksPipes2DLibrary}
  setShowTanksPipes3DLibrary={setShowTanksPipes3DLibrary}
  dashboardMode={dashboardMode}

  /** ✅ ADD THIS LINE **/
  openSymbolLibrary={openSymbolLibrary}
      />
    </div>
  );
}
