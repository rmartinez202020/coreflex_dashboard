import { API_URL } from "./config/api";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard";
import useDashboardHistory from "./hooks/useDashboardHistory";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import AppTopBar from "./components/AppTopBar";
import RightPanel from "./components/RightPanel";
import useDashboardPersistence from "./hooks/useDashboardPersistence";
import useAuthController from "./hooks/useAuthController";
import useHomeReset from "./hooks/useHomeReset";
import useDevicesData from "./hooks/useDevicesData";
import SidebarLeft from "./components/SidebarLeft";
import DashboardCanvas from "./components/DashboardCanvas";
import useCanvasSelection from "./hooks/useCanvasSelection";
import useObjectDragging from "./hooks/useObjectDragging";
import useDropHandler from "./hooks/useDropHandler";
import usePageNavigation from "./hooks/usePageNavigation";
import AppModals from "./components/AppModals";
import HomeSubPageRouter from "./components/HomeSubPageRouter";
import useContextMenu from "./hooks/useContextMenu";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useWindowDragResize from "./hooks/useWindowDragResize";


export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLaunchPage = location.pathname === "/launchMainDashboard";

  // ✅ NAVIGATION (persist on refresh)
  const {
    activePage,
    setActivePage,
    activeSubPage,
    setActiveSubPage,
    subPageColor,
    setSubPageColor,
  } = usePageNavigation("coreflex_activePage");

  // DEVICE DATA
  const sensorsData = useDevicesData(API_URL);

  // OBJECTS ON CANVAS
  const [droppedTanks, setDroppedTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectedTank(null);
  };

    // 🪟 FLOATING WINDOWS (Alarm Log, Libraries, etc.)
  const windowDrag = useWindowDragResize({
    alarmLog: {
      position: { x: 140, y: 90 },
      size: { width: 900, height: 420 },
    },
  });


  // ⭐ DASHBOARD MODE — DEFAULT EDIT
  const [dashboardMode, setDashboardMode] = useState("edit");

// ⌨️ KEYBOARD SHORTCUTS (arrows + copy/paste)
useKeyboardShortcuts({
  selectedIds,
  setSelectedIds,
  selectedTank,
  setSelectedTank,
  droppedTanks,
  setDroppedTanks,
});


  const resetToGuestState = () => {
    setDroppedTanks([]);
    setSelectedTank(null);
    setSelectedIds([]);
    setDashboardMode("edit");
    setActivePage("home");
    setActiveSubPage(null);
    setSubPageColor("");
  };

  const resetForUserChange = (newUserKey, oldUserKey) => {
    console.log(
      "🔄 User changed → resetting dashboard state",
      oldUserKey,
      "→",
      newUserKey
    );

    setDroppedTanks([]);
    setSelectedTank(null);
    setSelectedIds([]);
    setDashboardMode("edit");
    setActivePage("home");
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

  // ✅ CONTEXT MENU (extracted)
  const { contextMenu, setContextMenu, hideContextMenu, handleRightClick } =
    useContextMenu();

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

  // 🚨 ALARMS LOG MODAL (AI)
  const [alarmLogOpen, setAlarmLogOpen] = useState(false);

  // ✅ minimized state for alarm log (shows in AppTopBar header tray)
  const [alarmLogMinimized, setAlarmLogMinimized] = useState(false);

  const openAlarmLog = () => {
    if (alarmLogOpen) return; // ✅ prevents double-open
    setAlarmLogMinimized(false);
    setAlarmLogOpen(true);
  };

  const closeAlarmLog = () => {
    setAlarmLogMinimized(false);
    setAlarmLogOpen(false);
  };

  // ✅ MINIMIZE: hide modal + show minimized tab in AppTopBar
  const minimizeAlarmLog = () => {
    // keep this log only while testing
    console.log("✅ MINIMIZE FIRED");
    setAlarmLogOpen(false);
    setAlarmLogMinimized(true);
  };

  // ✅ RESTORE: show modal again + remove minimized tab
  const restoreAlarmLog = () => {
    setAlarmLogMinimized(false);
    setAlarmLogOpen(true);
  };

  // Launch = separate window (always tracking alarms)
  const launchAlarmLog = () => window.open("/launchAlarmLog", "_blank");

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

  // ✅ DROP HANDLER
  
 const { handleDrop } = useDropHandler({
  setDroppedTanks,
});


  const handleSelect = (id) => {
    setSelectedTank(id);
    setSelectedIds([id]);
    hideContextMenu();
  };

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

        <AppTopBar
          activePage={activePage}
          activeDashboard={activeDashboard}
          dashboardMode={dashboardMode}
          setDashboardMode={setDashboardMode}
          onLaunch={() => {
            if (activeDashboard?.type === "main") {
              window.open("/launchMainDashboard", "_blank");
            } else {
              window.open(
                `/launchDashboard/${activeDashboard?.dashboardId}`,
                "_blank"
              );
            }
          }}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          minimizedWindows={
            alarmLogMinimized
              ? [{ key: "alarmLog", title: "Alarms Log (DI-AI)" }]
              : []
          }
          onRestoreWindow={(key) => {
            if (key === "alarmLog") restoreAlarmLog();
          }}
          onCloseWindow={(key) => {
            if (key === "alarmLog") closeAlarmLog();
          }}
        />

        {activePage === "home" ? (
          <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <div className="w-full h-full p-6">
              <HomeSubPageRouter
                activeSubPage={activeSubPage}
                subPageColor={subPageColor}
                setActiveSubPage={setActiveSubPage}
                setSubPageColor={setSubPageColor}
                currentUserKey={currentUserKey}
                setActivePage={setActivePage}
                setActiveDashboard={setActiveDashboard}
                setDashboardMode={setDashboardMode}
                setDroppedTanks={setDroppedTanks}
                setSelectedIds={setSelectedIds}
                setSelectedTank={setSelectedTank}
              />
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
            onOpenAlarmLog={openAlarmLog}
            onLaunchAlarmLog={launchAlarmLog}
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

        <AppModals
          droppedTanks={droppedTanks}
          setDroppedTanks={setDroppedTanks}
          showRestoreWarning={showRestoreWarning}
          setShowRestoreWarning={setShowRestoreWarning}
          lastSavedAt={lastSavedAt}
          handleUploadProject={handleUploadProject}
          displaySettingsId={displaySettingsId}
          closeDisplaySettings={closeDisplaySettings}
          graphicSettingsId={graphicSettingsId}
          closeGraphicDisplaySettings={closeGraphicDisplaySettings}
          showSiloProps={showSiloProps}
          setShowSiloProps={setShowSiloProps}
          activeSiloId={activeSiloId}
          alarmLogOpen={alarmLogOpen}
          closeAlarmLog={closeAlarmLog}
          onMinimizeAlarmLog={minimizeAlarmLog}
          onLaunchAlarmLog={launchAlarmLog}
          windowDrag={windowDrag}  
        />
      </main>

      <RightPanel
        isRightCollapsed={isRightCollapsed}
        setIsRightCollapsed={setIsRightCollapsed}
        dashboardMode={dashboardMode}
        onOpenAlarmLog={openAlarmLog} 
      />
    </div>
  );
}
