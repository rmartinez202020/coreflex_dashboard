// src/components/indicators/counterModal/useDraggableModal.js
import React from "react";

export default function useDraggableModal() {
  const modalRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const dragRef = React.useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    pointerId: null,
  });

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  const centerModal = React.useCallback(() => {
    requestAnimationFrame(() => {
      const el = modalRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 10;

      const x = clamp(
        (vw - rect.width) / 2,
        margin,
        Math.max(margin, vw - rect.width - margin)
      );

      const y = clamp(
        (vh - rect.height) / 2,
        margin,
        Math.max(margin, vh - rect.height - margin)
      );

      setPos({ x, y });
    });
  }, []);

  const onHeaderPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const el = modalRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const current = pos ?? { x: rect.left, y: rect.top };

    dragRef.current.dragging = true;
    setIsDragging(true);

    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.originX = current.x;
    dragRef.current.originY = current.y;
    dragRef.current.pointerId = e.pointerId;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onHeaderPointerMove = (e) => {
    if (!dragRef.current.dragging) return;

    const el = modalRef.current;
    if (!el) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 10;

    const maxX = Math.max(margin, vw - rect.width - margin);
    const maxY = Math.max(margin, vh - rect.height - margin);

    const nextX = clamp(dragRef.current.originX + dx, margin, maxX);
    const nextY = clamp(dragRef.current.originY + dy, margin, maxY);

    setPos({ x: nextX, y: nextY });
  };

  const onHeaderPointerUp = (e) => {
    if (!dragRef.current.dragging) return;

    dragRef.current.dragging = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(dragRef.current.pointerId);
    } catch {}

    dragRef.current.pointerId = null;
  };

  const resetPosition = () => {
    setPos(null);
    setIsDragging(false);
  };

  return {
    modalRef,
    pos,
    isDragging,
    centerModal,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp,
    resetPosition,
    setPos,
  };
}
