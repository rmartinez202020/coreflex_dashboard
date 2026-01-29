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

  // ✅ NEW: pass this from parent: useWindowDragResize.getWindowProps("alarmLog")
  windowProps,
}) {
  if (!open) return null;

  const content = (
    <FloatingWindow
      visible={open}
      title="Alarms Log (DI-AI)"
      position={windowProps?.position}
      size={windowProps?.size}
      onClose={onClose}
      onLaunch={onLaunch}
      onMinimize={onMinimize}
      hideHeader={true}
      // ✅ THE IMPORTANT PART
      onStartDragWindow={windowProps?.onStartDragWindow}
      onStartResizeWindow={windowProps?.onStartResizeWindow}
    >
      <AlarmLogWindow
        onLaunch={onLaunch}
        onMinimize={onMinimize}
        onClose={onClose}
        // ✅ THIS MAKES YOUR TOP BAR DRAG THE OUTER WINDOW
        onStartDragWindow={windowProps?.onStartDragWindow}
      />
    </FloatingWindow>
  );

  return createPortal(content, document.body);
}
