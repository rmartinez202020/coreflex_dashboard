import React from "react";

/**
 * DraggableLedCircle
 * ✅ Dual mode:
 * - Palette mode (Sidebar)
 * - Canvas mode (Dashboard)
 *
 * ✅ Supports circle/square via tank.properties.shapeStyle
 * ✅ If bound tag exists: reads live value from sensorsData to drive ON/OFF
 */
export default function DraggableLedCircle({
  // Canvas mode
  tank,
  sensorsData,

  // Palette mode
  label = "Led Circle",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "ledCircle",
    w: 70,
    h: 90,
    status: "off",
    properties: {
      shapeStyle: "circle",
      colorOn: "#22c55e",
      colorOff: "#9ca3af",
      offText: "OFF",
      onText: "ON",

      // optional persisted snapshot
      value: 0,
    },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? payload.w;
    const h = tank.h ?? payload.h;

    const shapeStyle = tank.properties?.shapeStyle ?? payload.properties.shapeStyle;
    const colorOn = tank.properties?.colorOn ?? payload.properties.colorOn;
    const colorOff = tank.properties?.colorOff ?? payload.properties.colorOff;
    const textOn = tank.properties?.onText ?? "ON";
    const textOff = tank.properties?.offText ?? "OFF";

    const tagDeviceId = tank?.properties?.tag?.deviceId || "";
    const tagField = tank?.properties?.tag?.field || "";

    // ✅ live raw from sensorsData
    const liveRaw =
      tagDeviceId && tagField
        ? sensorsData?.latest?.[tagDeviceId]?.[tagField] ??
          sensorsData?.values?.[tagDeviceId]?.[tagField] ??
          sensorsData?.tags?.[tagDeviceId]?.[tagField]
        : undefined;

    const hasLive = liveRaw !== undefined && liveRaw !== null;

    const live01 = (() => {
      if (!hasLive) return null;

      const v = liveRaw;
      if (typeof v === "number") return v > 0 ? 1 : 0;
      if (typeof v === "boolean") return v ? 1 : 0;

      if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
        if (s === "0" || s === "false" || s === "off" || s === "no") return 0;

        const n = Number(s);
        if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
      }

      return v ? 1 : 0;
    })();

    // ✅ fallback (saved snapshot / legacy)
    const fallbackStatus =
      tank.status ?? tank.properties?.status ?? tank.properties?.value ?? "off";

    const fallbackIsOn =
      fallbackStatus === "on" || fallbackStatus === true || fallbackStatus === 1;

    const isOn = hasLive ? live01 === 1 : fallbackIsOn;

    const diameter = Math.min(w, h - 22);
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
          gap: 6,
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
