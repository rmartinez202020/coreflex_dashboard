import React from "react";

/**
 * DraggableStateImage
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar): small preview + label, sets dataTransfer "shape"
 * 2) Canvas mode (Dashboard): renders image that switches by state using `tank`
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
    w: 140,
    h: 140,
    imgOn: "",
    imgOff: "",
    state: false,
  };

  // =========================
  // ✅ CANVAS MODE (real widget)
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    const state =
      tank.state ??
      tank.on ??
      tank.isOn ??
      tank.properties?.state ??
      tank.properties?.on ??
      tank.properties?.isOn ??
      payload.state;

    const imgOn =
      tank.imgOn ?? tank.properties?.imgOn ?? tank.properties?.onSrc ?? payload.imgOn;

    const imgOff =
      tank.imgOff ??
      tank.properties?.imgOff ??
      tank.properties?.offSrc ??
      payload.imgOff;

    const isOn = state === true || state === "on" || state === 1;

    const src = isOn ? imgOn : imgOff;

    // ✅ If no images set yet, show a nice placeholder
    if (!src) {
      return (
        <div
          style={{
            width: w,
            height: h,
            border: "2px dashed rgba(0,0,0,0.35)",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            gap: 6,
          }}
          title="No images set yet (double-click to configure later)"
        >
          <div style={{ fontSize: 34, lineHeight: 1 }}>{isOn ? "🟢" : "⚪"}</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: 1,
            }}
          >
            STATE IMAGE
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {isOn ? "ON" : "OFF"}
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          width: w,
          height: h,
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.25)",
          background: "white",
        }}
        title={isOn ? "State: ON" : "State: OFF"}
      >
        <img
          src={src}
          alt={isOn ? "On state" : "Off state"}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }

  // =========================
  // ✅ PALETTE MODE (Sidebar)
  // =========================
  return (
    <div
      className="cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        // ✅ Use your app's standard drag payload
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
          width: 16,
          height: 16,
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.25)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          flex: "0 0 16px",
        }}
      >
        🖼️
      </span>
      <span>{label}</span>
    </div>
  );
}
