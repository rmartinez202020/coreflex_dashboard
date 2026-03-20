// src/components/DashboardCanvasContextMenu.jsx
import React from "react";
import { SCALE_MIN, SCALE_MAX } from "../config/scaleLimits";

// ✅ Updated presets (removed 1x, adjusted multipliers)
const SCALE_PRESETS = [0.75, 0.8, 0.85, 0.9, 1.1, 1.15, 1.2, 1.25];

export default function DashboardCanvasContextMenu({
  show,
  x = 0,
  y = 0,
  hasTarget,
  hasClipboard,
  onCopy,
  onBringToFront,
  onSendToBack,
  onDelete, // ✅ will be called with (ids)
  onPaste,
  onClose,

  // ✅ OPTIONAL: if provided, canvas-right-click can show only Undo/Redo
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) {
  const [openScale, setOpenScale] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState(null);
  const closeTimerRef = React.useRef(null);

  React.useEffect(() => {
    if (!show) {
      setOpenScale(false);
      setHoveredItem(null);
    }
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
    transition: "background 0.12s ease, color 0.12s ease",
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

  const getHoverStyle = (key, extra = {}) => ({
    ...extra,
    ...(hoveredItem === key
      ? {
          background: "rgba(59, 130, 246, 0.18)", // light blue hover
        }
      : null),
  });

  // =====================================================
  // ✅ EMPTY CANVAS MENU: ONLY Undo / Redo
  // =====================================================
  if (!hasTarget) {
    const hasUndoRedo =
      typeof onUndo === "function" || typeof onRedo === "function";

    return (
      <div
        style={baseStyle}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={canUndo ? getHoverStyle("undo", itemStyle) : disabledItemStyle}
          onMouseEnter={() => canUndo && setHoveredItem("undo")}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => {
            if (!canUndo) return;
            onUndo?.();
            onClose?.();
          }}
        >
          <span>Undo</span>
        </div>

        <div
          style={canRedo ? getHoverStyle("redo", itemStyle) : disabledItemStyle}
          onMouseEnter={() => canRedo && setHoveredItem("redo")}
          onMouseLeave={() => setHoveredItem(null)}
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

        <div
          style={getHoverStyle("close-empty", itemStyle)}
          onMouseEnter={() => setHoveredItem("close-empty")}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => onClose?.()}
        >
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
        style={getHoverStyle("copy", itemStyle)}
        onMouseEnter={() => setHoveredItem("copy")}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => {
          onCopy?.();
          onClose?.();
        }}
      >
        <span>Copy</span>
      </div>

      {/* Scale submenu */}
      <div
        style={getHoverStyle("scale", { ...itemStyle, position: "relative" })}
        onMouseEnter={() => {
          setHoveredItem("scale");
          openScaleNow();
        }}
        onMouseLeave={() => {
          setHoveredItem(null);
          closeScaleSoon();
        }}
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
              {SCALE_PRESETS.map((s) => {
                const key = `scale-${s}`;
                return (
                  <div
                    key={s}
                    style={getHoverStyle(key, {
                      padding: "8px 8px",
                      cursor: "pointer",
                      borderRadius: 6,
                      fontSize: 13,
                      transition: "background 0.12s ease, color 0.12s ease",
                    })}
                    onClick={() => applyScale(s)}
                    onMouseEnter={() => {
                      openScaleNow();
                      setHoveredItem(key);
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {s}x
                  </div>
                );
              })}

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
        style={getHoverStyle("bring-front", itemStyle)}
        onMouseEnter={() => setHoveredItem("bring-front")}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => {
          onBringToFront?.();
          onClose?.();
        }}
      >
        <span>Bring to Front</span>
      </div>

      <div
        style={getHoverStyle("send-back", itemStyle)}
        onMouseEnter={() => setHoveredItem("send-back")}
        onMouseLeave={() => setHoveredItem(null)}
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
        style={getHoverStyle("delete", {
          ...itemStyle,
          color: "#dc2626",
        })}
        onMouseEnter={() => setHoveredItem("delete")}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => {
          // ✅ IMPORTANT:
          // pass the ids so the caller can delete UI + backend rows
          // (counters, control bindings, graphic display bindings, etc.)
          const ids = collectTargetIds();
          onDelete?.(ids);
          onClose?.();
        }}
      >
        <span>Delete</span>
      </div>

      <div style={sepStyle} />

      {/* Paste (optional) */}
      <div
        style={
          hasClipboard
            ? getHoverStyle("paste", itemStyle)
            : {
                ...itemStyle,
                opacity: 0.5,
                pointerEvents: "none",
              }
        }
        onMouseEnter={() => hasClipboard && setHoveredItem("paste")}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => {
          if (!hasClipboard) return;
          onPaste?.();
          onClose?.();
        }}
      >
        <span>Paste</span>
      </div>

      <div
        style={getHoverStyle("close", itemStyle)}
        onMouseEnter={() => setHoveredItem("close")}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => onClose?.()}
      >
        <span>Close</span>
      </div>
    </div>
  );
}