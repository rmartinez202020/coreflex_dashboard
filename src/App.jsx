import { API_URL } from "./config/api";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard";
import useDashboardHistory from "./hooks/useDashboardHistory";
import { useEffect, useState, useRef, useCallback } from "react";
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

  // ✅ INDICATOR (LED) SETTINGS MODAL
  const [indicatorSettingsId, setIndicatorSettingsId] = useState(null);
  const openIndicatorSettings = (tank) => setIndicatorSettingsId(tank.id);
  const closeIndicatorSettings = () => setIndicatorSettingsId(null);

  const indicatorTank =
    droppedTanks.find((t) => t.id === indicatorSettingsId) || null;

  // ✅ STATUS TEXT SETTINGS MODAL (NEW)
  const [statusTextSettingsId, setStatusTextSettingsId] = useState(null);
  const openStatusTextSettings = (tank) => setStatusTextSettingsId(tank.id);
  const closeStatusTextSettings = () => setStatusTextSettingsId(null);

  // ✅ BLINKING ALARM SETTINGS MODAL (NEW)
  const [blinkingAlarmSettingsId, setBlinkingAlarmSettingsId] = useState(null);
  const openBlinkingAlarmSettings = (tank) =>
    setBlinkingAlarmSettingsId(tank.id);
  const closeBlinkingAlarmSettings = () => setBlinkingAlarmSettingsId(null);

  // ✅ STATE IMAGE SETTINGS MODAL (NEW)
  const [stateImageSettingsId, setStateImageSettingsId] = useState(null);
  const openStateImageSettings = (tank) => setStateImageSettingsId(tank.id);
  const closeStateImageSettings = () => setStateImageSettingsId(null);

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

  // ✅ Option A: z-order uses tank.z (fallback to tank.zIndex)
  const getTankZ = (t) => {
    const v = Number(t?.z ?? t?.zIndex ?? 1);
    return Number.isFinite(v) && v > 0 ? v : 1;
  };

  const getLayerScore = (obj) => getTankZ(obj);

  // ✅ Normalize list so every object has a safe positive z and zIndex
  const normalizeZList = useCallback((list) => {
    let next = 1;

    return (list || []).map((t) => {
      const raw =
        t.z !== undefined && t.z !== null
          ? t.z
          : t.zIndex !== undefined && t.zIndex !== null
          ? t.zIndex
          : next++;

      const safe = Math.max(1, Number(raw) || 1);

      return {
        ...t,
        z: safe,
        zIndex: safe, // ✅ keep legacy field in sync
      };
    });
  }, []);

  // ✅ Bring to Front / Send to Back WITHOUT negatives and WITHOUT disappearing
  const bringToFront = useCallback(
    (id) => {
      if (!id) return;

      setDroppedTanks((prev) => {
        const items = normalizeZList(prev);
        const target = items.find((t) => t.id === id);
        if (!target) return items;

        const oldZ = getTankZ(target);
        const maxZ = Math.max(1, ...items.map((t) => getTankZ(t)));

        // already top
        if (oldZ === maxZ) return items;

        return items.map((t) => {
          const z = getTankZ(t);

          if (t.id === id) return { ...t, z: maxZ, zIndex: maxZ };

          // shift down anything above oldZ
          if (z > oldZ) return { ...t, z: z - 1, zIndex: z - 1 };

          return { ...t, z, zIndex: z };
        });
      });
    },
    [setDroppedTanks, normalizeZList]
  );

  const sendToBack = useCallback(
    (id) => {
      if (!id) return;

      setDroppedTanks((prev) => {
        const items = normalizeZList(prev);
        const target = items.find((t) => t.id === id);
        if (!target) return items;

        const oldZ = getTankZ(target);
        const minZ = 1;

        // already back
        if (oldZ === minZ) return items;

        return items.map((t) => {
          const z = getTankZ(t);

          if (t.id === id) return { ...t, z: minZ, zIndex: minZ };

          // shift up anything below oldZ
          if (z < oldZ) return { ...t, z: z + 1, zIndex: z + 1 };

          return { ...t, z, zIndex: z };
        });
      });
    },
    [setDroppedTanks, normalizeZList]
  );

  // ✅ Auto-normalize old projects once (adds z/zIndex if missing)
  useEffect(() => {
    if (!droppedTanks?.length) return;

    const needsFix = droppedTanks.some((t) => t.z == null || t.zIndex == null);
    if (!needsFix) return;

    setDroppedTanks((prev) => normalizeZList(prev));
  }, [droppedTanks, setDroppedTanks, normalizeZList]);

  // ✅ Delete selected items OR the right-click target
const deleteSelectionOrTarget = useCallback(() => {
  const idsToDelete =
    (selectedIds?.length || 0) > 0
      ? selectedIds
      : contextMenu?.targetId
      ? [contextMenu.targetId]
      : [];

  if (!idsToDelete.length) return;

  setDroppedTanks((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
  clearSelection();
}, [selectedIds, contextMenu, setDroppedTanks]);

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
          indicatorSettingsId={indicatorSettingsId}
          closeIndicatorSettings={closeIndicatorSettings}
          sensorsData={sensorsData} // ✅ IMPORTANT (for device/tag dropdown)
          statusTextSettingsId={statusTextSettingsId}
          closeStatusTextSettings={closeStatusTextSettings}
          blinkingAlarmSettingsId={blinkingAlarmSettingsId}
          closeBlinkingAlarmSettings={closeBlinkingAlarmSettings}
          stateImageSettingsId={stateImageSettingsId}
          closeStateImageSettings={closeStateImageSettings}
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

