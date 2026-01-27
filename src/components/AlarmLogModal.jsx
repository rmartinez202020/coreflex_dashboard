// src/components/AlarmLogModal.jsx
import React, { useEffect, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import AlarmLogWindow from "./AlarmLogWindow";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function AlarmLogModal({ open, onClose, onLaunch, onMinimize }) {
  // ✅ default open position
  const [pos, setPos] = useState(() => {
    // optional: remember last position
    try {
      const raw = localStorage.getItem("coreflex_alarmLog_pos");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.x === "number" &&
          typeof parsed.y === "number"
        ) {
          return parsed;
        }
      }
    } catch {}
    return { x: 120, y: 120 };
  });

  // ✅ listen for "open at drop point" events
  useEffect(() => {
    const handler = (ev) => {
      const x = ev?.detail?.x;
      const y = ev?.detail?.y;
      if (typeof x !== "number" || typeof y !== "number") return;

      // offset so cursor isn't on close/minimize buttons
      const nextX = x - 60;
      const nextY = y - 30;

      // clamp a bit so it doesn't appear off-screen
      const safeX = clamp(nextX, 8, window.innerWidth - 220);
      const safeY = clamp(nextY, 8, window.innerHeight - 140);

      const next = { x: safeX, y: safeY };

      setPos(next);
      try {
        localStorage.setItem("coreflex_alarmLog_pos", JSON.stringify(next));
      } catch {}
    };

    window.addEventListener("coreflex-alarm-log-open-at", handler);
    return () => window.removeEventListener("coreflex-alarm-log-open-at", handler);
  }, []);

  // ✅ keep saved position up to date if FloatingWindow moves it
  const handleWindowMove = (nextPos) => {
    if (!nextPos) return;

    setPos(nextPos);
    try {
      localStorage.setItem("coreflex_alarmLog_pos", JSON.stringify(nextPos));
    } catch {}
  };

  if (!open) return null;

  return (
    <FloatingWindow
      visible={open}
      title="Alarms Log (DI-AI)"
      position={pos} // ✅ now dynamic
      size={{ width: 900, height: 420 }}
      onClose={onClose}
      onLaunch={onLaunch}
      onMinimize={onMinimize}
      hideHeader={true} // ✅ remove the first top bar

      // ✅ IMPORTANT:
      // your FloatingWindow must call this when dragging updates position
      // (if your prop name differs, tell me the actual one and I’ll adjust)
      onPositionChange={handleWindowMove}
    >
      <AlarmLogWindow
        onLaunch={onLaunch}
        onMinimize={onMinimize}
        onClose={onClose}
      />
    </FloatingWindow>
  );
}
