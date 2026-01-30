import React from "react";

/**
 * DraggableStatusTextBox
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar): small preview + label, sets dataTransfer "shape"
 * 2) Canvas mode (Dashboard): renders professional status text box using `tank`
 *
 * ✅ FIX (Platform Creation 49):
 * - Remove the "OK" text on the right side (keep the green dot only)
 * - Also remove the default payload value "OK" so new drops don't show it anywhere
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

    // ✅ was "OK" — remove default label
    value: "",

    bg: "#ffffff",
    border: "#d1d5db",
  };

  // =========================
  // ✅ CANVAS MODE (real widget)
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    // ✅ Prefer OFF/ON config coming from StatusTextSettingsModal
    const offText =
      tank.properties?.offText ??
      tank.offText ??
      ""; // optional
    const onText =
      tank.properties?.onText ??
      tank.onText ??
      ""; // optional

    // ✅ Legacy fallback
    const legacyText =
      tank.text ??
      tank.properties?.text ??
      tank.properties?.label ??
      payload.text;

    // ✅ Decide what to display:
    // - If renderer later supports tag-driven truthy/falsey, it can swap between on/off.
    // - For now, default to OFF text if present, else legacyText.
    const displayText = (offText || legacyText || "").toString();

    // NOTE: we intentionally do NOT render the "value" string anymore.
    const value =
      tank.value ??
      tank.properties?.value ??
      tank.properties?.status ??
      payload.value;

    const bg = tank.bg ?? tank.properties?.bg ?? tank.properties?.bgColor ?? payload.bg;
    const border =
      tank.border ??
      tank.properties?.border ??
      tank.properties?.borderColor ??
      payload.border;

    // Optional: color code common statuses (dot only)
    const valStr = String(value ?? "").toUpperCase();
    const accent =
      valStr === "OK" || valStr === "RUN" || valStr === "ON"
        ? "#22c55e"
        : valStr === "WARN" || valStr === "WARNING"
        ? "#f59e0b"
        : valStr === "ALARM" || valStr === "FAULT" || valStr === "TRIP"
        ? "#ef4444"
        : "#22c55e"; // ✅ default green dot (since we removed OK text)

    // ✅ Styling from modal if present
    const fontSize = tank.properties?.fontSize ?? 18;
    const fontWeight = tank.properties?.fontWeight ?? 800;
    const textColor = tank.properties?.textColor ?? "#0f172a";
    const borderWidth = tank.properties?.borderWidth ?? 1;
    const paddingY = tank.properties?.paddingY ?? 10;
    const paddingX = tank.properties?.paddingX ?? 14;
    const textAlign = tank.properties?.textAlign ?? "center";
    const textTransform = tank.properties?.textTransform ?? "none";

    return (
      <div
        style={{
          width: w,
          height: h,
          background: bg,
          border: `${borderWidth}px solid ${border}`,
          borderRadius: 10,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${paddingY}px ${paddingX}px`,
          userSelect: "none",
        }}
        title={displayText}
      >
        <div
          style={{
            fontSize,
            fontWeight,
            color: textColor,
            textAlign,
            textTransform,
            width: "100%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {displayText}
        </div>

        {/* ✅ Right side: keep DOT only, remove "OK" text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: 12,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 10px ${accent}55`,
              flex: "0 0 10px",
            }}
          />
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
