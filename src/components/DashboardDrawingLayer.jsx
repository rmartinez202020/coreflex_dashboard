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
  const [dragState, setDragState] = React.useState(null);

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

  const drawings = (Array.isArray(droppedTanks) ? droppedTanks : []).filter(
    (t) => DRAW_OBJECT_SHAPES.has(t?.shape)
  );

  const handleSelectDragMove = React.useCallback(
    (e) => {
      if (!dragState || isPlay || drawTool !== "select") return;

      e.preventDefault();
      e.stopPropagation();

      const rect = e.currentTarget.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      const dx = pointerX - dragState.startPointerX;
      const dy = pointerY - dragState.startPointerY;

      setDroppedTanks((prev) =>
        (Array.isArray(prev) ? prev : []).map((item) => {
          if (item?.id !== dragState.id) return item;

          const next = {
            ...item,
            x: dragState.original.x + dx,
            y: dragState.original.y + dy,
            left: dragState.original.left + dx,
            top: dragState.original.top + dy,
          };

          if (item.shape === "drawLine" || item.shape === "drawArrow") {
            next.x1 = dragState.original.x1 + dx;
            next.y1 = dragState.original.y1 + dy;
            next.x2 = dragState.original.x2 + dx;
            next.y2 = dragState.original.y2 + dy;
          }

          if (item.shape === "drawPencil") {
            next.points = dragState.original.points.map((p) => ({
              x: p.x + dx,
              y: p.y + dy,
            }));
          }

          return next;
        })
      );
    },
    [dragState, isPlay, drawTool, setDroppedTanks]
  );

  const finishSelectDrag = React.useCallback(
    (e) => {
      if (!dragState) return;
      e.preventDefault();
      e.stopPropagation();
      setDragState(null);
    },
    [dragState]
  );

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
        pointerEvents: isPlay ? "none" : "auto",
      }}
      onMouseDown={beginDrawing}
      onMouseMove={(e) => {
        if (dragState) {
          handleSelectDragMove(e);
          return;
        }
        continueDrawing(e);
      }}
      onMouseUp={(e) => {
        if (dragState) {
          finishSelectDrag(e);
          return;
        }
        finishDrawing(e);
      }}
      onMouseLeave={(e) => {
        if (dragState) {
          finishSelectDrag(e);
          return;
        }
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

      {drawings.map((t) => {
        const selected = !isPlay && selectedIds?.includes?.(t.id);
        const stroke =
          t?.strokeColor ||
          t?.stroke ||
          t?.properties?.strokeColor ||
          t?.properties?.stroke ||
          "#000000";

        const strokeWidth = Math.max(
          1,
          Number(t?.strokeWidth ?? t?.properties?.strokeWidth ?? 2) || 2
        );

        const selectableProps = {
          stroke,
          strokeWidth,
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          vectorEffect: "non-scaling-stroke",
          style: {
            pointerEvents:
              !isPlay && drawTool === "select" ? "stroke" : "none",
            cursor:
              !isPlay && drawTool === "select" ? "pointer" : "default",
          },
          onMouseDown: (e) => {
            if (isPlay || drawTool !== "select") return;
            e.preventDefault();
            e.stopPropagation();

            const root = e.currentTarget.ownerSVGElement;
            if (!root) return;

            const rect = root.getBoundingClientRect();
            const pointerX = e.clientX - rect.left;
            const pointerY = e.clientY - rect.top;

            setSelectedIds?.([t.id]);
            setSelectedTank?.(t);
            hideContextMenu?.();

            setDragState({
              id: t.id,
              shape: t.shape,
              startPointerX: pointerX,
              startPointerY: pointerY,
              original: {
                x: Number(t.x ?? t.left) || 0,
                y: Number(t.y ?? t.top) || 0,
                left: Number(t.left ?? t.x) || 0,
                top: Number(t.top ?? t.y) || 0,
                x1: Number(t.x1) || 0,
                y1: Number(t.y1) || 0,
                x2: Number(t.x2) || 0,
                y2: Number(t.y2) || 0,
                points: Array.isArray(t.points)
                  ? t.points.map((p) => ({
                      x: Number(p?.x) || 0,
                      y: Number(p?.y) || 0,
                    }))
                  : [],
              },
            });
          },
        };

        if (t.shape === "drawLine" || t.shape === "drawArrow") {
          return (
            <g key={t.id} style={{ pointerEvents: "auto" }}>
              {selected && (
                <line
                  x1={Number(t.x1) || 0}
                  y1={Number(t.y1) || 0}
                  x2={Number(t.x2) || 0}
                  y2={Number(t.y2) || 0}
                  stroke="#2563eb"
                  strokeWidth={strokeWidth + 5}
                  opacity="0.25"
                  pointerEvents="none"
                />
              )}

              <line
                {...selectableProps}
                x1={Number(t.x1) || 0}
                y1={Number(t.y1) || 0}
                x2={Number(t.x2) || 0}
                y2={Number(t.y2) || 0}
                markerEnd={
                  t.shape === "drawArrow"
                    ? "url(#coreflex-draw-arrow-head)"
                    : undefined
                }
              />
            </g>
          );
        }

        if (t.shape === "drawRectangle") {
          const x = Number(t.x ?? t.left) || 0;
          const y = Number(t.y ?? t.top) || 0;
          const w = Math.max(1, Number(t.w ?? t.width) || 1);
          const h = Math.max(1, Number(t.h ?? t.height) || 1);

          return (
            <g key={t.id} style={{ pointerEvents: "auto" }}>
              <rect {...selectableProps} x={x} y={y} width={w} height={h} />
              {selected && (
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={w + 4}
                  height={h + 4}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1"
                  strokeDasharray="5 4"
                  pointerEvents="none"
                />
              )}
            </g>
          );
        }

        if (t.shape === "drawCircle") {
          const x = Number(t.x ?? t.left) || 0;
          const y = Number(t.y ?? t.top) || 0;
          const w = Math.max(1, Number(t.w ?? t.width) || 1);
          const h = Math.max(1, Number(t.h ?? t.height) || 1);

          return (
            <g key={t.id} style={{ pointerEvents: "auto" }}>
              <ellipse
                {...selectableProps}
                cx={x + w / 2}
                cy={y + h / 2}
                rx={w / 2}
                ry={h / 2}
              />
              {selected && (
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={w + 4}
                  height={h + 4}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1"
                  strokeDasharray="5 4"
                  pointerEvents="none"
                />
              )}
            </g>
          );
        }

        if (t.shape === "drawPencil") {
          const points = (Array.isArray(t.points) ? t.points : [])
            .map((q) => `${Number(q?.x) || 0},${Number(q?.y) || 0}`)
            .join(" ");

          return (
            <g key={t.id} style={{ pointerEvents: "auto" }}>
              <polyline {...selectableProps} points={points} />
              {selected && (
                <rect
                  x={(Number(t.x ?? t.left) || 0) - 2}
                  y={(Number(t.y ?? t.top) || 0) - 2}
                  width={Math.max(1, Number(t.w ?? t.width) || 1) + 4}
                  height={Math.max(1, Number(t.h ?? t.height) || 1) + 4}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1"
                  strokeDasharray="5 4"
                  pointerEvents="none"
                />
              )}
            </g>
          );
        }

        return null;
      })}

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