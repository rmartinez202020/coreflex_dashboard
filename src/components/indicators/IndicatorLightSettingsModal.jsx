import React from "react";

export default function IndicatorLightSettingsModal({
  open,
  tank,
  onClose,
  onSave,
}) {
  if (!open || !tank) return null;

  const initial = {
    shapeStyle: tank.properties?.shapeStyle ?? "circle",
    colorOff: tank.properties?.colorOff ?? "#9ca3af",
    colorOn: tank.properties?.colorOn ?? "#22c55e",
  };

  const [shapeStyle, setShapeStyle] = React.useState(initial.shapeStyle);
  const [colorOff, setColorOff] = React.useState(initial.colorOff);
  const [colorOn, setColorOn] = React.useState(initial.colorOn);

  React.useEffect(() => {
    setShapeStyle(initial.shapeStyle);
    setColorOff(initial.colorOff);
    setColorOn(initial.colorOn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tank?.id]);

  const isCircle = shapeStyle !== "square";

  const handleApply = () => {
    onSave?.({
      ...tank,
      properties: {
        ...(tank.properties || {}),
        shapeStyle,
        colorOff,
        colorOn,
      },
    });
    onClose?.();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: 420,
          background: "white",
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "10px 12px",
            background: "#0f172a",
            color: "white",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>Indicator Light</div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              fontSize: 16,
              cursor: "pointer",
              fontWeight: 900,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 14, display: "grid", gap: 14 }}>
          {/* Preview */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 12,
              background: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", gap: 18 }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: isCircle ? "50%" : 6,
                    background: colorOff,
                    border: "2px solid rgba(0,0,0,0.65)",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25)",
                  }}
                />
                <div style={{ fontSize: 11, marginTop: 6, color: "#334155" }}>
                  OFF
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: isCircle ? "50%" : 6,
                    background: colorOn,
                    border: "2px solid rgba(0,0,0,0.65)",
                    boxShadow: "0 0 10px rgba(0,0,0,0.15)",
                  }}
                />
                <div style={{ fontSize: 11, marginTop: 6, color: "#334155" }}>
                  ON
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#475569" }}>
              Double-click to edit
            </div>
          </div>

          {/* Shape */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              Shape
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="shapeStyle"
                  value="circle"
                  checked={shapeStyle === "circle"}
                  onChange={() => setShapeStyle("circle")}
                />
                Circle
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="shapeStyle"
                  value="square"
                  checked={shapeStyle === "square"}
                  onChange={() => setShapeStyle("square")}
                />
                Square
              </label>
            </div>
          </div>

          {/* Colors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                OFF Color
              </div>
              <input
                type="color"
                value={colorOff}
                onChange={(e) => setColorOff(e.target.value)}
                style={{ width: "100%", height: 38, cursor: "pointer" }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                ON Color
              </div>
              <input
                type="color"
                value={colorOn}
                onChange={(e) => setColorOn(e.target.value)}
                style={{ width: "100%", height: 38, cursor: "pointer" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 12,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
