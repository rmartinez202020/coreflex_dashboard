// src/components/FloatingWindow.jsx
import React, { useEffect, useRef, useState } from "react";

export default function FloatingWindow({
  visible,
  title,
  position = { x: 120, y: 120 },
  size = { width: 900, height: 420 },
  onClose,
  onMinimize,
  onLaunch,
  children,
  hideHeader = false,
}) {
  const [pos, setPos] = useState(position);
  const [sz, setSz] = useState(size);

  const dragStartRef = useRef(null);
  const resizeStartRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setPos(position);
      setSz(size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const clampMin = (n, min) => Math.max(min, n);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // ----------------------------------------------------
  // Workspace detection
  // ----------------------------------------------------
  const findWorkspaceEl = (mainEl) => {
    if (!mainEl) return null;
    const candidates = [
      ".border-dashed.border-gray-300",
      ".border-2.border-dashed",
      "[data-coreflex-workspace]",
    ];
    for (const sel of candidates) {
      const el = mainEl.querySelector(sel);
      if (el) return el;
    }
    return null;
  };

  // ----------------------------------------------------
  // Convert viewport mouse coords → main scroll coords
  // ----------------------------------------------------
  const toMainCoords = (clientX, clientY, bounds) => {
    if (!bounds?.mainRect) return { x: clientX, y: clientY };
    return {
      x: clientX - bounds.mainRect.left + bounds.mainScrollLeft,
      y: clientY - bounds.mainRect.top + bounds.mainScrollTop,
    };
  };

  // ----------------------------------------------------
  // Compute bounds using FULL scrollable workspace
  // ----------------------------------------------------
  const getWorkspaceBounds = (sizeOverride) => {
    const curSize = sizeOverride || sz;
    const mainEl = document.querySelector("main");
    const mainRect = mainEl?.getBoundingClientRect?.();

    if (!mainEl || !mainRect) {
      return {
        minX: 0,
        minY: 0,
        maxX: window.innerWidth - curSize.width,
        maxY: window.innerHeight - curSize.height,
        mainRect: null,
        mainScrollLeft: 0,
        mainScrollTop: 0,
      };
    }

    const mainScrollLeft = mainEl.scrollLeft || 0;
    const mainScrollTop = mainEl.scrollTop || 0;

    const workspaceEl = findWorkspaceEl(mainEl) || mainEl;

    const wsLeft = workspaceEl.offsetLeft || 0;
    const wsTop = workspaceEl.offsetTop || 0;
    const wsWidth =
      workspaceEl.scrollWidth || workspaceEl.offsetWidth || mainRect.width;
    const wsHeight =
      workspaceEl.scrollHeight || workspaceEl.offsetHeight || mainRect.height;

    return {
      minX: wsLeft,
      minY: wsTop,
      maxX: wsLeft + wsWidth - curSize.width,
      maxY: wsTop + wsHeight - curSize.height,
      mainRect,
      mainScrollLeft,
      mainScrollTop,
      wsLeft,
      wsTop,
      wsWidth,
      wsHeight,
    };
  };

  // ----------------------------------------------------
  // Drag
  // ----------------------------------------------------
  const startDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const bounds = getWorkspaceBounds(sz);
    const p0 = toMainCoords(e.clientX, e.clientY, bounds);

    dragStartRef.current = {
      startX: p0.x,
      startY: p0.y,
      startPos: { ...pos },
    };

    const onMove = (ev) => {
      const s = dragStartRef.current;
      if (!s) return;

      const boundsNow = getWorkspaceBounds(sz);
      const p = toMainCoords(ev.clientX, ev.clientY, boundsNow);

      const dx = p.x - s.startX;
      const dy = p.y - s.startY;

      setPos({
        x: clamp(s.startPos.x + dx, boundsNow.minX, boundsNow.maxX),
        y: clamp(s.startPos.y + dy, boundsNow.minY, boundsNow.maxY),
      });
    };

    const onUp = () => {
      dragStartRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ----------------------------------------------------
  // Resize
  // ----------------------------------------------------
  const startResize = (edge) => (e) => {
    e.stopPropagation();
    e.preventDefault();

    const bounds = getWorkspaceBounds(sz);
    const p0 = toMainCoords(e.clientX, e.clientY, bounds);

    resizeStartRef.current = {
      edge,
      startX: p0.x,
      startY: p0.y,
      startSize: { ...sz },
      startPos: { ...pos },
    };

    const minW = 520;
    const minH = 260;

    const onMove = (ev) => {
      const s = resizeStartRef.current;
      if (!s) return;

      const boundsNow = getWorkspaceBounds(sz);
      const p = toMainCoords(ev.clientX, ev.clientY, boundsNow);

      const dx = p.x - s.startX;
      const dy = p.y - s.startY;

      let nextW = s.startSize.width;
      let nextH = s.startSize.height;

      if (s.edge === "right" || s.edge === "corner")
        nextW = clampMin(nextW + dx, minW);
      if (s.edge === "bottom" || s.edge === "corner")
        nextH = clampMin(nextH + dy, minH);

      const wsBounds = getWorkspaceBounds({ width: nextW, height: nextH });

      nextW = Math.min(
        nextW,
        wsBounds.wsLeft + wsBounds.wsWidth - s.startPos.x
      );
      nextH = Math.min(
        nextH,
        wsBounds.wsTop + wsBounds.wsHeight - s.startPos.y
      );

      setSz({ width: nextW, height: nextH });

      setPos((pcur) => ({
        x: clamp(pcur.x, wsBounds.minX, wsBounds.maxX),
        y: clamp(pcur.y, wsBounds.minY, wsBounds.maxY),
      }));
    };

    const onUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const headerH = hideHeader ? 0 : 40;

  return (
    <div
      className="floating-window"
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: sz.width,
        height: sz.height,
        background: "white",
        border: "2px solid #1e293b",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.55)",
        zIndex: 999999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {!hideHeader && (
        <div
          onMouseDown={startDrag}
          style={{
            height: 40,
            background: "#0f172a",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            cursor: "move",
          }}
        >
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {onLaunch && <button onClick={onLaunch} style={iconBtn}>↗</button>}
            {onMinimize && <button onClick={onMinimize} style={iconBtn}>—</button>}
            <button onClick={onClose} style={{ ...iconBtn, background: "#ef4444" }}>✕</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>

      {hideHeader && (
        <div
          onMouseDown={startDrag}
          style={{ position: "absolute", top: 0, height: 10, width: "100%", cursor: "move" }}
        />
      )}

      <div onMouseDown={startResize("right")} style={{ position: "absolute", right: 0, top: headerH, width: 10, height: "100%", cursor: "ew-resize" }} />
      <div onMouseDown={startResize("bottom")} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 10, cursor: "ns-resize" }} />
      <div onMouseDown={startResize("corner")} style={{ position: "absolute", right: 0, bottom: 0, width: 16, height: 16, cursor: "nwse-resize" }} />
    </div>
  );
}

const iconBtn = {
  width: 28,
  height: 24,
  borderRadius: 6,
  background: "#111827",
  color: "white",
  border: "1px solid #334155",
  cursor: "pointer",
};
