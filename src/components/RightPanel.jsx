// src/components/RightPanel.jsx
import React from "react";
import useWindowDragResize from "../hooks/useWindowDragResize";

import RightSidebar from "./RightSidebar";

// Floating windows
import ImageLibrary from "./ImageLibrary";
import CoreFlexLibrary from "./CoreFlexLibrary";

import HmiSymbolsLibrary from "./HmiSymbolsLibrary";
import HvacSymbols2DLibrary from "./HvacSymbols2DLibrary";
import HvacSymbols3DLibrary from "./HvacSymbols3DLibrary";
import ManufacturingSymbols2DLibrary from "./ManufacturingSymbols2DLibrary";
import ManufacturingSymbols3DLibrary from "./ManufacturingSymbols3DLibrary";
import TanksAndPipesSymbols2DLibrary from "./TanksAndPipesSymbols2DLibrary";
import TanksAndPipesSymbols3DLibrary from "./TanksAndPipesSymbols3DLibrary";

/**
 * RightPanel
 * - Owns window manager (wm)
 * - Renders RightSidebar
 * - Mounts ALL floating library windows
 *
 * Keeps App.jsx clean.
 */
export default function RightPanel({
  isRightCollapsed,
  setIsRightCollapsed,
  dashboardMode,
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

  return (
    <>
      {/* ✅ RIGHT SIDEBAR */}
      <RightSidebar
        isRightCollapsed={isRightCollapsed}
        setIsRightCollapsed={setIsRightCollapsed}
        setShowImageLibrary={() => wm.openWindow("image")}
        setShowCoreflexLibrary={() => wm.openWindow("coreflex")}
        openSymbolLibrary={(key) => wm.openWindow(key, { center: true })}
        dashboardMode={dashboardMode}
      />

      {/* ✅ FLOATING WINDOWS (must be mounted so wm.openWindow works) */}
      <ImageLibrary
        {...wm.getWindowProps("image", {
          onDragStartImage: (e, img) =>
            e.dataTransfer.setData("imageUrl", img.src),
        })}
      />

      <CoreFlexLibrary {...wm.getWindowProps("coreflex")} />

      {/* ✅ SYMBOL LIBRARIES */}
      <HmiSymbolsLibrary {...wm.getWindowProps("hmi")} />
      <HvacSymbols2DLibrary {...wm.getWindowProps("hvac2d")} />
      <HvacSymbols3DLibrary {...wm.getWindowProps("hvac3d")} />
      <ManufacturingSymbols2DLibrary {...wm.getWindowProps("mfg2d")} />
      <ManufacturingSymbols3DLibrary {...wm.getWindowProps("mfg3d")} />
      <TanksAndPipesSymbols2DLibrary {...wm.getWindowProps("tp2d")} />
      <TanksAndPipesSymbols3DLibrary {...wm.getWindowProps("tp3d")} />
    </>
  );
}
