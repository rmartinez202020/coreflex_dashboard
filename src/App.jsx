import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { API_URL } from "./config/api";
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard";
import LaunchedCustomerDashboard from "./pages/LaunchedCustomerDashboard";
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
import useAlarmLogWindowState from "./hooks/useAlarmLogWindowState";

function PaymentStatusPopup({ open, type, message, onClose }) {
  if (!open || !message) return null;

  const isSuccess = type === "success";

  return (
    <>
      <style>
        {`
          @keyframes coreflexPopupFadeIn {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(0.96);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes coreflexBackdropFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          @keyframes coreflexCheckPop {
            0% {
              opacity: 0;
              transform: scale(0.5) rotate(-12deg);
            }
            60% {
              opacity: 1;
              transform: scale(1.12) rotate(0deg);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes coreflexRingPulse {
            0% {
              opacity: 0.35;
              transform: scale(0.9);
            }
            100% {
              opacity: 0;
              transform: scale(1.35);
            }
          }
        `}
      </style>

      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/45 px-4"
        style={{ animation: "coreflexBackdropFadeIn 180ms ease-out" }}
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-2xl"
          style={{ animation: "coreflexPopupFadeIn 220ms ease-out" }}
        >
          <div className="flex justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center">
              {isSuccess ? (
                <>
                  <div
                    className="absolute inset-0 rounded-full bg-emerald-200"
                    style={{ animation: "coreflexRingPulse 900ms ease-out" }}
                  />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-8 w-8 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ animation: "coreflexCheckPop 320ms ease-out 80ms both" }}
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </>
              ) : (
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 shadow-inner">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: "coreflexCheckPop 320ms ease-out 80ms both" }}
                  >
                    <path d="M12 8v5" />
                    <path d="M12 16h.01" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <div
              className={`text-[20px] font-bold ${
                isSuccess ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {isSuccess ? "Payment Successful" : "Payment Cancelled"}
            </div>

            <div className="mt-2 text-[13px] leading-relaxed text-slate-600">
              {message}
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={onClose}
              className={`w-full rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition ${
                isSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = String(location.pathname || "").trim();
  const [paymentBanner, setPaymentBanner] = useState("");
  const [paymentBannerType, setPaymentBannerType] = useState("success");
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  const isLaunchPage = pathname === "/launchMainDashboard";
  const isLaunchAlarmLog = pathname === "/launchAlarmLog";

  // ✅ SUPPORT BOTH:
  // 1) old private route: /launchDashboard/:dashboardId
  // 2) new public route: /launchDashboard/:dashboardSlug/:publicLaunchId
  const isLaunchCustomerDashboard = pathname.startsWith("/launchDashboard/");

  const isAnyLaunchPage =
    isLaunchPage || isLaunchAlarmLog || isLaunchCustomerDashboard;

  // ✅ NAVIGATION (persist on refresh)
  const {
    activePage,
    setActivePage,
    activeSubPage,
    setActiveSubPage,
    subPageColor,
    setSubPageColor,
  } = usePageNavigation("coreflex_activePage");

  // ✅ payment popup / return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = String(params.get("payment") || "")
      .trim()
      .toLowerCase();

    if (!payment) return;

    let timer;

    if (payment === "success") {
      setPaymentBanner("Your subscription is updating.");
      setPaymentBannerType("success");
      setShowPaymentPopup(true);
      setActivePage("dashboard");

      timer = setTimeout(() => {
        setShowPaymentPopup(false);
        setPaymentBanner("");
      }, 10000);
    } else if (payment === "cancel") {
      setPaymentBanner("Your payment was canceled.");
      setPaymentBannerType("cancel");
      setShowPaymentPopup(true);

      timer = setTimeout(() => {
        setShowPaymentPopup(false);
        setPaymentBanner("");
      }, 10000);
    } else {
      return;
    }

    params.delete("payment");
    params.delete("session_id");

    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true }
    );

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [location.pathname, location.search, navigate, setActivePage]);

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

  // ✅ NEW: IDs Details global state from RightPanel
  const [dashboardIdsDetailsState, setDashboardIdsDetailsState] = useState({
    enabled: false,
    dashboardId: "",
    dashboardName: "",
  });

  const resetToGuestState = () => {
    setDroppedTanks([]);
    setSelectedTank(null);
    setSelectedIds([]);
    setDashboardMode("edit");
    setActivePage("home");
    setActiveSubPage(null);
    setSubPageColor("");
    setDashboardIdsDetailsState({
      enabled: false,
      dashboardId: "",
      dashboardName: "",
    });
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
    setDashboardIdsDetailsState({
      enabled: false,
      dashboardId: "",
      dashboardName: "",
    });
  };

  const { currentUserKey, handleLogout } = useAuthController({
    onNoAuthReset: resetToGuestState,
    onUserChangedReset: resetForUserChange,
    onLogoutReset: resetToGuestState,
    navigate,
    logoutRoute: "/",
    skipAuthRedirect: isAnyLaunchPage,
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

  // ✅ NEW: only active dashboard receives the IDs Details signal
  const showDashboardIdsDetailsForActiveCanvas = useMemo(() => {
    const activeDash = String(effectiveDashboardId || "").trim();
    const detailsDash = String(
      dashboardIdsDetailsState?.dashboardId || ""
    ).trim();

    return Boolean(
      dashboardIdsDetailsState?.enabled &&
        activeDash &&
        detailsDash === activeDash
    );
  }, [dashboardIdsDetailsState, effectiveDashboardId]);

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

  // ✅ Display OUTPUT Settings
  const [displayOutputSettingsId, setDisplayOutputSettingsId] = useState(null);

  const openDisplayOutputSettings = (tank) => {
    setDisplayOutputSettingsId(tank?.id ?? null);
  };

  const closeDisplayOutputSettings = () => {
    setDisplayOutputSettingsId(null);
  };

  // ✅ Gauge Display Settings
  const [gaugeSettingsId, setGaugeSettingsId] = useState(null);

  const openGaugeDisplaySettings = (tank) => {
    setGaugeSettingsId(tank?.id ?? null);
  };

  const closeGaugeDisplaySettings = () => {
    setGaugeSettingsId(null);
  };

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

  const {
    alarmLogOpen,
    alarmLogMinimized,
    alarmLogWindowRow,
    openAlarmLog,
    closeAlarmLog,
    minimizeAlarmLog,
    restoreAlarmLog,
  } = useAlarmLogWindowState({
    apiUrl: API_URL,
    dashboardId: effectiveDashboardId,
    dashboardName: String(activeDashboard?.dashboardName || "").trim(),
    activePage,
    currentUserKey,
    defaultTitle: "Alarms Log (DI-AI)",
    defaultPosition: { x: 140, y: 90 },
    defaultSize: { width: 900, height: 420 },
  });

  // Launch = separate window (always tracking alarms)
  const launchAlarmLog = (payload = {}) => {
    const qs = new URLSearchParams({
      dashboardId: String(payload?.dashboardId || effectiveDashboardId || "main"),
      dashboardName: String(
        payload?.dashboardName || activeDashboard?.dashboardName || ""
      ),
      windowKey: String(payload?.windowKey || "alarmLog"),
    });

    window.open(`/launchAlarmLog?${qs.toString()}`, "_blank");
  };

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
    dashboardId: effectiveDashboardId,
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

  // ✅ CUSTOMER DASHBOARD LAUNCH PAGE
  if (isLaunchCustomerDashboard) {
    return <LaunchedCustomerDashboard />;
  }

  // ✅ ALARM LOG LAUNCH PAGE — render full-page Alarm Log
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
      <PaymentStatusPopup
        open={showPaymentPopup}
        type={paymentBannerType}
        message={paymentBanner}
        onClose={() => {
          setShowPaymentPopup(false);
          setPaymentBanner("");
        }}
      />

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
            dashboardId={effectiveDashboardId}
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
            onOpenGaugeDisplaySettings={openGaugeDisplaySettings}
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
            showDashboardIdsDetails={showDashboardIdsDetailsForActiveCanvas}
            onOpenDisplayOutputSettings={openDisplayOutputSettings}
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
          dashboardName={String(activeDashboard?.dashboardName || "").trim()}
          droppedTanks={droppedTanks}
          setDroppedTanks={setDroppedTanks}
          showRestoreWarning={showRestoreWarning}
          setShowRestoreWarning={setShowRestoreWarning}
          lastSavedAt={lastSavedAt}
          handleUploadProject={handleUploadProject}
          displaySettingsId={displaySettingsId}
          closeDisplaySettings={closeDisplaySettings}
          displayOutputSettingsId={displayOutputSettingsId}
          closeDisplayOutputSettings={closeDisplayOutputSettings}
          graphicSettingsId={graphicSettingsId}
          closeGraphicDisplaySettings={closeGraphicDisplaySettings}
          gaugeSettingsId={gaugeSettingsId}
          closeGaugeDisplaySettings={closeGaugeDisplaySettings}
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
        dashboardId={String(effectiveDashboardId || "").trim()}
        dashboardName={String(activeDashboard?.dashboardName || "").trim()}
        isDashboardOpenOnCanvas={
          activePage === "dashboard" && !!String(effectiveDashboardId || "").trim()
        }
        onOpenDashboardIdsDetails={(payload = {}) => {
          setDashboardIdsDetailsState({
            enabled: !!payload?.enabled,
            dashboardId: String(payload?.dashboardId || "").trim(),
            dashboardName: String(payload?.dashboardName || "").trim(),
          });
        }}
      />
    </div>
  );
}