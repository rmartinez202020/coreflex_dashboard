import React from "react";

/**
 * DraggableStatusTextBox
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar)
 * 2) Canvas mode (Dashboard)
 *
 * FINAL FIX:
 * - Remove green dot completely
 * - Text ONLY widget
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
    value: "",
    bg: "#ffffff",
    border: "#d1d5db",
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    // OFF/ON text logic
    const offText = tank.properties?.offText ?? "";
    const onText = tank.properties?.onText ?? "";
    const legacyText =
      tank.text ??
      tank.properties?.text ??
      tank.properties?.label ??
      payload.text;

    // Default to OFF text visually
    const displayText = (offText || legacyText || "").toString();

    // Styles from settings modal
    const bg = tank.properties?.bgColor ?? payload.bg;
    const border = tank.properties?.borderColor ?? payload.border;
    const borderWidth = tank.properties?.borderWidth ?? 1;
    const fontSize = tank.properties?.fontSize ?? 18;
    const fontWeight = tank.properties?.fontWeight ?? 800;
    const textColor = tank.properties?.textColor ?? "#0f172a";
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
          justifyContent: "center", // ✅ CENTER TEXT ONLY
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
