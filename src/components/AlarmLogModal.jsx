// src/components/AlarmLogModal.jsx
import React from "react";
import FloatingWindow from "./FloatingWindow";
import AlarmLogWindow from "./AlarmLogWindow";

export default function AlarmLogModal({ open, onClose, onLaunch, onMinimize }) {
  if (!open) return null;

  return (
    <FloatingWindow
      visible={open}
      title="Alarms Log (DI-AI)"
      position={{ x: 120, y: 120 }}
      size={{ width: 900, height: 420 }}
      onClose={onClose}
      onLaunch={onLaunch}
      onMinimize={onMinimize}
      hideHeader={true}
    >
      <AlarmLogWindow
        onLaunch={onLaunch}
        onMinimize={onMinimize}
        onClose={onClose}
      />
    </FloatingWindow>
  );
}
