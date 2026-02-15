import React, { useMemo } from "react";

export default function GraphicDisplay({ tank }) {
  const title = tank?.title ?? "Graphic Display";
  const timeUnit = tank?.timeUnit ?? "seconds";
  const windowSize = tank?.window ?? 60;
  const sampleMs = tank?.sampleMs ?? 1000;

  const yMin = Number.isFinite(tank?.yMin) ? tank.yMin : 0;
  const yMax = Number.isFinite(tank?.yMax) ? tank.yMax : 100;
  const yUnits = tank?.yUnits ?? "";

  const graphStyle = tank?.graphStyle ?? "line";

  // ✅ grid divisions (professional defaults)
  const yDivs = Number.isFinite(tank?.yDivs) ? Math.max(2, tank.yDivs) : 10;
  const xDivs = Number.isFinite(tank?.xDivs) ? Math.max(2, tank.xDivs) : 12;

  // minor subdivisions between majors (SCADA look)
  const yMinor = Number.isFinite(tank?.yMinor) ? Math.max(1, tank.yMinor) : 2;
  const xMinor = Number.isFinite(tank?.xMinor) ? Math.max(1, tank.xMinor) : 2;

  const styleBadge = (() => {
    if (graphStyle === "line") return "LINE";
    if (graphStyle === "area") return "AREA";
    if (graphStyle === "bar") return "BAR";
    if (graphStyle === "step") return "STEP";
    return "LINE";
  })();

  // ✅ derived Y ticks (labels)
  const yTicks = useMemo(() => {
    const min = Number(yMin);
    const max = Number(yMax);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) {
      return [];
    }
    const step = (max - min) / yDivs;
    const arr = [];
    for (let i = 0; i <= yDivs; i++) arr.push(min + step * i);
    return arr;
  }, [yMin, yMax, yDivs]);

  // ✅ background grid (major + minor) using layered gradients
  const gridBackground = useMemo(() => {
    // major grid size in px
    const majorX = Math.max(24, Math.round(520 / xDivs));
    const majorY = Math.max(20, Math.round(260 / yDivs));

    // minor grid size in px (split majors)
    const minorX = Math.max(8, Math.round(majorX / (xMinor + 1)));
    const minorY = Math.max(8, Math.round(majorY / (yMinor + 1)));

    return {
      backgroundImage: `
        linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px),
        linear-gradient(to right, rgba(0,0,0,0.085) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.085) 1px, transparent 1px)
      `,
      backgroundSize: `
        ${minorX}px ${minorY}px,
        ${minorX}px ${minorY}px,
        ${majorX}px ${majorY}px,
        ${majorX}px ${majorY}px
      `,
      backgroundPosition: `0 0, 0 0, 0 0, 0 0`,
    };
  }, [xDivs, yDivs, xMinor, yMinor]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #cfcfcf",
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "none", // ✅ passive so dragging works
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* HEADER — COMPACT */}
      <div
        style={{
          padding: "6px 10px",
          borderBottom: "1px solid #e6e6e6",
          background: "linear-gradient(180deg, #ffffff 0%, #f4f4f4 100%)",
          flex: "0 0 auto",
          minWidth: 0,
        }}
      >
        {/* TOP ROW */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: "#111",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontWeight: 800,
              border: "1px solid #ddd",
              borderRadius: 999,
              padding: "2px 8px",
              background: "#fff",
              color: "#333",
              flex: "0 0 auto",
            }}
          >
            {styleBadge}
          </div>
        </div>

        {/* SECOND ROW */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#444",
            fontSize: 11,
            marginTop: 4,
            minWidth: 0,
            flexWrap: "wrap",
          }}
        >
          <span>
            Time: <b>{timeUnit}</b>
          </span>
          <span>•</span>
          <span>
            Sample: <b>{sampleMs} ms</b>
          </span>
          <span>•</span>
          <span>
            Window: <b>{windowSize}</b>
          </span>
          <span>•</span>
          <span>
            Y: <b>{yMin}</b> → <b>{yMax}</b> {yUnits ? `(${yUnits})` : ""}
          </span>

          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              style={{
                border: "1px solid #bfe6c8",
                background: "linear-gradient(180deg,#bff2c7,#6fdc89)",
                color: "#0b3b18",
                fontWeight: 800,
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 11,
              }}
            >
              RECORD
            </button>
            <button
              style={{
                border: "1px solid #ddd",
                background: "#f3f3f3",
                color: "#555",
                fontWeight: 700,
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 11,
              }}
            >
              EXPORT
            </button>
            <button
              style={{
                border: "1px solid #ddd",
                background: "#f3f3f3",
                color: "#555",
                fontWeight: 700,
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 11,
              }}
            >
              CLEAR
            </button>
          </div>
        </div>
      </div>

      {/* BODY / CHART AREA */}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0,
          padding: 12,
          display: "flex",
        }}
      >
        <div
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            minHeight: 0,
            width: "100%",
            height: "100%",
            borderRadius: 10,
            background: "linear-gradient(180deg,#ffffff,#fbfbfb)",
            position: "relative",
            overflow: "hidden",
            border: "1px solid #d9d9d9",
          }}
        >
          {/* ✅ upgraded grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              ...gridBackground,
              pointerEvents: "none",
            }}
          />

          {/* ✅ Y ticks (left side), evenly spaced */}
          {yTicks.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 8,
                top: 8,
                bottom: 8,
                width: 64,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {[...yTicks].reverse().map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "#555",
                    background: "rgba(255,255,255,0.78)",
                    padding: "1px 6px",
                    borderRadius: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  {Number(v).toFixed(2)}
                </div>
              ))}
            </div>
          )}

          {/* placeholder “style” visual */}
          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              fontSize: 11,
              fontWeight: 900,
              color: "#666",
              background: "rgba(255,255,255,0.75)",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {styleBadge} MODE
          </div>
        </div>
      </div>
    </div>
  );
}
