// src/components/AlarmLogModal.jsx
import React from "react";
import { createPortal } from "react-dom";
import FloatingWindow from "./FloatingWindow";
import AlarmLogWindow from "./AlarmLogWindow";

export default function AlarmLogModal({
  open,
  onClose,
  onLaunch,
  onMinimize,

  // from AppModals
  position,
  onPositionChange,
}) {
  if (!open) return null;

  const content = (
    <FloatingWindow
      visible={open}
      title="Alarms Log (DI-AI)"
      position={position || { x: 120, y: 120 }}
      size={{ width: 900, height: 420 }}
      onClose={onClose}
      onLaunch={onLaunch}
      onMinimize={onMinimize}
      hideHeader={true}
      onPositionChange={onPositionChange}
      boundsMode="viewport"   // ✅ important: clamp to screen
    >
      <AlarmLogWindow
        onLaunch={onLaunch}
        onMinimize={onMinimize}
        onClose={onClose}
      />
    </FloatingWindow>
  );

  // ✅ render outside canvas so it cannot be clipped by canvas/layout
  return createPortal(content, document.body);
}
