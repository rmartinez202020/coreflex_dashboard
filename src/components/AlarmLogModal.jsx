// src/components/AlarmLogModal.jsx
import React from "react";
import FloatingWindow from "./FloatingWindow";
import AlarmLogWindow from "./AlarmLogWindow";

export default function AlarmLogModal({
  open,
  onClose,
  onLaunch,
  onMinimize,
  onOpenSettings,
}) {
  if (!open) return null;

  return (
    <FloatingWindow
      visible={open}
      title="Alarms Log (DI-AI)"
      position={{ x: 120, y: 120 }}
      size={{ width: 900, height: 420 }}
      onClose={onClose}
    >
      <AlarmLogWindow
        onLaunch={onLaunch}
        onMinimize={onMinimize}
        onClose={onClose}
        onOpenSettings={onOpenSettings}
        title="Alarms Log (DI-AI)"
      />
    </FloatingWindow>
  );
}
