import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { API_URL } from "./config/api";
import { getToken } from "./utils/authToken";
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard";
import AlarmLogPage from "./pages/AlarmLogPage";
import Header from "./components/Header";
import AppTopBar from "./components/AppTopBar";
import RightPanel from "./components/RightPanel";
import SidebarLeft from "./components/SidebarLeft";
import DashboardCanvas from "./components/DashboardCanvas";
import DashboardCanvasContextMenu from "./components/DashboardCanvasContextMenu";
import AppModals from "./components/AppModals";
import HomeSubPageRouter from "./components/HomeSubPageRouter";
import useAuthController from "./hooks/useAuthController";
import usePageNavigation from "./hooks/usePageNavigation";
import useDevicesData from "./hooks/useDevicesData";
import useDashboardHistory from "./hooks/useDashboardHistory";
import useDashboardPersistence from "./hooks/useDashboardPersistence";
import useDeleteSelected from "./hooks/useDeleteSelected";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useContextMenu from "./hooks/useContextMenu";
import useDashboardCanvasClipboard from "./hooks/useDashboardCanvasClipboard";
import useDashboardZOrder from "./hooks/useDashboardZOrder";
import useHomeReset from "./hooks/useHomeReset";
import useCanvasSelection from "./hooks/useCanvasSelection";
import useObjectDragging from "./hooks/useObjectDragging";
import useDropHandler from "./hooks/useDropHandler";
import useWindowDragResize from "./hooks/useWindowDragResize";
import useDashboardModalsController from "./hooks/useDashboardModalsController";

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
  const devicesData = useDevicesData(API_URL, { pollMs: 2000 }); // pick 1000/2000/3000
  const sensorsData = devicesData.rows; // keep old props alive
  const telemetryMap = devicesData.telemetryMap; // ✅ the common poller map

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

  // ✅ DASHBOARD PERSISTENCE (MUST be before anything that uses activeDashboard/effectiveDashboardId)
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
  // ✅ MUST be after activeDashboard/effectiveDashboardId exist (prevents TDZ prod crash)
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

    // ✅ IMPORTANT: use the same delete logic as right-click
    onDelete: deleteSelected,

    // ✅ recommended gating
    activePage,
    dashboardMode,
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

  // ✅ ACTIVE HORIZONTAL TANK (same pattern as silo)
  const [activeHorizontalTankId, setActiveHorizontalTankId] = useState(null);
  const [showHorizontalTankProps, setShowHorizontalTankProps] = useState(false);

  // ✅ ACTIVE STANDARD TANK (same pattern as silo + horizontal)
  const [activeStandardTankId, setActiveStandardTankId] = useState(null);
  const [showStandardTankProps, setShowStandardTankProps] = useState(false);

  // ✅ ACTIVE VERTICAL TANK (same pattern as silo + horizontal + standard)
  const [activeVerticalTankId, setActiveVerticalTankId] = useState(null);
  const [showVerticalTankProps, setShowVerticalTankProps] = useState(false);

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

  // ✅ Counter Input Settings
  const [counterInputSettingsId, setCounterInputSettingsId] = useState(null);

  const openCounterInputSettings = (tank) => {
    setCounterInputSettingsId(tank?.id ?? null);
  };

  const closeCounterInputSettings = () => {
    setCounterInputSettingsId(null);
  };

  // ✅ Push Button NO Settings
  const [pushButtonNOSettingsId, setPushButtonNOSettingsId] = useState(null);

  const openPushButtonNOSettings = (tank) => {
    setPushButtonNOSettingsId(tank?.id ?? null);
  };

  const closePushButtonNOSettings = () => {
    setPushButtonNOSettingsId(null);
  };

  // ✅ Push Button NC Settings
  const [pushButtonNCSettingsId, setPushButtonNCSettingsId] = useState(null);

  const openPushButtonNCSettings = (tank) => {
    setPushButtonNCSettingsId(tank?.id ?? null);
  };

  const closePushButtonNCSettings = () => {
    setPushButtonNCSettingsId(null);
  };

  // 🚨 ALARMS LOG MODAL (AI)
  const [alarmLogOpen, setAlarmLogOpen] = useState(false);

  // ✅ minimized state for alarm log (shows in AppTopBar header tray)
  const [alarmLogMinimized, setAlarmLogMinimized] = useState(false);

  // ✅ keep last backend row for debugging/future sync
  const [alarmLogWindowRow, setAlarmLogWindowRow] = useState(null);

  function getAuthHeaders() {
    const token = String(getToken() || "").trim();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  const openAlarmLog = async () => {
    try {
      const res = await fetch(`${API_URL}/alarm-log-windows/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          dashboard_id: String(effectiveDashboardId || "main").trim() || "main",
          window_key: "alarmLog",
          title: "Alarms Log (DI-AI)",
          pos_x: 140,
          pos_y: 90,
          width: 900,
          height: 420,
          is_open: true,
          is_minimized: false,
          is_launched: false,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.detail || data?.error || "Failed to create/open alarm log window"
        );
      }

      setAlarmLogWindowRow(data);
      setAlarmLogMinimized(false);
      setAlarmLogOpen(true);
    } catch (err) {
      console.error("Alarm log open failed:", err);
      alert("Could not open Alarms Log window.");
    }
  };

  const closeAlarmLog = () => {
    setAlarmLogMinimized(false);
    setAlarmLogOpen(false);
  };

  // ✅ MINIMIZE: hide modal + show minimized tab in AppTopBar
  const minimizeAlarmLog = () => {
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
    setShowHorizontalTankProps,
    setActiveHorizontalTankId,
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
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
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
            dashboardName={String(activeDashboard?.dashboardName || "").trim()}
            dashboardMode={dashboardMode}
            sensors={sensors}
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
            onOpenPushButtonNOSettings={openPushButtonNOSettings}
            onOpenPushButtonNCSettings={openPushButtonNCSettings}
            activeDashboardId={activeDashboard?.dashboardId || null}
            activeHorizontalTankId={activeHorizontalTankId}
            setActiveHorizontalTankId={setActiveHorizontalTankId}
            setShowHorizontalTankProps={setShowHorizontalTankProps}
            activeStandardTankId={activeStandardTankId}
            setActiveStandardTankId={setActiveStandardTankId}
            setShowStandardTankProps={setShowStandardTankProps}
            activeVerticalTankId={activeVerticalTankId}
            setActiveVerticalTankId={setActiveVerticalTankId}
            setShowVerticalTankProps={setShowVerticalTankProps}
            onSaveProject={handleSaveProject}
            telemetryMap={telemetryMap}
            sensorsData={sensorsData}
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
          dashboardId={effectiveDashboardId}
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
          statusTextSettingsId={statusTextSettingsId}
          closeStatusTextSettings={closeStatusTextSettings}
          blinkingAlarmSettingsId={blinkingAlarmSettingsId}
          closeBlinkingAlarmSettings={closeBlinkingAlarmSettings}
          stateImageSettingsId={stateImageSettingsId}
          closeStateImageSettings={closeStateImageSettings}
          counterInputSettingsId={counterInputSettingsId}
          closeCounterInputSettings={closeCounterInputSettings}
          pushButtonNOSettingsId={pushButtonNOSettingsId}
          closePushButtonNOSettings={closePushButtonNOSettings}
          pushButtonNCSettingsId={pushButtonNCSettingsId}
          closePushButtonNCSettings={closePushButtonNCSettings}
          showHorizontalTankProps={showHorizontalTankProps}
          setShowHorizontalTankProps={setShowHorizontalTankProps}
          activeHorizontalTankId={activeHorizontalTankId}
          setActiveHorizontalTankId={setActiveHorizontalTankId}
          showStandardTankProps={showStandardTankProps}
          setShowStandardTankProps={setShowStandardTankProps}
          activeStandardTankId={activeStandardTankId}
          setActiveStandardTankId={setActiveStandardTankId}
          showVerticalTankProps={showVerticalTankProps}
          setShowVerticalTankProps={setShowVerticalTankProps}
          activeVerticalTankId={activeVerticalTankId}
          setActiveVerticalTankId={setActiveVerticalTankId}
          onSaveProject={handleSaveProject}
          telemetryMap={telemetryMap}
          sensorsData={sensorsData}
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