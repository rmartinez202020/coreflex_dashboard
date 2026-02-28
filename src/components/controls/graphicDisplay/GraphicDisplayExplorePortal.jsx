// src/components/controls/graphicDisplay/GraphicDisplayExplorePortal.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function GraphicDisplayExplorePortal({
  open = false,
  onClose = () => {},
  title = "Graphic Display",
  children,
  modalContent = null, // ✅ content rendered inside the modal
}) {
  // close on ESC
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // lock scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return <>{children}</>;

  const contentInsideModal = modalContent ?? children;

  return (
    <>
      {/* keep original widget behind the modal */}
      {children}

      {createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
          onMouseDown={(e) => {
            // click outside closes
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            style={{
              width: "min(1600px, 96vw)",
              height: "min(900px, 92vh)",
              background: "#fff",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 30px 90px rgba(0,0,0,0.45)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              minHeight: 0,
              position: "relative", // ✅ for optional overlays later
            }}
          >
            {/* Top bar */}
            <div
              style={{
                height: 44,
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 12px",
                background: "linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 13,
                  color: "#111827",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                }}
                title={title}
              >
                {title} — Explore
              </div>

              <div style={{ marginLeft: "auto" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                  title="Close (ESC)"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: "1 1 auto", minHeight: 0, minWidth: 0 }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  // ✅ Helps pointer math be stable for hover/drag
                  position: "relative",
                }}
              >
                {contentInsideModal}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}