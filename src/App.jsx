import { API_URL } from "./config/api";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard";
import DashboardAdminPage from "./components/DashboardAdminPage";
import useDashboardHistory from "./hooks/useDashboardHistory";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import DashboardHeader from "./components/DashboardHeader";
import RestoreWarningModal from "./components/RestoreWarningModal";
import GraphicDisplaySettingsModal from "./components/GraphicDisplaySettingsModal";
import CustomersLocationsPage from "./components/CustomersLocationsPage";
import RightPanel from "./components/RightPanel";
import useDashboardPersistence from "./hooks/useDashboardPersistence";
import useAuthController from "./hooks/useAuthController";
import useHomeReset from "./hooks/useHomeReset";
import useDevicesData from "./hooks/useDevicesData";
import HomePage from "./components/HomePage";
import ProfilePage from "./components/ProfilePage";
import SidebarLeft from "./components/SidebarLeft";
import DashboardCanvas from "./components/DashboardCanvas";
import SiloPropertiesModal from "./components/SiloPropertiesModal";
import DisplaySettingsModal from "./components/DisplaySettingsModal";
import useCanvasSelection from "./hooks/useCanvasSelection";
import useObjectDragging from "./hooks/useObjectDragging";
import useDropHandler from "./hooks/useDropHandler";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
const isLaunchPage = location.pathname === "/launchMainDashboard";

    // ===============================
  // ✅ NAVIGATION (persist on refresh)
  // ===============================
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("coreflex_activePage") || "home";
  });
  const [activeSubPage, setActiveSubPage] = useState(null);
  const [subPageColor, setSubPageColor] = useState("");

  // DEVICE DATA
const sensorsData = useDevicesData(API_URL);

  // Persist activePage changes
  useEffect(() => {
    localStorage.setItem("coreflex_activePage", activePage);
  }, [activePage]);

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

  const resetToGuestState = () => {
  setDroppedTanks([]);
  setSelectedTank(null);
  setSelectedIds([]);
  setDashboardMode("edit");
  setActivePage("home");

  // optional: if you want subpage cleared too:
  setActiveSubPage(null);
  setSubPageColor("");
};

const resetForUserChange = (newUserKey, oldUserKey) => {
  console.log("🔄 User changed → resetting dashboard state", oldUserKey, "→", newUserKey);

  setDroppedTanks([]);
  setSelectedTank(null);
  setSelectedIds([]);
  setDashboardMode("edit");
  setActivePage("home");

  // optional: clear subpage too
  setActiveSubPage(null);
  setSubPageColor("");
};

const { currentUserKey, handleLogout } = useAuthController({
  onNoAuthReset: resetToGuestState,
  onUserChangedReset: resetForUserChange,
  onLogoutReset: resetToGuestState,
  navigate,
  logoutRoute: "/",
});

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

const {
  activeDashboard,
  setActiveDashboard,
  lastSavedAt,
  goToMainDashboard,
  handleSaveProject,
  handleUploadProject,
} = useDashboardPersistence({
  currentUserKey,
  activePage,
  setActivePage,
  dashboardMode,
  setDashboardMode,
  droppedTanks,
  setDroppedTanks,
  droppedRef,
  setSelectedIds,
  setSelectedTank,
  hardResetHistory,
  beginRestore,
  endRestore,
});

// ✅ Reset dashboard context when user logs out / token disappears
useEffect(() => {
  if (!currentUserKey) {
    setActiveDashboard({
      type: "main",
      dashboardId: null,
      dashboardName: "Main Dashboard",
      customerId: null,
      customerName: "",
    });
  }
}, [currentUserKey, setActiveDashboard]);

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

  // ✅ DELETE SELECTED OBJECTS (Delete / Backspace)
const deleteSelected = useCallback(() => {
  if (activePage !== "dashboard") return;
  if (dashboardMode !== "edit") return;
  if (!selectedIds || selectedIds.length === 0) return;

  setDroppedTanks((prev) =>
    prev.filter((obj) => !selectedIds.includes(obj.id))
  );

  clearSelection();
}, [activePage, dashboardMode, selectedIds, setDroppedTanks, clearSelection]);

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
  }, [activePage, dashboardMode, deleteSelected]);

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
const { goHomeHard } = useHomeReset({
  navigate,
  setActivePage,
  setActiveSubPage,
  setSubPageColor,
  setShowRestoreWarning,
  setShowSiloProps,
  closeDisplaySettings,
  closeGraphicDisplaySettings,
  setShowDevices,
  setShowLevelSensors,
  setContextMenu,
  setSelectedIds,
  setSelectedTank,
  setActiveSiloId,
  setActiveDashboard,
});

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

  const hideContextMenu = () =>
    setContextMenu((prev) => ({ ...prev, visible: false }));

  const handleRightClick = (id, x, y) => {
    setContextMenu({ visible: true, x, y, targetId: id });
  };

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
<RightPanel
  isRightCollapsed={isRightCollapsed}
  setIsRightCollapsed={setIsRightCollapsed}
  dashboardMode={dashboardMode}
/>
    </div>
  );
}
