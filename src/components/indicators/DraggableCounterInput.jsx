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
  variant = "menu",
  label = "Counter Input (DI)",

  tank = null,
  value = 0,
  count,

  dashboardId,

  // ✅ NEW: allow canvas to control edit/play behavior
  dashboardMode = "edit", // "edit" | "play" (launch also uses play)

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

  const isEdit = dashboardMode === "edit";

  // ===============================
  // ✅ UI feedback state
  // ===============================
  const [resetting, setResetting] = React.useState(false);
  const [flash, setFlash] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState(""); // "Reset!" | "Failed"

  // ✅ override display so user sees immediate effect
  const [overrideCount, setOverrideCount] = React.useState(null);

  const widgetId = String(id || tank?.id || "").trim();

  // ✅ Always send dashboard_id string (main dashboard -> "main")
  const dash = resolveDashboardIdFromProps({ dashboardId, tank });
  const dashForBackend = String(dash || "main").trim();

  const triggerFlash = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 350);
  };

  const showStatus = (msg) => {
    setStatusMsg(msg);
    window.setTimeout(() => setStatusMsg(""), 800);
  };

  const onResetClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (resetting) return;
    if (!widgetId) return;

    setResetting(true);

    // ✅ immediate “feel” effect
    setOverrideCount(0);
    triggerFlash();
    showStatus("Reset!");

    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token");

      const res = await fetch(`${API_URL}/device-counters/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          widget_id: widgetId,
          dashboard_id: dashForBackend,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.detail || `Reset failed (${res.status})`);

      // ✅ keep override briefly; polling will update real value
      window.setTimeout(() => setOverrideCount(null), 400);
    } catch (err) {
      console.error("❌ counter reset error:", err);
      showStatus("Failed");
      // revert override if failed
      window.setTimeout(() => setOverrideCount(null), 300);
      alert(err?.message || "Failed to reset counter");
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

    const nRaw = props?.count ?? tank?.value ?? tank?.count ?? count ?? value ?? 0;
    const n = Number(nRaw);
    const safe = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;

    const effective = overrideCount !== null ? overrideCount : safe;
    const display = String(effective).padStart(digits, "0");

    return (
      <div
        onMouseDown={(e) => {
          // ✅ avoid drag/select when pressing button
          if (e.target?.closest?.("button")) return;

          // ✅ drag cursor + drag action ONLY in edit mode
          if (!isEdit) return;

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

          // ✅ IMPORTANT: no "move" cursor in play/launch
          cursor: "default",
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

            // ✅ cursor move ONLY in edit mode
            cursor: isEdit ? "move" : "default",
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
            border: flash ? "2px solid #22c55e" : "2px solid #8f8f8f",
            background: flash ? "#dcfce7" : "#e5e7eb",
            boxShadow: "inset 0 0 6px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: "1px",
            color: "#111",
            marginBottom: 6,
            transition: "all 120ms ease",
            cursor: "default",
          }}
        >
          {display}
        </div>

        {/* STATUS (small feedback) */}
        {statusMsg ? (
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: statusMsg === "Failed" ? "#b91c1c" : "#166534",
              marginBottom: 6,
              cursor: "default",
            }}
          >
            {statusMsg}
          </div>
        ) : (
          <div style={{ height: 16, marginBottom: 6 }} />
        )}

        {/* RESET BUTTON */}
        <button
          type="button"
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

            // ✅ pointer ONLY on reset button
            cursor: resetting ? "not-allowed" : "pointer",

            boxShadow: "0 2px 0 rgba(0,0,0,0.25)",
            opacity: resetting ? 0.85 : 1,
          }}
          title={resetting ? "Resetting…" : "Reset counter"}
        >
          {resetting ? "Resetting…" : "Reset"}
        </button>
      </div>
    );
  }

  // ===============================
  // ✅ MENU VARIANT
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
