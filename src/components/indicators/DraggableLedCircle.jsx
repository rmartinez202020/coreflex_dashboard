import React from "react";

/**
 * DraggableLedCircle
 * ✅ Dual mode:
 * - Palette mode (Sidebar)
 * - Canvas mode (Dashboard)
 *
 * ✅ Supports circle/square via tank.properties.shapeStyle
 * ✅ Reads LIVE tag value (tank.properties.tag.deviceId + field) from sensorsData
 * ✅ LED turns ON/OFF automatically based on DI value (0/1)
 */
export default function DraggableLedCircle({
  // Canvas mode
  tank,
  sensorsData, // ✅ NEW (must be passed from DashboardCanvas)

  // Palette mode
  label = "Led Circle",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "ledCircle",
    w: 70,
    h: 90, // ⬅️ taller to allow text
    status: "off",
    properties: {
      shapeStyle: "circle",
      colorOn: "#22c55e",
      colorOff: "#9ca3af",
      offText: "OFF",
      onText: "ON",
      // tag: { deviceId, field } // ✅ set by settings modal when Apply
    },
  };

  // =========================
  // ✅ Helpers: read live tag + normalize to 0/1
  // =========================
  function readTagValue(sd, deviceId, field) {
    if (!sd || !deviceId || !field) return undefined;

    const v1 = sd?.latest?.[deviceId]?.[field];
    if (v1 !== undefined) return v1;

    const v2 = sd?.values?.[deviceId]?.[field];
    if (v2 !== undefined) return v2;

    const v3 = sd?.tags?.[deviceId]?.[field];
    if (v3 !== undefined) return v3;

    return undefined;
  }

  function to01(v) {
    if (v === undefined || v === null) return null;

    if (typeof v === "boolean") return v ? 1 : 0;

    if (typeof v === "number") return v > 0 ? 1 : 0;

    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
      if (s === "0" || s === "false" || s === "off" || s === "no") return 0;

      const n = Number(s);
      if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
    }

    return v ? 1 : 0;
  }

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? payload.w;
    const h = tank.h ?? payload.h;

    // ✅ prefer LIVE tag value if bound
    const deviceId = String(tank.properties?.tag?.deviceId || "").trim();
    const field = String(tank.properties?.tag?.field || "").trim();

    const liveRaw = readTagValue(sensorsData, deviceId, field);
    const liveBit = to01(liveRaw);
    const hasLive = liveBit !== null;

    // ✅ fallback to legacy status if no live data / no tag selected
    const legacyStatus =
      tank.status ??
      tank.properties?.status ??
      tank.properties?.value ??
      "off";

    const legacyOn =
      legacyStatus === "on" ||
      legacyStatus === true ||
      legacyStatus === 1 ||
      legacyStatus === "1";

    const isOn = hasLive ? liveBit === 1 : legacyOn;

    const shapeStyle =
      tank.properties?.shapeStyle ?? payload.properties.shapeStyle;

    const colorOn = tank.properties?.colorOn ?? payload.properties.colorOn;
    const colorOff = tank.properties?.colorOff ?? payload.properties.colorOff;

    const textOn = tank.properties?.onText ?? "ON";
    const textOff = tank.properties?.offText ?? "OFF";

    const diameter = Math.min(w, h - 22); // ⬅️ reserve space for text
    const isCircle = shapeStyle !== "square";

    return (
      <div
        style={{
          width: w,
          height: h,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6, // ⬅️ space between LED and text
          userSelect: "none",
        }}
      >
        {/* LED */}
        <div
          style={{
            width: diameter,
            height: diameter,
            borderRadius: isCircle ? "50%" : 6,
            background: isOn ? colorOn : colorOff,
            border: "2px solid rgba(0,0,0,0.65)",
            boxShadow: isOn
              ? "0 0 12px rgba(34,197,94,0.65)"
              : "inset 0 2px 6px rgba(0,0,0,0.35)",
            transition: "background 120ms ease, box-shadow 120ms ease",
          }}
        />

        {/* TEXT */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#111827",
            lineHeight: "14px",
            textAlign: "center",
            marginTop: 2,
          }}
        >
          {isOn ? textOn : textOff}
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
        e.dataTransfer.setData("shape", "ledCircle");
        e.dataTransfer.setData("text/plain", "ledCircle");
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag LED"
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
          borderRadius: "50%",
          background: payload.properties.colorOn,
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 0 8px rgba(34,197,94,0.5)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
