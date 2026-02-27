// src/pages/LaunchedMainDashboard.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import DashboardCanvas from "../components/DashboardCanvas";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

// ✅ NEW: shared telemetry poller (same one used by normal dashboard)
import useDashboardTelemetryPoller from "../hooks/useDashboardTelemetryPoller";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function LaunchedMainDashboard() {
  const [sensorsData, setSensorsData] = useState([]);
  const [droppedTanks, setDroppedTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");

  // --------------------------------------------------------------
  // ✅ Launch dashboard id (this screen is specifically "main")
  // IMPORTANT: matches your backend control_bindings.dashboard_id = "main"
  // --------------------------------------------------------------
  const dashboardId = useMemo(() => "main", []);

  // --------------------------------------------------------------
  // ✅ helper: inject dashboardId into every widget so controls can write in Launch
  // --------------------------------------------------------------
  const injectDashboardIdIntoObjects = useCallback((objects, dashId) => {
    if (!Array.isArray(objects)) return [];
    const did = String(dashId || "").trim();
    if (!did) return objects;

    return objects.map((o) => {
      if (!o || typeof o !== "object") return o;
      const props = o.properties || {};
      // don't thrash if already set
      if (String(props.dashboardId || props.dashboard_id || "").trim() === did) {
        return o;
      }
      return {
        ...o,
        properties: {
          ...props,
          dashboardId: did,
        },
      };
    });
  }, []);

  // --------------------------------------------------------------
  // ✅ STEP 1 — Load THIS USER main dashboard layout from DB (token)
  // --------------------------------------------------------------
  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true);
        setFatalError("");

        const token = getToken();
        if (!token) {
          setFatalError("Not logged in. Please login first, then click Launch.");
          setDroppedTanks([]);
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/dashboard/main`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // If user has no saved dashboard yet, just show empty canvas
          setDroppedTanks([]);
          setLoading(false);
          return;
        }

        const data = await res.json();

        const objects =
          data?.canvas?.objects ||
          data?.layout?.canvas?.objects ||
          data?.layout?.objects ||
          [];

        const withDash = injectDashboardIdIntoObjects(
          Array.isArray(objects) ? objects : [],
          dashboardId
        );

        setDroppedTanks(withDash);
        setLoading(false);
      } catch (e) {
        console.error("❌ Launch load layout error:", e);
        setFatalError("Failed to load dashboard layout.");
        setDroppedTanks([]);
        setLoading(false);
      }
    };

    loadLayout();
  }, [dashboardId, injectDashboardIdIntoObjects]);

  // --------------------------------------------------------------
  // ✅ STEP 2 — Load live sensor/device data (poll every 1 second)
  // --------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const normalize = (data) =>
      (data || []).map((s) => ({
        ...s,
        level_percent: Math.min(
          100,
          Math.round((Number(s.level || 0) / 55) * 100)
        ),
        date_received: s.last_update?.split?.("T")?.[0] || "",
        time_received: s.last_update
          ? new Date(s.last_update).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
      }));

    const fetchDevices = async () => {
      try {
        const token = getToken();
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/devices`, {
          headers,
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed to load devices");
        const data = await res.json();

        if (!alive) return;
        setSensorsData(normalize(data));
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("❌ Sensor API error:", err);
        if (alive) setSensorsData([]);
      }
    };

    fetchDevices();
    const timer = setInterval(fetchDevices, 1000);

    return () => {
      alive = false;
      clearInterval(timer);
      controller.abort();
    };
  }, []);

  // --------------------------------------------------------------
  // ✅ STEP 2B — Poll COUNTERS every 1 second and inject into droppedTanks
  // --------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const COUNTERS_URL = `${API_URL}/device-counters`; // 👈 change if needed

    const toInt0 = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
    };

    const fetchCounters = async () => {
      try {
        const token = String(getToken() || "").trim();
        if (!token) return;

        const res = await fetch(COUNTERS_URL, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) return;

        const rows = await res.json().catch(() => []);
        if (!alive) return;

        const arr = Array.isArray(rows) ? rows : [];
        if (arr.length === 0) return;

        const map = new Map();
        for (const r of arr) {
          const wid = String(r?.widget_id || r?.widgetId || r?.id || "").trim();
          if (!wid) continue;
          const c = r?.count ?? r?.value ?? r?.data?.count ?? r?.data?.value ?? 0;
          map.set(wid, toInt0(c));
        }

        if (map.size === 0) return;

        setDroppedTanks((prev) => {
          if (!Array.isArray(prev) || prev.length === 0) return prev;

          let changed = false;

          const next = prev.map((o) => {
            const oid = String(o?.id || "").trim();
            if (!oid) return o;

            const shape = String(o?.shape || o?.type || "").toLowerCase();
            const looksLikeCounter =
              shape.includes("counter") ||
              o?.kind === "counter" ||
              o?.properties?.widgetType === "counter";

            if (!looksLikeCounter && !map.has(oid)) return o;
            if (!map.has(oid)) return o;

            const newCount = map.get(oid);
            const props = o?.properties || {};
            const oldCount = toInt0(props?.count);

            const didNow = String(props?.dashboardId || "").trim();
            const needsDash = didNow !== dashboardId;

            if (oldCount === newCount && !needsDash) return o;

            changed = true;
            return {
              ...o,
              properties: {
                ...props,
                dashboardId: dashboardId,
                count: newCount,
              },
            };
          });

          return changed ? next : prev;
        });
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    };

    fetchCounters();
    const timer = setInterval(fetchCounters, 1000);

    return () => {
      alive = false;
      clearInterval(timer);
      controller.abort();
    };
  }, [dashboardId]);

  // --------------------------------------------------------------
  // ✅ STEP 2C — SHARED TELEMETRY (DI/DO/AI/AO rows) for widgets (LED, etc.)
  // This is the missing piece in Launch.
  // --------------------------------------------------------------
  const resolveDashboardId = useCallback(() => {
    // Launch screen is always "main"
    return dashboardId;
  }, [dashboardId]);

  const { telemetryMap } = useDashboardTelemetryPoller({
    isPlay: true, // ✅ Launch is always play
    API_URL,
    getAuthHeaders,
    getToken,
    droppedTanks,
    activeDashboardId: dashboardId,
    dashboardId,
    selectedTank: null,
    resolveDashboardId,
    pollMs: 1500, // 🔧 faster in launch (optional). Use 3000 if you prefer.
    modelMeta: {
      zhc1921: { base: "zhc1921" },
      zhc1661: { base: "zhc1661" },
      tp4000: { base: "tp4000" },
    },
  });

  // --------------------------------------------------------------
  // ✅ UI: never show a “mystery blank” page
  // --------------------------------------------------------------
  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, Arial",
          fontSize: 16,
          color: "#111827",
        }}
      >
        Loading dashboard…
      </div>
    );
  }

  if (fatalError) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui, Arial",
          color: "#111827",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Launch error</div>
          <div style={{ opacity: 0.85 }}>{fatalError}</div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------
  // ✅ STEP 3 — Render DashboardCanvas in PLAY mode
  // --------------------------------------------------------------
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "white",
        overflow: "hidden",
      }}
    >
      <DashboardCanvas
        dashboardMode="play"
        embedMode={true}
        dashboardId={dashboardId}
        /* ✅ NEW: provide shared telemetry to widgets (LED, indicators, etc.) */
        telemetryMap={telemetryMap}
        /* ----- Layout Objects ----- */
        droppedTanks={droppedTanks}
        setDroppedTanks={setDroppedTanks}
        /* ----- Sensor Data ----- */
        sensorsData={sensorsData}
        sensors={[]}
        /* ----- Disable editing UI / interactions ----- */
        selectedIds={[]}
        setSelectedIds={() => {}}
        selectedTank={null}
        setSelectedTank={() => {}}
        dragDelta={{ x: 0, y: 0 }}
        setDragDelta={() => {}}
        contextMenu={{ visible: false }}
        setContextMenu={() => {}}
        activeSiloId={null}
        setActiveSiloId={() => {}}
        setShowSiloProps={() => {}}
        handleSelect={() => {}}
        handleRightClick={() => {}}
        handleDrop={() => {}}
        handleDragMove={() => {}}
        handleDragEnd={() => {}}
        handleCanvasMouseDown={() => {}}
        handleCanvasMouseMove={() => {}}
        handleCanvasMouseUp={() => {}}
        getLayerScore={(o) => o.zIndex || 1}
        selectionBox={null}
        hideContextMenu={() => {}}
        guides={[]}
        onOpenDisplaySettings={() => {}}
        onOpenGraphicDisplaySettings={() => {}}
      />
    </div>
  );
}