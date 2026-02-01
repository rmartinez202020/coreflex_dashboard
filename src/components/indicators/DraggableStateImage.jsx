import React from "react";

/**
 * DraggableStateImage
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar)
 * 2) Canvas mode (Dashboard)
 *
 * ✅ State behavior:
 * - Default is OFF (shows OFF image)
 * - When tag becomes ON, shows ON image
 *
 * ✅ IMPORTANT:
 * - We DO NOT open settings modal from inside this component anymore.
 *   DashboardCanvas handles double-click (same pattern as StatusTextBox).
 */
export default function DraggableStateImage({
  // Canvas mode
  tank,

  // Palette mode
  label = "State Image",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "stateImage",
    w: 160,
    h: 160,

    // default state
    isOn: false,

    // images saved in properties
    offImage: "",
    onImage: "",
    imageFit: "contain", // contain|cover

    // tag binding
    tag: { deviceId: "", field: "" },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    // ✅ ON/OFF state (default OFF)
    const isOn =
      tank.isOn ??
      tank.on ??
      tank.active ??
      tank.properties?.isOn ??
      tank.properties?.on ??
      tank.properties?.active ??
      payload.isOn;

    // ✅ images (prefer properties)
    const offImage =
      tank.properties?.offImage ?? tank.offImage ?? payload.offImage;

    const onImage = tank.properties?.onImage ?? tank.onImage ?? payload.onImage;

    const imageFit =
      tank.properties?.imageFit ?? tank.imageFit ?? payload.imageFit;

    // ✅ choose image (OFF is default)
    const imgSrc = isOn ? onImage : offImage;

    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 12,
          border: "1px dashed rgba(148,163,184,0.6)",
          background: "rgba(2,6,23,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          overflow: "hidden",
          pointerEvents: "none", // ✅ IMPORTANT: let DraggableDroppedTank handle clicks/doubleclick
        }}
        title="Double click to setup"
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={isOn ? "ON" : "OFF"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: imageFit,
              display: "block",
            }}
            draggable={false}
          />
        ) : (
          <div style={{ textAlign: "center", color: "#64748b" }}>
            <div
              style={{
                width: Math.max(20, Math.round(Math.min(w, h) * 0.12)),
                height: Math.max(20, Math.round(Math.min(w, h) * 0.12)),
                borderRadius: 999,
                background: "rgba(148,163,184,0.35)",
                margin: "0 auto 10px auto",
                boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
              }}
            />
            <div style={{ fontWeight: 1000, letterSpacing: 1 }}>
              STATE IMAGE
            </div>
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>
              {isOn ? "ON" : "OFF"}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // ✅ PALETTE MODE
  // =========================
  return (
    <div
      className="cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("shape", "stateImage");
        e.dataTransfer.setData("text/plain", "stateImage");
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag State Image"
      role="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: "rgba(148,163,184,0.35)",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 0 10px rgba(148,163,184,0.25)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
