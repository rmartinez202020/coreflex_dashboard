// src/components/DashboardCanvasContextMenu.jsx
import React from "react";

// ✅ Small helper for menu button styling (local to this component)
function ctxBtnStyle(extra = {}) {
  return {
    width: "100%",
    textAlign: "left",
    padding: "8px 10px",
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#0f172a",
    ...extra,
  };
}

/**
 * DashboardCanvasContextMenu
 * UI-only component
 *
 * Props:
 * - show
 * - x, y
 * - hasTarget
 * - hasClipboard
 *
 * Handlers:
 * - onCopy
 * - onBringToFront
 * - onSendToBack
 * - onDelete
 * - onPaste
 * - onClose
 */
export default function DashboardCanvasContextMenu({
  show,
  x,
  y,
  hasTarget,
  hasClipboard,

  onCopy,
  onBringToFront,
  onSendToBack,
  onDelete,
  onPaste,
  onClose,
}) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 2000000,
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        padding: 6,
        minWidth: 190,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ✅ Item-only actions */}
      {hasTarget && (
        <>
          <button
            type="button"
            style={ctxBtnStyle()}
            onClick={() => {
              onCopy?.();
              onClose?.();
            }}
          >
            Copy
          </button>

          <div style={{ height: 1, background: "#e2e8f0", margin: "6px 0" }} />

          <button
            type="button"
            style={ctxBtnStyle()}
            onClick={() => {
              onBringToFront?.();
              onClose?.();
            }}
          >
            Bring to Front
          </button>

          <button
            type="button"
            style={ctxBtnStyle()}
            onClick={() => {
              onSendToBack?.();
              onClose?.();
            }}
          >
            Send to Back
          </button>

          <button
            type="button"
            style={ctxBtnStyle({ color: "#b91c1c" })}
            onClick={() => {
              onDelete?.();
              onClose?.();
            }}
          >
            Delete
          </button>

          <div style={{ height: 1, background: "#e2e8f0", margin: "6px 0" }} />
        </>
      )}

      {/* ✅ Dashboard-level actions */}
      <button
        type="button"
        disabled={!hasClipboard}
        style={ctxBtnStyle({
          opacity: hasClipboard ? 1 : 0.45,
          cursor: hasClipboard ? "pointer" : "not-allowed",
        })}
        onClick={() => {
          if (!hasClipboard) return;
          onPaste?.();
          onClose?.();
        }}
      >
        Paste
      </button>

      <div style={{ height: 1, background: "#e2e8f0", margin: "6px 0" }} />

      <button
        type="button"
        style={ctxBtnStyle()}
        onClick={() => onClose?.()}
      >
        Close
      </button>
    </div>
  );
}
