// src/components/RightPanel.jsx
import React from "react";
import useWindowDragResize from "../hooks/useWindowDragResize";

import RightSidebar from "./RightSidebar";

// ✅ Lazy-load floating windows so they do NOT get imported at startup
const ImageLibrary = React.lazy(() => import("./ImageLibrary"));
const CoreFlexLibrary = React.lazy(() => import("./CoreFlexLibrary"));

const HmiSymbolsLibrary = React.lazy(() => import("./HmiSymbolsLibrary"));
const HvacSymbols2DLibrary = React.lazy(() =>
  import("./HvacSymbols2DLibrary")
);
const HvacSymbols3DLibrary = React.lazy(() =>
  import("./HvacSymbols3DLibrary")
);
const ManufacturingSymbols2DLibrary = React.lazy(() =>
  import("./ManufacturingSymbols2DLibrary")
);
const ManufacturingSymbols3DLibrary = React.lazy(() =>
  import("./ManufacturingSymbols3DLibrary")
);
const TanksAndPipesSymbols2DLibrary = React.lazy(() =>
  import("./TanksAndPipesSymbols2DLibrary")
);
const TanksAndPipesSymbols3DLibrary = React.lazy(() =>
  import("./TanksAndPipesSymbols3DLibrary")
);

/**
 * RightPanel
 * - Owns window manager (wm)
 * - Renders RightSidebar
 * - Mounts ALL floating library windows
 *
 * ✅ NEW:
 * - Listens for "coreflex-open-iots-library" to open CoreFlex library as a PICKER
 * - Remembers which image user is picking: OFF or ON
 * - Remembers which tankId is being edited
 *
 * ✅ NEW:
 * - Passes active dashboard context to RightSidebar
 * - Alarm Log can only open when a real dashboard is open on canvas
 *
 * ✅ NEW:
 * - Owns Dashboard IDs Details toggle state so RightSidebar can visibly switch ON/OFF
 */
