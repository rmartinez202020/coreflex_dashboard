// src/components/indicators/DraggableCounterInput.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ best-effort dashboard id getter (same idea as modal)
function resolveDashboardIdFromProps({ dashboardId, tank }) {
  const a = String(dashboardId || "").trim();
  if (a) return a;

  const b = String(tank?.dashboard_id || tank?.dashboardId || "").trim();
  if (b) return b;

  const c = String(
    tank?.properties?.dashboard_id || tank?.properties?.dashboardId || ""
  ).trim();
  if (c) return c;

  return null;
}

export default function DraggableCounterInput({
  // menu defaults
  variant = "menu", // "menu" | "canvas"
  label = "Counter Input (DI)",

  tank = null,
  value = 0,
  count,

  dashboardId,

  x,
  y,
  id,
  isSelected,
  onSelect,
  onStartDragObject,
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("shape", "counterInput");
    e.dataTransfer.setData("text/plain", "counterInput");
    e.dataTransfer.effectAllowed = "copy";
  };

  // ===============================
  // ✅ BACKEND RESET (real reset)
  // ===============================
  const [resetting, setResetting] = React.useState(false);

  // ✅ Local UI override so you SEE the reset immediately,
  // while still confirming backend actually reset.
  const [overrideCount, setOverrideCount] = React.useState(null);

  const widgetId = String(id || tank?.id || "").trim();

  // ✅ ALWAYS send dashboard_id string.
  // For main dashboard, backend normalizes "main" -> NULL (correct)
  const dash = resolveDashboardIdFromProps({ dashboardId, tank });
  const dashForBackend = String(dash || "main").trim();

  const confirmBackendRow = async () => {
    // Use your existing backend route
    const url = `${API_URL}/device-counters/by-widget/${encodeURIComponent(
      widgetId
    )}?dashboard_id=${encodeURIComponent(dashForBackend)}`;

    const res = await fetch(url, { headers: { ...getAuthHeaders() } });
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json: j };
  };

  const onResetClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (resetting) return;
    if (!widgetId) return;

    setResetting(true);

    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token");

      // 1) Call reset
      const res = await fetch(`${API_URL}/device-counters/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          widget_id: widgetId,
          dashboard_id: dashForBackend, // ✅ IMPORTANT
        }),
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("❌ Reset failed:", res.status, j);
        throw new Error(j?.detail || `Reset failed (${res.status})`);
      }

      // 2) Immediately show 0000 in UI (user feedback)
      setOverrideCount(0);

      // 3) Confirm backend row really reset (no guessing)
      const check = await confirmBackendRow();

      if (!check.ok) {
        console.error("❌ Confirm GET failed:", check.status, check.json);
        throw new Error(
          check?.json?.detail || `Confirm failed (${check.status})`
        );
      }

      const backendCount = Number(check?.json?.count ?? 0);
      if (Number.isFinite(backendCount) && backendCount !== 0) {
        console.warn(
          "⚠️ Backend count is not zero after reset. Row:",
          check.json
        );
      } else {
        console.log("✅ Reset confirmed. Row:", check.json);
      }

      // Let polling take over after confirmation
      setTimeout(() => setOverrideCount(null), 300);
    } catch (err) {
      console.error("❌ counter reset error:", err);
      alert(err?.message || "Failed to reset counter");
      // remove override if we failed
      setOverrideCount(null);
    } finally {
      setResetting(false);
    }
  };

  // ===============================
  // ✅ CANVAS VARIANT
  // ===============================
  if (variant === "canvas") {
    const props = tank?.properties || {};
    const title = String(props?.title || label || "Counter").slice(0, 32);

    const digitsRaw = Number(props?.digits ?? 4);
    const digits = Number.isFinite(digitsRaw)
      ? Math.max(1, Math.min(10, digitsRaw))
      : 4;

    const nRaw =
      props?.count ?? tank?.value ?? tank?.count ?? count ?? value ?? 0;

    const n = Number(nRaw);
    const safe = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;

    const effective = overrideCount !== null ? overrideCount : safe;
    const display = String(effective).padStart(digits, "0");

    return (
      <div
        onMouseDown={(e) => {
          // ✅ If user clicks the button, do NOT trigger drag/select
          if (e.target?.closest?.("button")) return;

          e.stopPropagation();
          onSelect?.(id);
          onStartDragObject?.(e, id);
        }}
        style={{
          position: x !== undefined && y !== undefined ? "absolute" : "relative",
          left: x,
          top: y,
          width: 150,
          borderRadius: 6,
          border: isSelected ? "2px solid #2563eb" : "2px solid #9ca3af",
          background: "#f3f4f6",
          boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 8,
          userSelect: "none",
          cursor: "move",
        }}
        title={title}
      >
        {/* TITLE */}
        <div
          style={{
            fontWeight: 800,
            fontSize: 14,
            marginBottom: 6,
            color: "#111827",
            textAlign: "center",
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>

        {/* DISPLAY */}
        <div
          style={{
            width: "100%",
            height: 36,
            borderRadius: 4,
            border: "2px solid #8f8f8f",
            background: "#e5e7eb",
            boxShadow: "inset 0 0 6px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: "1px",
            color: "#111",
            marginBottom: 8,
          }}
        >
          {display}
        </div>

        {/* RESET BUTTON */}
        <button
          type="button"
          // ✅ Use pointer events (strongest) to stop drag stealing clicks
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={onResetClick}
          disabled={resetting}
          style={{
            width: "100%",
            height: 28,
            borderRadius: 4,
            border: "none",
            background: resetting ? "#fca5a5" : "#ef4444",
            color: "white",
            fontWeight: 800,
            fontSize: 13,
            cursor: resetting ? "not-allowed" : "pointer",
            boxShadow: "0 2px 0 rgba(0,0,0,0.25)",
            opacity: resetting ? 0.8 : 1,
          }}
          title={resetting ? "Resetting…" : "Reset counter"}
        >
          {resetting ? "Resetting…" : "Reset"}
        </button>
      </div>
    );
  }

  // ===============================
  // ✅ MENU VARIANT (LEFT SIDEBAR)
  // ===============================
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="select-none cursor-grab active:cursor-grabbing flex items-center w-full"
      title="Drag to canvas"
      style={{ userSelect: "none" }}
    >
      <span className="w-[16px] text-center text-base leading-none">🧮</span>
      <span className="text-sm ml-2">{label}</span>
    </div>
  );
}
