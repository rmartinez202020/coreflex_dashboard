import React from "react";
import FloatingWindow from "./FloatingWindow";
import AlarmLogWindow from "./AlarmLogWindow";

export default function AlarmLogModal({
  open,
  onClose,
  onLaunch,
  onMinimize, // ✅ add this
}) {
  if (!open) return null;

  return (
    <FloatingWindow
      visible={open}
      title="Alarms Log (DI-AI)"
      position={{ x: 120, y: 120 }}
      size={{ width: 900, height: 420 }}
      onClose={onClose}
      onLaunch={onLaunch}
      onMinimize={onMinimize} // ✅ important
    >
      <AlarmLogWindow
        onLaunch={onLaunch}
        onClose={onClose}
        onMinimize={onMinimize} // ✅ important
      />
    </FloatingWindow>
  );
}
