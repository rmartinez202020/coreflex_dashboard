// src/hooks/useWindowDragResize.js
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useWindowDragResize
 * - Centralized drag/resize + open/close for floating windows by key
 *
 * IMPORTANT FIX:
 * - In App.jsx you pass an object literal to this hook.
 *   That object is recreated every render, which previously caused this hook
 *   to re-initialize windows and force visible=false (so windows never appear).
 *
 * - This version freezes defaults on first mount and initializes windows ONCE.
 *
 * ✅ NEW (this patch):
 * - Adds "cascade" positioning so new windows don't overlap and don't "jump"
 * - Centers ONLY when explicitly requested (opts.center === true)
 * - Fixes the "open at X then move to center" by computing final position BEFORE visible=true
 */
export default function useWindowDragResize(defaultsMap = {}) {
  // force rerender when internal ref changes
  const [, forceTick] = useState(0);
  const bump = () => forceTick((t) => t + 1);

  // ✅ Freeze defaults only once (prevents re-init on every App render)
  const defaultsRef = useRef(null);

  if (!defaultsRef.current) {
    const out = {};
    Object.entries(defaultsMap || {}).forEach(([key, cfg]) => {
      const d = typeof cfg === "function" ? cfg() : cfg || {};
      out[key] = {
        position: d.position || { x: 100, y: 100 },
        size: d.size || { width: 600, height: 400 },
        minSize: d.minSize || { width: 600, height: 400 },
        maxSize: d.maxSize || null,

        // keep it, but we will NOT auto-center unless explicitly requested
        defaultCenter: Boolean(d.defaultCenter),
      };
    });
    defaultsRef.current = out;
  }

  const getDefaults = () => defaultsRef.current || {};

  const stateRef = useRef({
    windows: {}, // key -> { visible, position, size }
    dragging: null, // { key, offsetX, offsetY }
    resizing: null, // { key }
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

  const isOpen = useCallback((key) => {
    return Boolean(stateRef.current.windows?.[key]?.visible);
  }, []);

  // ✅ helpers for cascade layout
  const getOpenKeys = () =>
    Object.entries(stateRef.current.windows || {})
      .filter(([, w]) => w?.visible)
      .map(([k]) => k);

  const computeCascadePos = (key, basePos, size) => {
    // Offset each additional open window so they "stack" nicely
    const openCount = getOpenKeys().length;

    const STEP_X = 28;
    const STEP_Y = 22;

    const pos = {
      x: (basePos?.x ?? 120) + openCount * STEP_X,
      y: (basePos?.y ?? 100) + openCount * STEP_Y,
    };

    return clampPos(key, pos, size);
  };

  const openWindow = useCallback((key, opts = {}) => {
    const s = stateRef.current;
    const w = s.windows?.[key];
    const d = getDefaults()[key];
    if (!w || !d) return;

    // Size first
    const size = clampSize(key, opts.size || w.size || d.size);

    // IMPORTANT:
    // - Only center if explicitly requested (opts.center === true)
    // - Otherwise cascade by default (opts.cascade defaults to true)
    const wantCenter = opts.center === true;
    const wantCascade = opts.cascade !== false; // default true

    let position;

    if (wantCenter) {
      position = {
        x: Math.round((window.innerWidth - size.width) / 2),
        y: Math.round((window.innerHeight - size.height) / 2),
      };
      position = clampPos(key, position, size);
    } else if (opts.position) {
      position = clampPos(key, opts.position, size);
    } else if (wantCascade) {
      // cascade from default position (or last position if already known)
      const basePos = d.position || w.position;
      position = computeCascadePos(key, basePos, size);
    } else {
      // fallback to last known / default
      position = clampPos(key, w.position || d.position, size);
    }

    // ✅ Set everything in one shot BEFORE visible=true to prevent "jump"
    s.windows[key] = {
      visible: true,
      position,
      size,
    };

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
    s.windows[key] = {
      ...w,
      position: clampPos(key, pos),
    };
    bump();
  }, []);

  const setWindowSize = useCallback((key, size) => {
    const s = stateRef.current;
    const w = s.windows?.[key];
    if (!w) return;

    const nextSize = clampSize(key, size);
    const nextPos = clampPos(key, w.position, nextSize);

    s.windows[key] = {
      ...w,
      size: nextSize,
      position: nextPos,
    };
    bump();
  }, []);

  const onStartDragWindow = useCallback((key, e) => {
    e.stopPropagation();
    const s = stateRef.current;
    const w = s.windows?.[key];
    if (!w) return;

    s.dragging = {
      key,
      offsetX: e.clientX - w.position.x,
      offsetY: e.clientY - w.position.y,
    };
  }, []);

  const onStartResizeWindow = useCallback((key, e) => {
    if (e) e.stopPropagation();
    const s = stateRef.current;
    if (!s.windows?.[key]) return;
    s.resizing = { key };
  }, []);

  // global mouse handlers
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

        const nextSize = clampSize(key, {
          width: e.clientX - w.position.x,
          height: e.clientY - w.position.y,
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
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const getWindowProps = useCallback(
    (key, extra = {}) => {
      const w = stateRef.current.windows?.[key];

      if (!w) {
        return {
          visible: false,
          open: false,
          isOpen: false,
          position: { x: 100, y: 100 },
          size: { width: 600, height: 400 },
          onClose: () => closeWindow(key),
          onStartDragWindow: (e) => onStartDragWindow(key, e),
          onStartResizeWindow: (e) => onStartResizeWindow(key, e),
          ...extra,
        };
      }

      return {
        visible: w.visible,
        open: w.visible,
        isOpen: w.visible,
        position: w.position,
        size: w.size,
        onClose: () => closeWindow(key),
        onStartDragWindow: (e) => onStartDragWindow(key, e),
        onStartResizeWindow: (e) => onStartResizeWindow(key, e),
        ...extra,
      };
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
