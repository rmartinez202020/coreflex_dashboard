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

  // ✅ NEW: allow parent (AppModals) to keep position in sync
  onPositionChange,
}) {
  const [pos, setPos] = useState(position);
  const [sz, setSz] = useState(size);

  const dragStartRef = useRef(null);
  const resizeStartRef = useRef(null);

  // ✅ Sync local pos/sz when opened AND when parent updates position/size
  useEffect(() => {
    if (!visible) return;
    setPos(position);
    setSz(size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, position?.x, position?.y, size?.width, size?.height]);

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
  // Detect the REAL scroll container:
  // - If <main> is scrollable, use it
  // - Otherwise, use window/document scrolling
  // ----------------------------------------------------
  const isMainScrollable = (mainEl) => {
    if (!mainEl) return false;
    if (mainEl.scrollHeight > mainEl.clientHeight + 2) return true;
    const cs = window.getComputedStyle(mainEl);
    const oy = cs?.overflowY;
    return oy === "auto" || oy === "scroll";
  };

  const getScrollContext = () => {
    const mainEl = document.querySelector("main");
    const mainRect = mainEl?.getBoundingClientRect?.();
    const useMain = mainEl && mainRect && isMainScrollable(mainEl);

    if (useMain) {
      return {
        mode: "main",
        mainEl,
        mainRect,
        scrollLeft: mainEl.scrollLeft || 0,
        scrollTop: mainEl.scrollTop || 0,
      };
    }

    // window scrolling
    return {
      mode: "window",
      mainEl: null,
      mainRect: { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
      scrollLeft: window.scrollX || 0,
      scrollTop: window.scrollY || 0,
    };
  };

  // ----------------------------------------------------
  // Convert viewport mouse coords → root scroll coords
  // (root = main scroll coords OR window scroll coords)
  // ----------------------------------------------------
  const toRootCoords = (clientX, clientY, ctx) => {
    return {
      x: clientX - ctx.mainRect.left + ctx.scrollLeft,
      y: clientY - ctx.mainRect.top + ctx.scrollTop,
    };
  };

  // ----------------------------------------------------
  // Compute bounds using FULL scrollable workspace
  // - In main mode: use workspace inside main
  // - In window mode: clamp to document size (full page)
  // ----------------------------------------------------
  const getWorkspaceBounds = (sizeOverride) => {
    const curSize = sizeOverride || sz;
    const ctx = getScrollContext();

    // If main is scroll container, clamp inside workspace
    if (ctx.mode === "main") {
      const workspaceEl = findWorkspaceEl(ctx.mainEl) || ctx.mainEl;

      const wsLeft = workspaceEl.offsetLeft || 0;
      const wsTop = workspaceEl.offsetTop || 0;
      const wsWidth =
        workspaceEl.scrollWidth || workspaceEl.offsetWidth || ctx.mainRect.width;
      const wsHeight =
        workspaceEl.scrollHeight || workspaceEl.offsetHeight || ctx.mainRect.height;

      return {
        minX: wsLeft,
        minY: wsTop,
        maxX: Math.max(wsLeft, wsLeft + wsWidth - curSize.width),
        maxY: Math.max(wsTop, wsTop + wsHeight - curSize.height),
        ctx,
        wsLeft,
        wsTop,
        wsWidth,
        wsHeight,
      };
    }

    // Window mode: clamp inside full document size
    const docEl = document.documentElement;
    const docWidth = Math.max(docEl.scrollWidth, docEl.clientWidth, window.innerWidth);
    const docHeight = Math.max(docEl.scrollHeight, docEl.clientHeight, window.innerHeight);

    return {
      minX: 0,
      minY: 0,
      maxX: Math.max(0, docWidth - curSize.width),
      maxY: Math.max(0, docHeight - curSize.height),
      ctx,
      wsLeft: 0,
      wsTop: 0,
      wsWidth: docWidth,
      wsHeight: docHeight,
    };
  };

  // ----------------------------------------------------
  // Drag
  // ----------------------------------------------------
  const startDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const bounds = getWorkspaceBounds(sz);
    const p0 = toRootCoords(e.clientX, e.clientY, bounds.ctx);

    dragStartRef.current = {
      startX: p0.x,
      startY: p0.y,
      startPos: { ...pos },
    };

    const onMove = (ev) => {
      const s = dragStartRef.current;
      if (!s) return;

      const boundsNow = getWorkspaceBounds(sz);
      const p = toRootCoords(ev.clientX, ev.clientY, boundsNow.ctx);

      const dx = p.x - s.startX;
      const dy = p.y - s.startY;

      const next = {
        x: clamp(s.startPos.x + dx, boundsNow.minX, boundsNow.maxX),
        y: clamp(s.startPos.y + dy, boundsNow.minY, boundsNow.maxY),
      };

      setPos(next);
      onPositionChange?.(next);
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
    const p0 = toRootCoords(e.clientX, e.clientY, bounds.ctx);

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
      const p = toRootCoords(ev.clientX, ev.clientY, boundsNow.ctx);

      const dx = p.x - s.startX;
      const dy = p.y - s.startY;

      let nextW = s.startSize.width;
      let nextH = s.startSize.height;

      if (s.edge === "right" || s.edge === "corner")
        nextW = clampMin(nextW + dx, minW);
      if (s.edge === "bottom" || s.edge === "corner")
        nextH = clampMin(nextH + dy, minH);

      const wsBounds = getWorkspaceBounds({ width: nextW, height: nextH });

      // Prevent resizing outside workspace bounds from current position
      nextW = Math.min(nextW, wsBounds.wsLeft + wsBounds.wsWidth - s.startPos.x);
      nextH = Math.min(nextH, wsBounds.wsTop + wsBounds.wsHeight - s.startPos.y);

      setSz({ width: nextW, height: nextH });

      // After resize, clamp position again
      const clampedPos = {
        x: clamp(pos.x, wsBounds.minX, wsBounds.maxX),
        y: clamp(pos.y, wsBounds.minY, wsBounds.maxY),
      };
      setPos(clampedPos);
      onPositionChange?.(clampedPos);
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
            {onLaunch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLaunch();
                }}
                style={iconBtn}
              >
                ↗
              </button>
            )}
            {onMinimize && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
                style={iconBtn}
              >
                —
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              style={{ ...iconBtn, background: "#ef4444" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>

      {hideHeader && (
        <div
          onMouseDown={startDrag}
          style={{
            position: "absolute",
            top: 0,
            height: 10,
            width: "100%",
            cursor: "move",
          }}
        />
      )}

      <div
        onMouseDown={startResize("right")}
        style={{
          position: "absolute",
          right: 0,
          top: headerH,
          width: 10,
          height: "100%",
          cursor: "ew-resize",
        }}
      />
      <div
        onMouseDown={startResize("bottom")}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 10,
          cursor: "ns-resize",
        }}
      />
      <div
        onMouseDown={startResize("corner")}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 16,
          height: 16,
          cursor: "nwse-resize",
        }}
      />
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
