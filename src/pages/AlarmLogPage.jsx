// src/pages/AlarmLogPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import AlarmLogWindow from "../components/AlarmLogWindow";

/**
 * Full page Alarms Log view
 * - Renders AlarmLogWindow in "page mode" (no drag/minimize/launch)
 * - Close behaves like "Back"
 *
 * ✅ IMPORTANT:
 * Pass the same props you already pass to AlarmLogWindow in window mode:
 * devices, availableTags, sensorsData, onAddAlarm
 */
export default function AlarmLogPage({
  devices = [],
  availableTags = [],
  sensorsData,
  onAddAlarm,
}) {
  const navigate = useNavigate();

  return (
    <div style={pageWrap}>
      <div style={pageInner}>
        <AlarmLogWindow
          // ✅ page mode
          isPage

          // ✅ data + settings
          devices={devices}
          availableTags={availableTags}
          sensorsData={sensorsData}
          onAddAlarm={onAddAlarm}

          // ✅ make Close act like Back
          onClose={() => navigate(-1)}

          // ✅ not used in page mode (safe)
          onMinimize={null}
          onLaunch={null}
          onStartDragWindow={null}
          onOpenSettings={null}
        />
      </div>
    </div>
  );
}

const pageWrap = {
  width: "100vw",
  height: "100vh",
  background: "#0b1220",
  padding: 18,
  boxSizing: "border-box",
  display: "flex",
};

const pageInner = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  background: "transparent",
};
