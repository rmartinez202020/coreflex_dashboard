// src/components/AlarmLogModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import AlarmLogWindow from "./AlarmLogWindow";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function AlarmLogModal({ open, onClose, onLaunch, onMinimize }) {
  // Match your window size
  const WIN_W = 900;
  const WIN_H = 420;

  // Find the MAIN workspace (between left/right sidebars)
  const getMainRect = () => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return null;
    return mainEl.getBoundingClientRect();
  };

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

  // ✅ Clamp current position whenever modal opens (handles resize, etc.)
  useEffect(() => {
    if (!open) return;

    const rect = getMainRect();
    if (!rect) return;

    const maxX = Math.max(0, rect.width - WIN_W);
    const maxY = Math.max(0, rect.height - WIN_H);

    const clamped = {
      x: clamp(pos.x, 0, maxX),
      y: clamp(pos.y, 0, maxY),
    };

    if (clamped.x !== pos.x || clamped.y !== pos.y) {
      setPos(clamped);
      try {
        localStorage.setItem("coreflex_alarmLog_pos", JSON.stringify(clamped));
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ Listen for "open at drop point" event
  useEffect(() => {
    const handler = (ev) => {
      const clientX = ev?.detail?.x;
      const clientY = ev?.detail?.y;
      if (typeof clientX !== "number" || typeof clientY !== "number") return;

      const rect = getMainRect();
      if (!rect) return;

      // Convert SCREEN coords -> MAIN-relative coords
      // (because FloatingWindow is inside <main> and uses absolute)
      let x = clientX - rect.left;
      let y = clientY - rect.top;

      // Small offset so cursor isn't on the top buttons
      x -= 60;
      y -= 30;

      // Clamp to main workspace bounds
      const maxX = Math.max(0, rect.width - WIN_W);
      const maxY = Math.max(0, rect.height - WIN_H);

      const next = {
        x: clamp(x, 0, maxX),
        y: clamp(y, 0, maxY),
      };

      setPos(next);
      try {
        localStorage.setItem("coreflex_alarmLog_pos", JSON.stringify(next));
      } catch {}
    };

    window.addEventListener("coreflex-alarm-log-open-at", handler);
    return () =>
      window.removeEventListener("coreflex-alarm-log-open-at", handler);
  }, []);

  if (!open) return null;

  return (
    <FloatingWindow
      visible={open}
      title="Alarms Log (DI-AI)"
      position={pos} // ✅ now constrained to the main area
      size={{ width: WIN_W, height: WIN_H }}
      onClose={onClose}
      onLaunch={onLaunch}
      onMinimize={onMinimize}
      hideHeader={true} // ✅ remove the first top bar
    >
      <AlarmLogWindow
        onLaunch={onLaunch}
        onMinimize={onMinimize}
        onClose={onClose}
      />
    </FloatingWindow>
  );
}
