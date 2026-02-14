import { API_URL } from "./config/api";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard";
import useDashboardHistory from "./hooks/useDashboardHistory";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
import DashboardCanvasContextMenu from "./components/DashboardCanvasContextMenu";
import useDashboardCanvasClipboard from "./hooks/useDashboardCanvasClipboard";
import useDashboardZOrder from "./hooks/useDashboardZOrder";
import useDashboardModalsController from "./hooks/useDashboardModalsController";
import AlarmLogPage from "./pages/AlarmLogPage";
import useDeleteSelected from "./hooks/useDeleteSelected";

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

  // ⌨️ KEYBOARD SHORTCUTS (arrows + copy/paste + ✅ undo/redo)
  useKeyboardShortcuts({
    selectedIds,
    setSelectedIds,
    selectedTank,
    setSelectedTank,
    droppedTanks,
    setDroppedTanks,

    // ✅ add these
    onUndo: handleUndo,
    onRedo: handleRedo,
    canUndo,
    canRedo,

    // ✅ recommended gating
    activePage,
    dashboardMode,
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

  // ✅ IMPORTANT: stable dashboard id for counters
  // - customer dashboards use activeDashboard.dashboardId
  // - main dashboard MUST NOT be null → use "main"
  const effectiveDashboardId = useMemo(() => {
    if (activeDashboard?.type === "main") return "main";
    const id = String(activeDashboard?.dashboardId || "").trim();
    return id || null;
  }, [activeDashboard]);

  // ===============================
// ✅ Delete hook (UI + backend for counters)
// ===============================
const { deleteSelected } = useDeleteSelected({
  activePage,
  dashboardMode,
  selectedIds,
  droppedTanks,
  setDroppedTanks,
  clearSelection,
  activeDashboardId: activeDashboard?.dashboardId || null,
  dashboardId: effectiveDashboardId, // "main" or UUID
});

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

  // ✅ MODALS (extracted)
  const {
    displaySettingsId,
    indicatorSettingsId,
    statusTextSettingsId,
    blinkingAlarmSettingsId,
    stateImageSettingsId,
    graphicSettingsId,

    openDisplaySettings,
    openIndicatorSettings,
    openStatusTextSettings,
    openBlinkingAlarmSettings,
    openStateImageSettings,
    openGraphicDisplaySettings,

    closeDisplaySettings,
    closeIndicatorSettings,
    closeStatusTextSettings,
    closeBlinkingAlarmSettings,
    closeStateImageSettings,
    closeGraphicDisplaySettings,
  } = useDashboardModalsController({ droppedTanks });

  // ✅ Counter Input Settings (NEW)
  const [counterInputSettingsId, setCounterInputSettingsId] = useState(null);

  const openCounterInputSettings = (tank) => {
    setCounterInputSettingsId(tank?.id ?? null);
  };

  const closeCounterInputSettings = () => {
    setCounterInputSettingsId(null);
  };

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

  // ✅ Z-ORDER (extracted)
  const { getTankZ, getLayerScore, bringToFront, sendToBack } =
    useDashboardZOrder({
      droppedTanks,
      setDroppedTanks,
    });

  // ✅ Delete selected items OR right-click target
// (uses hook so counter rows are also deleted in backend)
const deleteSelectionOrTarget = useCallback(() => {
  const idsToDelete =
    (selectedIds?.length || 0) > 0
      ? selectedIds
      : contextMenu?.targetId
      ? [contextMenu.targetId]
      : [];

  if (!idsToDelete.length) return;

  // If deleting from right-click and nothing is selected yet
  if ((selectedIds?.length || 0) === 0 && contextMenu?.targetId) {
    setSelectedIds([contextMenu.targetId]);
    setSelectedTank(contextMenu.targetId);
  } else {
    setSelectedIds(idsToDelete);
    setSelectedTank(idsToDelete[0] || null);
  }

  // ✅ This calls your hook (which deletes backend rows for counterInput)
  void deleteSelected();
}, [
  selectedIds,
  contextMenu,
  setSelectedIds,
  setSelectedTank,
  deleteSelected,
]);


  const { copyFromContext, pasteAtContext, hasClipboard } =
    useDashboardCanvasClipboard({
      droppedTanks,
      selectedIds,
      contextMenu,
      setDroppedTanks,
      getTankZ,
      canvasRootId: "coreflex-canvas-root",
    });

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

  // ✅ give the hook dashboard context for the create-placeholder call
  activeDashboardId: activeDashboard?.dashboardId || null,
  dashboardId: effectiveDashboardId, // "main" or UUID
  selectedTank,
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

  // ✅ ALARM LOG LAUNCH PAGE — render full-page Alarm Log
  const isLaunchAlarmLog = location.pathname === "/launchAlarmLog";
  if (isLaunchAlarmLog) {
    return <AlarmLogPage />;
  }

  // ✅ show our context menu only in EDIT + only on dashboard page
  const showCtx =
    contextMenu?.visible &&
    activePage === "dashboard" &&
    dashboardMode !== "play";

  const hasTarget = !!contextMenu?.targetId;

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

      <main className="flex-1 pt-6 pr-0 pb-6 pl-2 bg-white overflow-visible relative">
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

        <DashboardCanvasContextMenu
          show={showCtx}
          x={contextMenu?.x ?? 0}
          y={contextMenu?.y ?? 0}
          hasTarget={hasTarget}
          hasClipboard={hasClipboard}
          onCopy={copyFromContext}
          onBringToFront={() => bringToFront(contextMenu?.targetId)}
          onSendToBack={() => sendToBack(contextMenu?.targetId)}
          onDelete={deleteSelectionOrTarget}
          onPaste={pasteAtContext}
          onClose={hideContextMenu}
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
            dashboardId={effectiveDashboardId} // ✅ THE KEY FIX
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
            onOpenIndicatorSettings={openIndicatorSettings}
            onOpenStatusTextSettings={openStatusTextSettings}
            onOpenBlinkingAlarmSettings={openBlinkingAlarmSettings}
            onOpenStateImageSettings={openStateImageSettings}
            onOpenCounterInputSettings={openCounterInputSettings}
            activeDashboardId={activeDashboard?.dashboardId || null}
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
          dashboardId={effectiveDashboardId} // ✅ pass into modals (upsert/reset must match)
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
          indicatorSettingsId={indicatorSettingsId}
          closeIndicatorSettings={closeIndicatorSettings}
          sensorsData={sensorsData} // ✅ IMPORTANT (for device/tag dropdown)
          statusTextSettingsId={statusTextSettingsId}
          closeStatusTextSettings={closeStatusTextSettings}
          blinkingAlarmSettingsId={blinkingAlarmSettingsId}
          closeBlinkingAlarmSettings={closeBlinkingAlarmSettings}
          stateImageSettingsId={stateImageSettingsId}
          closeStateImageSettings={closeStateImageSettings}
          counterInputSettingsId={counterInputSettingsId}
          closeCounterInputSettings={closeCounterInputSettings}
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
