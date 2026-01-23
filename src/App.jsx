import { API_URL } from "./config/api";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard";
import DashboardAdminPage from "./components/DashboardAdminPage";
import useDashboardHistory from "./hooks/useDashboardHistory";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import DashboardHeader from "./components/DashboardHeader";
import { saveMainDashboard } from "./services/saveMainDashboard";
import RestoreWarningModal from "./components/RestoreWarningModal";
import GraphicDisplaySettingsModal from "./components/GraphicDisplaySettingsModal";
import CustomersLocationsPage from "./components/CustomersLocationsPage";
import useWindowDragResize from "./hooks/useWindowDragResize";

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
import useCanvasSelection from "./hooks/useCanvasSelection";
import useObjectDragging from "./hooks/useObjectDragging";
import useDropHandler from "./hooks/useDropHandler";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
const isLaunchPage = location.pathname === "/launchMainDashboard";

  // ✅ identify which user is currently logged in (from JWT)
  const [currentUserKey, setCurrentUserKey] = useState(() =>
    getUserKeyFromToken()
  );

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

  // DEVICE DATA
  const [sensorsData, setSensorsData] = useState([]);

  // OBJECTS ON CANVAS
  const [droppedTanks, setDroppedTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const clearSelection = () => {
  setSelectedIds([]);
  setSelectedTank(null);
};


  // ⭐ DASHBOARD MODE — DEFAULT EDIT
  const [dashboardMode, setDashboardMode] = useState("edit");

  // ✅ always keep the latest canvas in a ref (prevents stale Ctrl+Z / Ctrl+Y)
const droppedRef = useRef([]);

useEffect(() => {
  droppedRef.current = droppedTanks;
}, [droppedTanks]);

// ✅ DASHBOARD HISTORY (Undo / Redo / Drag history)
const {
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  hardResetHistory,
  onDragMoveBegin,
  onDragEndCommit,
  beginRestore,
  endRestore,
} = useDashboardHistory({
  limit: 6,
  activePage,
  dashboardMode,
  droppedTanks,
  droppedRef,
  setDroppedTanks,
  clearSelection,
});

  // SIDEBARS
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // ⚠️ RESTORE WARNING MODAL
  const [showRestoreWarning, setShowRestoreWarning] = useState(false);

  // MENUS
  const [showDevices, setShowDevices] = useState(false);
  const [showLevelSensors, setShowLevelSensors] = useState(false);

  // 🪟 WINDOW MANAGER (floating libraries)
const wm = useWindowDragResize({
  image: {
    position: { x: 140, y: 120 },
    size: { width: 720, height: 520 },
    minSize: { width: 520, height: 360 },
  },
  coreflex: {
    position: { x: 200, y: 160 },
    size: { width: 720, height: 520 },
    minSize: { width: 520, height: 360 },
  },

  // ✅ SYMBOL LIBRARIES
  hmi: {
    position: { x: 220, y: 140 },
    size: { width: 760, height: 540 },
    minSize: { width: 520, height: 360 },
    defaultCenter: true,
  },
  hvac2d: {
    position: { x: 220, y: 140 },
    size: { width: 760, height: 540 },
    minSize: { width: 520, height: 360 },
    defaultCenter: true,
  },
  hvac3d: {
    position: { x: 220, y: 140 },
    size: { width: 760, height: 540 },
    minSize: { width: 520, height: 360 },
    defaultCenter: true,
  },
  mfg2d: {
    position: { x: 220, y: 140 },
    size: { width: 760, height: 540 },
    minSize: { width: 520, height: 360 },
    defaultCenter: true,
  },
  mfg3d: {
    position: { x: 220, y: 140 },
    size: { width: 760, height: 540 },
    minSize: { width: 520, height: 360 },
    defaultCenter: true,
  },
  tp2d: {
    position: { x: 220, y: 140 },
    size: { width: 760, height: 540 },
    minSize: { width: 520, height: 360 },
    defaultCenter: true,
  },
  tp3d: {
    position: { x: 220, y: 140 },
    size: { width: 760, height: 540 },
    minSize: { width: 520, height: 360 },
    defaultCenter: true,
  },
});


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

  // ✅ DELETE SELECTED OBJECTS (Delete / Backspace)
const deleteSelected = () => {
  if (activePage !== "dashboard") return;
  if (dashboardMode !== "edit") return;
  if (!selectedIds || selectedIds.length === 0) return;

  setDroppedTanks((prev) => prev.filter((obj) => !selectedIds.includes(obj.id)));

  setSelectedIds([]);
  setSelectedTank(null);
};

useEffect(() => {
  const onKeyDown = (e) => {
    if (activePage !== "dashboard") return;
    if (dashboardMode !== "edit") return;

    // ⛔ Don't delete while typing
    const el = document.activeElement;
    const tag = (el?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteSelected();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [activePage, dashboardMode, selectedIds]);


  // ✅ ACTIVE DASHBOARD CONTEXT (Main vs Customer Dashboard)
const [activeDashboard, setActiveDashboard] = useState({
  type: "main",            // "main" | "customer"
  dashboardId: null,       // string | null
  dashboardName: "Main Dashboard",
  customerId: null,        // number | null
  customerName: "",
});

  // ⭐ LAST SAVED TIMESTAMP
  const [lastSavedAt, setLastSavedAt] = useState(null);

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
// ==========================================
// ✅ Dashboard API endpoint resolver
// ==========================================
const getDashboardEndpoint = (ctx) => {
  // main dashboard
  if (!ctx || ctx.type === "main") return `${API_URL}/dashboard/main`;

  // customer dashboard (must have an id)
  if (ctx.type === "customer" && ctx.dashboardId) {
    return `${API_URL}/customers-dashboards/${ctx.dashboardId}`;
  }

  // fallback
  return `${API_URL}/dashboard/main`;
};

// ==========================================
// ✅ HARD HOME RESET (ALWAYS GO TO HOME)
// ==========================================
const goHomeHard = () => {
  // go to the main app route (recommended)
  navigate("/app");

  // navigation state
  setActivePage("home");
  setActiveSubPage(null);
  setSubPageColor("");

  // close modals
  setShowRestoreWarning(false);
  setShowSiloProps(false);
  closeDisplaySettings();
  closeGraphicDisplaySettings();

  // close menus
  setShowDevices(false);
  setShowLevelSensors(false);

  // reset context menu + selections
  setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
  setSelectedIds([]);
  setSelectedTank(null);
  setActiveSiloId(null);

  // optional: return to main dashboard context
  setActiveDashboard({
    type: "main",
    dashboardId: null,
    dashboardName: "Main Dashboard",
    customerId: null,
    customerName: "",
  });
};

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

        const res = await fetch(getDashboardEndpoint(activeDashboard), {
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
  }, [currentUserKey, activeDashboard]);


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

  // ✅ GO BACK TO MAIN DASHBOARD (from customer dashboards)
const goToMainDashboard = () => {
  // switch to dashboard page
  setActivePage("dashboard");

  // reset dashboard context to MAIN
  setActiveDashboard({
    type: "main",
    dashboardId: null,
    dashboardName: "Main Dashboard",
    customerId: null,
    customerName: "",
  });

  // ensure edit mode
  setDashboardMode("edit");

  // clear canvas so main dashboard auto-restores
  setDroppedTanks([]);
  setSelectedIds([]);
  setSelectedTank(null);

  // allow auto-restore to run again
  autoRestoreRanRef.current = false;
};


  // 💾 SAVE PROJECT (MAIN or CUSTOMER)
const handleSaveProject = async () => {
  // ✅ only allow saving from dashboard editor
  if (activePage !== "dashboard") {
    console.warn("⚠️ Save ignored: not on dashboard editor page");
    return;
  }

  // ✅ customer dashboard must have an id
  if (activeDashboard.type === "customer" && !activeDashboard.dashboardId) {
    console.error("❌ Cannot save customer dashboard: missing dashboardId");
    return;
  }

  const dashboardPayload = {
    version: "1.0",
    type:
      activeDashboard.type === "main" ? "main_dashboard" : "customer_dashboard",
    dashboardId: activeDashboard.dashboardId || null,
    canvas: { objects: droppedTanks || [] },
    meta: {
      dashboardMode,
      savedAt: new Date().toISOString(),
      dashboardName: activeDashboard.dashboardName || "",
      customerName: activeDashboard.customerName || "",
    },
  };

  try {
    const token = getToken();
    if (!token) throw new Error("No auth token found");

    await saveMainDashboard(dashboardPayload, activeDashboard);

    const now = new Date();
    setLastSavedAt(now);
    // ✅ make SAVE the new undo baseline
hardResetHistory(droppedRef.current || []);
    console.log("✅ Dashboard saved:", activeDashboard);
  } catch (err) {
    console.error("❌ Save failed:", err);
  }
};

 // ⬆ RESTORE PROJECT (manual button)
const handleUploadProject = async () => {
  let restoredObjects = [];

  try {
    const token = getToken();
    if (!token) throw new Error("No auth token found");
// ✅ tell history system we are restoring from DB
    beginRestore();
    const res = await fetch(getDashboardEndpoint(activeDashboard), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load dashboard from DB");

    const data = await res.json();

    const layout = data?.layout ?? data;

restoredObjects =
  layout?.canvas?.objects ||
  layout?.layout?.canvas?.objects ||
  layout?.layout?.objects ||
  layout?.objects ||
  [];

    // ✅ apply restored canvas
    setDroppedTanks(restoredObjects);
    setSelectedIds([]);
    setSelectedTank(null);

    // ✅ make RESTORE the new undo baseline
hardResetHistory(restoredObjects);

    const mode = data?.layout?.meta?.dashboardMode || data?.meta?.dashboardMode;
    if (mode) setDashboardMode(mode);

    const savedAt = data?.layout?.meta?.savedAt || data?.meta?.savedAt;
    setLastSavedAt(savedAt ? new Date(savedAt) : null);

    console.log("✅ Main dashboard restored from DB");
  } catch (err) {
    console.error("❌ Upload failed:", err);
  } finally {
   endRestore();
  }
};

// 🔁 RESET AUTO-RESTORE WHEN DASHBOARD CONTEXT CHANGES

const autoRestoreRanRef = useRef(false);
useEffect(() => {
  autoRestoreRanRef.current = false;
}, [activeDashboard]);


  // ==========================================
  // ✅ AUTO-RESTORE FROM DB ON REFRESH (FIX)
  // ==========================================
  

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
       const res = await fetch(getDashboardEndpoint(activeDashboard), {
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
  }, [activePage, currentUserKey, activeDashboard, droppedTanks.length]);

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
const {
  dragDelta,
  setDragDelta,
  handleDragMove: rawHandleDragMove,
  handleDragEnd: rawHandleDragEnd,
  guides,
} = useObjectDragging({
  selectedIds,
  droppedTanks,
  setDroppedTanks,
});

// ✅ DASHBOARD HISTORY DRAG WRAPPERS
const handleDragMove = (...args) => {
  onDragMoveBegin();
  rawHandleDragMove(...args);
};

const handleDragEnd = (...args) => {
  rawHandleDragEnd(...args);
  onDragEndCommit();
};


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

// ✅ LAUNCH PAGE — RENDER ONLY PLAY MODE DASHBOARD
if (isLaunchPage) {
  return <LaunchedMainDashboard />;
}

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
        onGoMainDashboard={goToMainDashboard}
        onGoHome={goHomeHard}

      />

      <main className="flex-1 p-6 bg-white overflow-visible relative">
        <Header onLogout={handleLogout} />
{activePage === "dashboard" ? (
  <DashboardHeader
    title={
      activeDashboard.type === "main"
        ? "Main Dashboard"
        : `${activeDashboard.customerName} — ${activeDashboard.dashboardName}`
    }
    dashboardMode={dashboardMode}
    setDashboardMode={setDashboardMode}
    onLaunch={() => {
      if (activeDashboard.type === "main") {
        window.open("/launchMainDashboard", "_blank");
      } else {
        window.open(`/launchDashboard/${activeDashboard.dashboardId}`, "_blank");
      }
    }}
    onUndo={handleUndo}
    onRedo={handleRedo}
    canUndo={canUndo}
    canRedo={canRedo}
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
) : activeSubPage === "dashboardAdmin" ? (
  <DashboardAdminPage
  onGoHome={() => {
  setActiveSubPage(null);   // ✅ go back to normal HomePage cards
  setSubPageColor("");      // ✅ optional (cleans color state)
}}

    onOpenDashboard={(row) => {
      // ✅ switch to dashboard editor page
      setActivePage("dashboard");

      // ✅ set context so header shows customer dashboard title
      setActiveDashboard({
        type: "customer",
        dashboardId: String(row.id),
        dashboardName: row.dashboard_name || "Customer Dashboard",
        customerId: null,
        customerName: row.customer_name || "",
      });

      // ✅ go to edit mode (important)
      setDashboardMode("edit");

      // ✅ clear canvas so auto-restore can load the correct one
      setDroppedTanks([]);
      setSelectedIds([]);
      setSelectedTank(null);

      // ✅ allow auto-restore to run again for this dashboard
      autoRestoreRanRef.current = false;
    }}
    onLaunchDashboard={(row) => {
      window.open(`/launchDashboard/${row.id}`, "_blank");
    }}
  />
) : (

  <HomePage
    setActiveSubPage={setActiveSubPage}
    setSubPageColor={setSubPageColor}
    currentUserKey={currentUserKey}
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
  {...wm.getWindowProps("image", {
    onDragStartImage: (e, img) =>
      e.dataTransfer.setData("imageUrl", img.src),
  })}
/>

<CoreFlexLibrary
  {...wm.getWindowProps("coreflex")}
/>
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
  dashboardMode={dashboardMode}
  onOpenLibrary={(key) => wm.openWindow(key)}
/>

    </div>
  );
}
