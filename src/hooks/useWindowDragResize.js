// src/hooks/useWindowDragResize.js
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useWindowDragResize
 * - Centralized drag/resize + open/close for floating windows by key
 *
 * ✅ FIXES:
 * 1) Uses Pointer Events (more reliable)
 * 2) Disables text selection while dragging/resizing (prevents selecting sidebar/canvas/title)
 * 3) Keeps defaults frozen on first mount (prevents re-init)
 */
export default function useWindowDragResize(defaultsMap = {}) {
  const [, forceTick] = useState(0);
  const bump = () => forceTick((t) => t + 1);

  // ✅ Freeze defaults only once
  const defaultsRef = useRef(null);
  if (!defaultsRef.current) {
    const out = {};
    Object.entries(defaultsMap || {}).forEach(([key, cfg]) => {
      const d = typeof cfg === "function" ? cfg() : cfg || {};
      out[key] = {
        position: d.position || { x: 100, y: 100 },
        size: d.size || { width: 600, height: 400 },
        minSize: d.minSize || { width: 260, height: 180 },
        maxSize: d.maxSize || null,
        defaultCenter: Boolean(d.defaultCenter),
      };
    });
    defaultsRef.current = out;
  }

  const getDefaults = () => defaultsRef.current || {};

  const stateRef = useRef({
    windows: {}, // key -> { visible, position, size }
    dragging: null, // { key, pointerId, offsetX, offsetY }
    resizing: null, // { key, pointerId, startX, startY, startW, startH }
    // track original body styles to restore
    bodyLock: null,
  });

  // ✅ init windows ONCE
  useEffect(() => {
    const s = stateRef.current;
    const dmap = getDefaults();
    const next = {};

    Object.keys(dmap).forEach((key) => {
      const d = dmap[key];
      next[key] = {
        visible: false,
        position: { ...d.position },
        size: { ...d.size },
      };
    });

    s.windows = next;
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const clampSize = (key, size) => {
    const d = getDefaults()[key];
    if (!d) return size;

    const minW = d.minSize?.width ?? 200;
    const minH = d.minSize?.height ?? 150;

    let maxW = Infinity;
    let maxH = Infinity;

    if (d.maxSize?.width) maxW = Math.min(maxW, d.maxSize.width);
    if (d.maxSize?.height) maxH = Math.min(maxH, d.maxSize.height);

    // keep on-screen
    maxW = Math.min(maxW, window.innerWidth - 20);
    maxH = Math.min(maxH, window.innerHeight - 20);

    return {
      width: clamp(size.width, minW, maxW),
      height: clamp(size.height, minH, maxH),
    };
  };

  const clampPos = (key, pos, sizeOverride = null) => {
    const w = stateRef.current.windows[key];
    const size = sizeOverride || w?.size || { width: 600, height: 400 };

    const maxX = Math.max(0, window.innerWidth - size.width - 10);
    const maxY = Math.max(0, window.innerHeight - size.height - 10);

    return {
      x: clamp(pos.x, 10, maxX),
      y: clamp(pos.y, 10, maxY),
    };
  };

  // ✅ lock/unlock text selection while resizing/dragging
  const lockBodySelection = (cursor = null) => {
    const s = stateRef.current;
    if (s.bodyLock) return;

    s.bodyLock = {
      userSelect: document.body.style.userSelect,
      webkitUserSelect: document.body.style.webkitUserSelect,
      cursor: document.body.style.cursor,
    };

    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    if (cursor) document.body.style.cursor = cursor;
  };

  const unlockBodySelection = () => {
    const s = stateRef.current;
    if (!s.bodyLock) return;

    document.body.style.userSelect = s.bodyLock.userSelect || "";
    document.body.style.webkitUserSelect = s.bodyLock.webkitUserSelect || "";
    document.body.style.cursor = s.bodyLock.cursor || "";
    s.bodyLock = null;
  };

  const isOpen = useCallback((key) => {
    return Boolean(stateRef.current.windows?.[key]?.visible);
  }, []);

  const openWindow = useCallback((key, opts = {}) => {
    const s = stateRef.current;
    const w = s.windows?.[key];
    const d = getDefaults()[key];
    if (!w || !d) return;

    const wantCenter = opts.center ?? d.defaultCenter ?? false;
    const size = clampSize(key, opts.size || w.size || d.size);

    let position = w.position || d.position;
    if (wantCenter) {
      position = {
        x: Math.round((window.innerWidth - size.width) / 2),
        y: Math.round((window.innerHeight - size.height) / 2),
      };
    }
    position = clampPos(key, position, size);

    s.windows[key] = { visible: true, position, size };
    bump();
  }, []);

  const closeWindow = useCallback((key) => {
    const s = stateRef.current;
    const w = s.windows?.[key];
    if (!w) return;
    s.windows[key] = { ...w, visible: false };
    bump();
  }, []);

  const toggleWindow = useCallback(
    (key, visible) => {
      const now = isOpen(key);
      const next = typeof visible === "boolean" ? visible : !now;
      if (next) openWindow(key);
      else closeWindow(key);
    },
    [closeWindow, isOpen, openWindow]
  );

  const setWindowPos = useCallback((key, pos) => {
    const s = stateRef.current;
    const w = s.windows?.[key];
    if (!w) return;
    s.windows[key] = { ...w, position: clampPos(key, pos) };
    bump();
  }, []);

  const setWindowSize = useCallback((key, size) => {
    const s = stateRef.current;
    const w = s.windows?.[key];
    if (!w) return;

    const nextSize = clampSize(key, size);
    const nextPos = clampPos(key, w.position, nextSize);

    s.windows[key] = { ...w, size: nextSize, position: nextPos };
    bump();
  }, []);

  const onStartDragWindow = useCallback((key, e) => {
    e.stopPropagation();
    e.preventDefault();

    const s = stateRef.current;
    const w = s.windows?.[key];
    if (!w) return;

    // pointer capture prevents weirdness when cursor leaves the header
    try {
      e.currentTarget?.setPointerCapture?.(e.pointerId);
    } catch {}

    lockBodySelection("grabbing");

    s.dragging = {
      key,
      pointerId: e.pointerId,
      offsetX: e.clientX - w.position.x,
      offsetY: e.clientY - w.position.y,
    };
  }, []);

  const onStartResizeWindow = useCallback((key, e) => {
    e.stopPropagation();
    e.preventDefault();

    const s = stateRef.current;
    const w = s.windows?.[key];
    if (!w) return;

    try {
      e.currentTarget?.setPointerCapture?.(e.pointerId);
    } catch {}

    lockBodySelection("nwse-resize");

    s.resizing = {
      key,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startW: w.size.width,
      startH: w.size.height,
    };
  }, []);

  // ✅ global POINTER handlers
  useEffect(() => {
    const onMove = (e) => {
      const s = stateRef.current;

      if (s.dragging?.key) {
        const key = s.dragging.key;
        const w = s.windows[key];
        if (!w) return;

        const nextPos = clampPos(key, {
          x: e.clientX - s.dragging.offsetX,
          y: e.clientY - s.dragging.offsetY,
        });

        s.windows[key] = { ...w, position: nextPos };
        bump();
      }

      if (s.resizing?.key) {
        const key = s.resizing.key;
        const w = s.windows[key];
        if (!w) return;

        const dx = e.clientX - s.resizing.startX;
        const dy = e.clientY - s.resizing.startY;

        const nextSize = clampSize(key, {
          width: s.resizing.startW + dx,
          height: s.resizing.startH + dy,
        });

        const nextPos = clampPos(key, w.position, nextSize);

        s.windows[key] = { ...w, size: nextSize, position: nextPos };
        bump();
      }
    };

    const onUp = () => {
      const s = stateRef.current;
      if (s.dragging || s.resizing) {
        s.dragging = null;
        s.resizing = null;
        unlockBodySelection();
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const getWindowProps = useCallback(
    (key, extra = {}) => {
      const w = stateRef.current.windows?.[key];

      const base = {
        visible: Boolean(w?.visible),
        open: Boolean(w?.visible),
        isOpen: Boolean(w?.visible),
        position: w?.position || { x: 100, y: 100 },
        size: w?.size || { width: 600, height: 400 },
        onClose: () => closeWindow(key),

        // ✅ send controlled handlers down
        onStartDragWindow: (e) => onStartDragWindow(key, e),
        onStartResizeWindow: (e) => onStartResizeWindow(key, e),

        ...extra,
      };

      return base;
    },
    [closeWindow, onStartDragWindow, onStartResizeWindow]
  );

  const closeAll = useCallback(
    (keys = null) => {
      const list = Array.isArray(keys)
        ? keys
        : Object.keys(stateRef.current.windows || {});
      list.forEach((k) => closeWindow(k));
    },
    [closeWindow]
  );

  return {
    isOpen,
    openWindow,
    closeWindow,
    toggleWindow,
    closeAll,
    setWindowPos,
    setWindowSize,
    getWindowProps,
  };
}
