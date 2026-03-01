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
}) {
  const [openScale, setOpenScale] = React.useState(false);

  React.useEffect(() => {
    if (!show) setOpenScale(false);
  }, [show]);

  if (!show) return null;

  // helper to collect target ids:
  const collectTargetIds = () => {
    // 1) find selected draggable items in DOM
    const selEls = Array.from(document.querySelectorAll(".draggable-item.selected"));
    const selIds = selEls
      .map((el) => el.getAttribute("data-widget-id"))
      .filter(Boolean);

    if (selIds.length) return selIds;

    // 2) if nothing selected, try to find element under the menu point
    // x,y are relative to viewport as passed from App — elementFromPoint expects viewport coords
    const ex = Math.round(x);
    const ey = Math.round(y);

    let el = document.elementFromPoint(ex, ey);
    let attempts = 0;
    while (el && attempts < 8) {
      if (el.classList && el.classList.contains("draggable-item")) break;
      el = el.parentElement;
      attempts++;
    }

    if (el && el.getAttribute) {
      const id = el.getAttribute("data-widget-id");
      if (id) return [id];
    }

    // none found
    return [];
  };

  const applyScale = (scaleValue) => {
    const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Number(scaleValue) || 1));
    const ids = collectTargetIds();

    if (!ids.length) {
      // nothing to scale — just close menu and return
      onClose?.();
      return;
    }

    // dispatch global event
    const ev = new CustomEvent("coreflex-scale", {
      detail: {
        ids,
        scale: s,
      },
    });
    window.dispatchEvent(ev);

    // close menu after action
    onClose?.();
  };

  const baseStyle = {
    position: "absolute",
    left: x,
    top: y,
    zIndex: 999999,
    background: "white",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 10,
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
    padding: 6,
    minWidth: 180,
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

  const sepStyle = { height: 1, background: "rgba(0,0,0,0.06)", margin: "6px 0" };

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
        onMouseEnter={() => setOpenScale(true)}
        onMouseLeave={() => setOpenScale(false)}
      >
        <span>Scale</span>
        <span style={{ opacity: 0.7 }}>▸</span>

        {openScale && (
          <div
            style={{
              position: "absolute",
              left: "100%",
              top: 0,
              marginLeft: 8,
              zIndex: 1000000,
              background: "white",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 8,
              boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              padding: 6,
              minWidth: 120,
            }}
            onMouseDown={(e) => e.stopPropagation()}
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