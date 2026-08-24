// src/components/DashboardDrawingLayer.jsx
import React from "react";

const DRAW_OBJECT_SHAPES = new Set([
  "drawLine",
  "drawArrow",
  "drawRectangle",
  "drawCircle",
  "drawPencil",
]);

function createId(prefix = "draw") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function DashboardDrawingLayer({
  isPlay = false,
  drawTool = "select",
  drawColor = "#000000",
  drawWidth = 2,
  droppedTanks,
  setDroppedTanks,
  selectedIds,
  setSelectedIds,
  setSelectedTank,
  hideContextMenu,
}) {
  const [draft, setDraft] = React.useState(null);

  const isDrawingToolActive =
    !isPlay &&
    ["line", "arrow", "rectangle", "circle", "pencil"].includes(drawTool);

  const getPoint = React.useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, e.clientY - rect.top)),
    };
  }, []);

  const getNextZ = React.useCallback(() => {
    return (
      Math.max(
        0,
        ...(Array.isArray(droppedTanks)
          ? droppedTanks.map((t) => Number(t?.z ?? t?.zIndex ?? 0) || 0)
          : [0])
      ) + 1
    );
  }, [droppedTanks]);

  const beginDrawing = React.useCallback(
    (e) => {
      if (!isDrawingToolActive || e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();
      hideContextMenu?.();

      const p = getPoint(e);

      setSelectedIds?.([]);
      setSelectedTank?.(null);

      setDraft({
        tool: drawTool,
        startX: p.x,
        startY: p.y,
        endX: p.x,
        endY: p.y,
        color: drawColor || "#000000",
        width: Math.max(1, Number(drawWidth) || 1),
        points: drawTool === "pencil" ? [p] : [],
      });
    },
    [
      isDrawingToolActive,
      drawTool,
      drawColor,
      drawWidth,
      hideContextMenu,
      getPoint,
      setSelectedIds,
      setSelectedTank,
    ]
  );

  const continueDrawing = React.useCallback(
    (e) => {
      if (!draft) return;

      e.preventDefault();
      e.stopPropagation();

      const p = getPoint(e);

      setDraft((prev) => {
        if (!prev) return prev;

        if (prev.tool === "pencil") {
          const points = Array.isArray(prev.points) ? prev.points : [];
          const last = points[points.length - 1];
          const dx = last ? p.x - last.x : 999;
          const dy = last ? p.y - last.y : 999;

          if (dx * dx + dy * dy < 2.25) {
            return { ...prev, endX: p.x, endY: p.y };
          }

          return {
            ...prev,
            endX: p.x,
            endY: p.y,
            points: [...points, p],
          };
        }

        return { ...prev, endX: p.x, endY: p.y };
      });
    },
    [draft, getPoint]
  );

  const finishDrawing = React.useCallback(
    (e) => {
      if (!draft) return;

      e.preventDefault();
      e.stopPropagation();

      const p = getPoint(e);

      const finalDraft = {
        ...draft,
        endX: p.x,
        endY: p.y,
        points:
          draft.tool === "pencil"
            ? [...(Array.isArray(draft.points) ? draft.points : []), p]
            : draft.points,
      };

      setDraft(null);

      const dx = finalDraft.endX - finalDraft.startX;
      const dy = finalDraft.endY - finalDraft.startY;
      const distance = Math.hypot(dx, dy);

      if (finalDraft.tool !== "pencil" && distance < 3) return;
      if (
        finalDraft.tool === "pencil" &&
        (!finalDraft.points || finalDraft.points.length < 2)
      ) {
        return;
      }

      const z = getNextZ();
      const id = createId(`draw_${finalDraft.tool}`);
      let newDrawing = null;

      if (finalDraft.tool === "line" || finalDraft.tool === "arrow") {
        const minX = Math.min(finalDraft.startX, finalDraft.endX);
        const minY = Math.min(finalDraft.startY, finalDraft.endY);
        const maxX = Math.max(finalDraft.startX, finalDraft.endX);
        const maxY = Math.max(finalDraft.startY, finalDraft.endY);

        newDrawing = {
          id,
          shape: finalDraft.tool === "arrow" ? "drawArrow" : "drawLine",
          type: finalDraft.tool === "arrow" ? "drawArrow" : "drawLine",
          x: minX,
          y: minY,
          left: minX,
          top: minY,
          w: Math.max(1, maxX - minX),
          h: Math.max(1, maxY - minY),
          width: Math.max(1, maxX - minX),
          height: Math.max(1, maxY - minY),
          x1: finalDraft.startX,
          y1: finalDraft.startY,
          x2: finalDraft.endX,
          y2: finalDraft.endY,
          stroke: finalDraft.color,
          strokeColor: finalDraft.color,
          strokeWidth: finalDraft.width,
          fill: "transparent",
          fillColor: "transparent",
          z,
          zIndex: z,
          properties: {
            stroke: finalDraft.color,
            strokeColor: finalDraft.color,
            strokeWidth: finalDraft.width,
            fill: "transparent",
            fillColor: "transparent",
          },
        };
      }

      if (finalDraft.tool === "rectangle" || finalDraft.tool === "circle") {
        const x = Math.min(finalDraft.startX, finalDraft.endX);
        const y = Math.min(finalDraft.startY, finalDraft.endY);
        const w = Math.max(1, Math.abs(finalDraft.endX - finalDraft.startX));
        const h = Math.max(1, Math.abs(finalDraft.endY - finalDraft.startY));

        newDrawing = {
          id,
          shape:
            finalDraft.tool === "circle" ? "drawCircle" : "drawRectangle",
          type:
            finalDraft.tool === "circle" ? "drawCircle" : "drawRectangle",
          x,
          y,
          left: x,
          top: y,
          w,
          h,
          width: w,
          height: h,
          stroke: finalDraft.color,
          strokeColor: finalDraft.color,
          strokeWidth: finalDraft.width,
          fill: "transparent",
          fillColor: "transparent",
          z,
          zIndex: z,
          properties: {
            stroke: finalDraft.color,
            strokeColor: finalDraft.color,
            strokeWidth: finalDraft.width,
            fill: "transparent",
            fillColor: "transparent",
          },
        };
      }

      if (finalDraft.tool === "pencil") {
        const points = Array.isArray(finalDraft.points)
          ? finalDraft.points
          : [];

        const xs = points.map((q) => q.x);
        const ys = points.map((q) => q.y);

        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        newDrawing = {
          id,
          shape: "drawPencil",
          type: "drawPencil",
          x: minX,
          y: minY,
          left: minX,
          top: minY,
          w: Math.max(1, maxX - minX),
          h: Math.max(1, maxY - minY),
          width: Math.max(1, maxX - minX),
          height: Math.max(1, maxY - minY),
          points,
          stroke: finalDraft.color,
          strokeColor: finalDraft.color,
          strokeWidth: finalDraft.width,
          fill: "transparent",
          fillColor: "transparent",
          z,
          zIndex: z,
          properties: {
            stroke: finalDraft.color,
            strokeColor: finalDraft.color,
            strokeWidth: finalDraft.width,
            fill: "transparent",
            fillColor: "transparent",
          },
        };
      }

      if (!newDrawing) return;

      setDroppedTanks((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        newDrawing,
      ]);

      setSelectedIds?.([newDrawing.id]);
      setSelectedTank?.(newDrawing);
    },
    [
      draft,
      getPoint,
      getNextZ,
      setDroppedTanks,
      setSelectedIds,
      setSelectedTank,
    ]
  );

  React.useEffect(() => {
    if (isPlay || drawTool === "select") {
      setDraft(null);
    }
  }, [isPlay, drawTool]);


  return (
    <svg
      aria-label="Dashboard drawing layer"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        zIndex: 90000,
        cursor: isDrawingToolActive ? "crosshair" : "default",
        pointerEvents: isDrawingToolActive ? "auto" : "none",
      }}
      onMouseDown={beginDrawing}
      onMouseMove={continueDrawing}
      onMouseUp={finishDrawing}
      onMouseLeave={(e) => {
        if (draft) finishDrawing(e);
      }}
    >
      <defs>
        <marker
          id="coreflex-draw-arrow-head"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="context-stroke" />
        </marker>
      </defs>


      {draft &&
        (() => {
          const stroke = draft.color || "#000000";
          const strokeWidth = Math.max(1, Number(draft.width) || 1);

          if (draft.tool === "line" || draft.tool === "arrow") {
            return (
              <line
                x1={draft.startX}
                y1={draft.startY}
                x2={draft.endX}
                y2={draft.endY}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                markerEnd={
                  draft.tool === "arrow"
                    ? "url(#coreflex-draw-arrow-head)"
                    : undefined
                }
                pointerEvents="none"
              />
            );
          }

          if (draft.tool === "rectangle" || draft.tool === "circle") {
            const x = Math.min(draft.startX, draft.endX);
            const y = Math.min(draft.startY, draft.endY);
            const w = Math.abs(draft.endX - draft.startX);
            const h = Math.abs(draft.endY - draft.startY);

            if (draft.tool === "circle") {
              return (
                <ellipse
                  cx={x + w / 2}
                  cy={y + h / 2}
                  rx={w / 2}
                  ry={h / 2}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  pointerEvents="none"
                />
              );
            }

            return (
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                pointerEvents="none"
              />
            );
          }

          if (draft.tool === "pencil") {
            const points = (draft.points || [])
              .map((q) => `${q.x},${q.y}`)
              .join(" ");

            return (
              <polyline
                points={points}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
              />
            );
          }

          return null;
        })()}
    </svg>
  );
}