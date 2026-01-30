import React from "react";

/**
 * DraggableStatusTextBox
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar): small preview + label, sets dataTransfer "shape"
 * 2) Canvas mode (Dashboard): renders professional status text box using `tank`
 */
export default function DraggableStatusTextBox({
  // Canvas mode
  tank,

  // Palette mode
  label = "Status Text Box",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "statusTextBox",
    w: 220,
    h: 60,
    text: "STATUS",
    value: "OK",
    bg: "#ffffff",
    border: "#d1d5db",
  };

  // =========================
  // ✅ CANVAS MODE (real widget)
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    const text =
      tank.text ?? tank.properties?.text ?? tank.properties?.label ?? payload.text;

    const value =
      tank.value ?? tank.properties?.value ?? tank.properties?.status ?? payload.value;

    const bg = tank.bg ?? tank.properties?.bg ?? payload.bg;
    const border = tank.border ?? tank.properties?.border ?? payload.border;

    // Optional: color code common statuses
    const valStr = String(value ?? "").toUpperCase();
    const accent =
      valStr === "OK" || valStr === "RUN" || valStr === "ON"
        ? "#22c55e"
        : valStr === "WARN" || valStr === "WARNING"
        ? "#f59e0b"
        : valStr === "ALARM" || valStr === "FAULT" || valStr === "TRIP"
        ? "#ef4444"
        : "#0f172a";

    return (
      <div
        style={{
          width: w,
          height: h,
          background: bg,
          border: `2px solid ${border}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          userSelect: "none",
        }}
        title={`${text}: ${value}`}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 1.2,
            color: "#111",
            textTransform: "uppercase",
          }}
        >
          {text}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 10px ${accent}55`,
            }}
          />
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 1,
              color: accent,
              textTransform: "uppercase",
            }}
          >
            {String(value ?? "")}
          </div>
        </div>
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
        e.dataTransfer.setData("shape", "statusTextBox");
        e.dataTransfer.setData("text/plain", "statusTextBox");
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag Status Text Box"
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
        📝
      </span>
      <span>{label}</span>
    </div>
  );
}
