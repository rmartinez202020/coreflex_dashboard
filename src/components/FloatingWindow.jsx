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

  // ✅ NEW:
  // - "workspace" (default): clamp inside dashed workspace / main
  // - "viewport": clamp inside visible browser viewport (for portals to body)
  boundsMode = "workspace",
}) {
  const [pos, setPos] = useState(position);
  const [sz, setSz] = useState(size);

  const dragStartRef = useRef(null);
  const resizeStartRef = useRef(null);

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
  // Compute bounds
  // ----------------------------------------------------
  const getBounds = (sizeOverride) => {
    const curSize = sizeOverride || sz;

    // ✅ Viewport mode: pure screen clamp (best for createPortal(document.body))
    if (boundsMode === "viewport") {
      return {
        minX: 0,
        minY: 0,
        maxX: Math.max(0, window.innerWidth - curSize.width),
        maxY: Math.max(0, window.innerHeight - curSize.height),
        ctx: { mode: "viewport" },
      };
    }

    // ✅ Workspace mode (default): clamp inside dashed workspace in <main>
    const mainEl = document.querySelector("main");
    const mainRect = mainEl?.getBoundingClientRect?.();

    // fallback: viewport
    if (!mainEl || !mainRect) {
      return {
        minX: 0,
        minY: 0,
        maxX: Math.max(0, window.innerWidth - curSize.width),
        maxY: Math.max(0, window.innerHeight - curSize.height),
        ctx: { mode: "viewport" },
      };
    }

    const workspaceEl = findWorkspaceEl(mainEl) || mainEl;
    const wsRect = workspaceEl.getBoundingClientRect();

    // translate workspace rect to main-relative coordinates
    const wsLeftInMain = wsRect.left - mainRect.left;
    const wsTopInMain = wsRect.top - mainRect.top;

    const minX = Math.max(0, wsLeftInMain);
    const minY = Math.max(0, wsTopInMain);

    const maxX = Math.max(minX, wsLeftInMain + wsRect.width - curSize.width);
    const maxY = Math.max(minY, wsTopInMain + wsRect.height - curSize.height);

    return {
      minX,
      minY,
      maxX,
      maxY,
      ctx: { mode: "main" },
    };
  };

  // ----------------------------------------------------
  // Drag
  // ----------------------------------------------------
  const startDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const bounds = getBounds(sz);

    dragStartRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPos: { ...pos },
      bounds,
    };

    const onMove = (ev) => {
      const s = dragStartRef.current;
      if (!s) return;

      const dx = ev.clientX - s.startClientX;
      const dy = ev.clientY - s.startClientY;

      const boundsNow = getBounds(sz);

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

    resizeStartRef.current = {
      edge,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startSize: { ...sz },
      startPos: { ...pos },
    };

    const minW = 520;
    const minH = 260;

    const onMove = (ev) => {
      const s = resizeStartRef.current;
      if (!s) return;

      const dx = ev.clientX - s.startClientX;
      const dy = ev.clientY - s.startClientY;

      let nextW = s.startSize.width;
      let nextH = s.startSize.height;

      if (s.edge === "right" || s.edge === "corner") nextW = clampMin(nextW + dx, minW);
      if (s.edge === "bottom" || s.edge === "corner") nextH = clampMin(nextH + dy, minH);

      // clamp size so window stays within bounds from its current position
      const bounds = getBounds({ width: nextW, height: nextH });

      // max allowed width/height based on current position
      const maxAllowedW = Math.max(minW, bounds.maxX - pos.x + nextW); // safe
      const maxAllowedH = Math.max(minH, bounds.maxY - pos.y + nextH); // safe

      // in viewport mode the bounds are exact; in workspace mode, also exact
      // so enforce: pos.x + w <= bounds.maxX + w? better to compute directly:
      const hardMaxW = Math.max(minW, (bounds.maxX - pos.x) + nextW);
      const hardMaxH = Math.max(minH, (bounds.maxY - pos.y) + nextH);

      nextW = Math.min(nextW, hardMaxW, maxAllowedW);
      nextH = Math.min(nextH, hardMaxH, maxAllowedH);

      setSz({ width: nextW, height: nextH });

      // clamp position after resize
      const boundsNow = getBounds({ width: nextW, height: nextH });
      const clampedPos = {
        x: clamp(pos.x, boundsNow.minX, boundsNow.maxX),
        y: clamp(pos.y, boundsNow.minY, boundsNow.maxY),
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
            zIndex: 20,
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
          height: `calc(100% - ${headerH}px)`,
          cursor: "ew-resize",
          zIndex: 10,
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
          zIndex: 10,
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
          zIndex: 11,
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