export default function RightPanel({
  isRightCollapsed,
  setIsRightCollapsed,
  dashboardMode,

  // ✅ active dashboard context from App.jsx
  dashboardId = "",
  dashboardName = "",
  isDashboardOpenOnCanvas = false,

  // ✅ Alarm Log opener (system window lives in AppModals / App layer)
  onOpenAlarmLog,
}) {
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
    },
    hvac2d: {
      position: { x: 220, y: 140 },
      size: { width: 760, height: 540 },
      minSize: { width: 520, height: 360 },
    },
    hvac3d: {
      position: { x: 220, y: 140 },
      size: { width: 760, height: 540 },
      minSize: { width: 520, height: 360 },
    },
    mfg2d: {
      position: { x: 220, y: 140 },
      size: { width: 760, height: 540 },
      minSize: { width: 520, height: 360 },
    },
    mfg3d: {
      position: { x: 220, y: 140 },
      size: { width: 760, height: 540 },
      minSize: { width: 520, height: 360 },
    },
    tp2d: {
      position: { x: 220, y: 140 },
      size: { width: 760, height: 540 },
      minSize: { width: 520, height: 360 },
    },
    tp3d: {
      position: { x: 220, y: 140 },
      size: { width: 760, height: 540 },
      minSize: { width: 520, height: 360 },
    },
  });

  // ✅ Picker state for CoreFlex library (OFF/ON)
  const [coreflexPicker, setCoreflexPicker] = React.useState({
    active: false,
    which: "off", // "off" | "on"
    tankId: null,
  });

  // ✅ NEW: local toggle state for IDs Details
  const [isDashboardIdsDetailsOpen, setIsDashboardIdsDetailsOpen] =
    React.useState(false);

  // ✅ Reset IDs Details toggle when dashboard changes / closes
  React.useEffect(() => {
    if (!isDashboardOpenOnCanvas || !String(dashboardId || "").trim()) {
      setIsDashboardIdsDetailsOpen(false);
      return;
    }
  }, [dashboardId, isDashboardOpenOnCanvas]);

  // ✅ Listen: "open IOTs Library to pick OFF/ON image"
  React.useEffect(() => {
    const onOpenPicker = (ev) => {
      const which = ev?.detail?.which === "on" ? "on" : "off";
      const tankId = ev?.detail?.tankId ?? null;

      setCoreflexPicker({ active: true, which, tankId });

      // open the window
      wm.openWindow("coreflex", { cascade: true });
    };

    window.addEventListener("coreflex-open-iots-library", onOpenPicker);
    return () =>
      window.removeEventListener("coreflex-open-iots-library", onOpenPicker);
  }, [wm]);

  // ✅ When user clicks an image inside CoreFlex library
  const handleCoreflexSelect = (url) => {
    // If not in picker mode, do nothing special (could be used for normal insert later)
    if (!coreflexPicker.active) return;

    // Send selection back to App layer (AppModals / App.jsx will patch tank properties)
    window.dispatchEvent(
      new CustomEvent("coreflex-iots-library-selected", {
        detail: {
          url,
          which: coreflexPicker.which,
          tankId: coreflexPicker.tankId,
        },
      })
    );

    // close picker + close window
    setCoreflexPicker({ active: false, which: "off", tankId: null });
    wm.closeWindow("coreflex");
  };

  // ✅ NEW: visible toggle handler for RightSidebar
  const handleDashboardIdsDetailsToggle = React.useCallback(
    ({ enabled, dashboardId: activeDashboardId, dashboardName: activeDashboardName }) => {
      const normalizedDashboardId = String(activeDashboardId || "").trim();
      const normalizedDashboardName = String(activeDashboardName || "").trim();

      setIsDashboardIdsDetailsOpen(Boolean(enabled));

      // Notify the rest of the app/canvas layer
      window.dispatchEvent(
        new CustomEvent("coreflex-dashboard-ids-details-toggle", {
          detail: {
            enabled: Boolean(enabled),
            dashboardId: normalizedDashboardId,
            dashboardName: normalizedDashboardName,
          },
        })
      );
    },
    []
  );

  return (
    <>
      {/* ✅ RIGHT SIDEBAR */}
      <RightSidebar
        isRightCollapsed={isRightCollapsed}
        setIsRightCollapsed={setIsRightCollapsed}
        setShowImageLibrary={() => wm.openWindow("image", { cascade: true })}
        setShowCoreflexLibrary={() => {
          // normal open (not picker)
          setCoreflexPicker({ active: false, which: "off", tankId: null });
          wm.openWindow("coreflex", { cascade: true });
        }}
        openSymbolLibrary={(key) => wm.openWindow(key, { cascade: true })}
        dashboardMode={dashboardMode}
        onOpenAlarmLog={onOpenAlarmLog}
        onOpenDashboardIdsDetails={handleDashboardIdsDetailsToggle}
        isDashboardIdsDetailsOpen={isDashboardIdsDetailsOpen}
        dashboardId={dashboardId}
        dashboardName={dashboardName}
        isDashboardOpenOnCanvas={isDashboardOpenOnCanvas}
      />

      {/* ✅ FLOATING WINDOWS (lazy loaded) */}
      <React.Suspense fallback={null}>
        <ImageLibrary
          {...wm.getWindowProps("image", {
            onDragStartImage: (e, img) =>
              e.dataTransfer.setData("imageUrl", img.src),
          })}
        />

        {/* ✅ CoreFlex IOTs Library */}
        <CoreFlexLibrary
          {...wm.getWindowProps("coreflex")}
          // ✅ pass picker info + click callback
          pickerMode={coreflexPicker.active}
          pickerWhich={coreflexPicker.which}
          onPickImage={handleCoreflexSelect}
        />

        {/* ✅ SYMBOL LIBRARIES */}
        <HmiSymbolsLibrary {...wm.getWindowProps("hmi")} />
        <HvacSymbols2DLibrary {...wm.getWindowProps("hvac2d")} />
        <HvacSymbols3DLibrary {...wm.getWindowProps("hvac3d")} />
        <ManufacturingSymbols2DLibrary {...wm.getWindowProps("mfg2d")} />
        <ManufacturingSymbols3DLibrary {...wm.getWindowProps("mfg3d")} />
        <TanksAndPipesSymbols2DLibrary {...wm.getWindowProps("tp2d")} />
        <TanksAndPipesSymbols3DLibrary {...wm.getWindowProps("tp3d")} />
      </React.Suspense>
    </>
  );
}