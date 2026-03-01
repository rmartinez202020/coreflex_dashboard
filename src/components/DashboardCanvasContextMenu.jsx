// src/components/DashboardCanvasContextMenu.jsx
import React from "react";
import { SCALE_MIN, SCALE_MAX } from "../config/scaleLimits";

const SCALE_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function DashboardCanvasContextMenu({
  show,
  x = 0,
  y = 0,
  hasTarget,
  hasClipboard,
  onCopy,
  onBringToFront,
  onSendToBack,
  onDelete,
  onPaste,
  onClose,

  // ✅ OPTIONAL: if provided, canvas-right-click can show only Undo/Redo
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) {
  const [openScale, setOpenScale] = React.useState(false);
  const closeTimerRef = React.useRef(null);

  React.useEffect(() => {
    if (!show) setOpenScale(false);
  }, [show]);

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!show) return null;

  // ✅ clamp menu to viewport so it doesn't go off-screen
  const vw = typeof window !== "undefined" ? window.innerWidth : 99999;
  const vh = typeof window !== "undefined" ? window.innerHeight : 99999;

  const MENU_W = 180;
  const MENU_H_EST = 260;

  const left = Math.min(Math.max(8, x), vw - MENU_W - 8);
  const top = Math.min(Math.max(8, y), vh - MENU_H_EST - 8);

  const openScaleNow = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpenScale(true);
  };

  const closeScaleSoon = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpenScale(false), 140);
  };

  // helper to collect target ids:
  const collectTargetIds = () => {
    const selEls = Array.from(
      document.querySelectorAll(".draggable-item.selected")
    );
    const selIds = selEls
      .map((el) => el.getAttribute("data-widget-id"))
      .filter(Boolean);

    if (selIds.length) return selIds;

    const ex = Math.round(x);
    const ey = Math.round(y);

    let el = document.elementFromPoint(ex, ey);
    let attempts = 0;
    while (el && attempts < 10) {
      if (el.classList && el.classList.contains("draggable-item")) break;
      el = el.parentElement;
      attempts++;
    }

    if (el && el.getAttribute) {
      const id = el.getAttribute("data-widget-id");
      if (id) return [id];
    }

    return [];
  };

  const applyScale = (scaleValue) => {
    const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Number(scaleValue) || 1));
    const ids = collectTargetIds();

    if (!ids.length) {
      onClose?.();
      return;
    }

    window.dispatchEvent(
      new CustomEvent("coreflex-scale", {
        detail: { ids, scale: s },
      })
    );

    onClose?.();
  };

  const baseStyle = {
    position: "fixed",
    left,
    top,
    zIndex: 999999,
    background: "white",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 10,
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
    padding: 6,
    minWidth: MENU_W,
  };

  const itemStyle = {
    padding: "8px 10px",
    fontSize: 13,
    borderRadius: 8,
    cursor: "pointer",
    userSelect: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  };

  const disabledItemStyle = {
    ...itemStyle,
    opacity: 0.45,
    pointerEvents: "none",
  };

  const sepStyle = {
    height: 1,
    background: "rgba(0,0,0,0.06)",
    margin: "6px 0",
  };

  // =====================================================
  // ✅ EMPTY CANVAS MENU: ONLY Undo / Redo
  // =====================================================
  if (!hasTarget) {
    const hasUndoRedo = typeof onUndo === "function" || typeof onRedo === "function";

    return (
      <div
        style={baseStyle}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={canUndo ? itemStyle : disabledItemStyle}
          onClick={() => {
            if (!canUndo) return;
            onUndo?.();
            onClose?.();
          }}
        >
          <span>Undo</span>
        </div>

        <div
          style={canRedo ? itemStyle : disabledItemStyle}
          onClick={() => {
            if (!canRedo) return;
            onRedo?.();
            onClose?.();
          }}
        >
          <span>Redo</span>
        </div>

        {/* If undo/redo not wired yet, at least give a close */}
        {!hasUndoRedo && <div style={sepStyle} />}

        <div style={itemStyle} onClick={() => onClose?.()}>
          <span>Close</span>
        </div>
      </div>
    );
  }

  // =====================================================
  // ✅ TARGET MENU (widget right-click): full menu
  // =====================================================
  return (
    <div
      style={baseStyle}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Copy */}
      <div
        style={itemStyle}
        onClick={() => {
          onCopy?.();
          onClose?.();
        }}
      >
        <span>Copy</span>
      </div>

      {/* Scale submenu */}
      <div
        style={{ ...itemStyle, position: "relative" }}
        onMouseEnter={openScaleNow}
        onMouseLeave={closeScaleSoon}
        onClick={(e) => {
          e.stopPropagation();
          setOpenScale((v) => !v);
        }}
      >
        <span>Scale</span>
        <span style={{ opacity: 0.7 }}>▸</span>

        {openScale && (
          <>
            <div
              style={{
                position: "absolute",
                left: "100%",
                top: -6,
                width: 14,
                height: 42,
                background: "transparent",
              }}
              onMouseEnter={openScaleNow}
              onMouseLeave={closeScaleSoon}
            />

            <div
              style={{
                position: "absolute",
                left: "100%",
                top: -6,
                marginLeft: 14,
                zIndex: 1000000,
                background: "white",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 8,
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                padding: 6,
                minWidth: 120,
              }}
              onMouseEnter={openScaleNow}
              onMouseLeave={closeScaleSoon}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {SCALE_PRESETS.map((s) => (
                <div
                  key={s}
                  style={{
                    padding: "8px 8px",
                    cursor: "pointer",
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                  onClick={() => applyScale(s)}
                  onMouseEnter={openScaleNow}
                >
                  {s}x
                </div>
              ))}

              <div style={{ height: 6 }} />
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  padding: "4px 4px",
                  textAlign: "center",
                }}
              >
                Range: {SCALE_MIN} — {SCALE_MAX}x
              </div>
            </div>
          </>
        )}
      </div>

      <div style={sepStyle} />

      {/* Bring / Send */}
      <div
        style={itemStyle}
        onClick={() => {
          onBringToFront?.();
          onClose?.();
        }}
      >
        <span>Bring to Front</span>
      </div>

      <div
        style={itemStyle}
        onClick={() => {
          onSendToBack?.();
          onClose?.();
        }}
      >
        <span>Send to Back</span>
      </div>

      <div style={sepStyle} />

      {/* Delete */}
      <div
        style={{ ...itemStyle, color: "#dc2626" }}
        onClick={() => {
          onDelete?.();
          onClose?.();
        }}
      >
        <span>Delete</span>
      </div>

      <div style={sepStyle} />

      {/* Paste (optional) */}
      <div
        style={{
          ...itemStyle,
          opacity: hasClipboard ? 1 : 0.5,
          pointerEvents: hasClipboard ? "auto" : "none",
        }}
        onClick={() => {
          if (!hasClipboard) return;
          onPaste?.();
          onClose?.();
        }}
      >
        <span>Paste</span>
      </div>

      <div style={itemStyle} onClick={() => onClose?.()}>
        <span>Close</span>
      </div>
    </div>
  );
}