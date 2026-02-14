// src/pages/LaunchedMainDashboard.jsx

import React, { useEffect, useState } from "react";
import DashboardCanvas from "../components/DashboardCanvas";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

export default function LaunchedMainDashboard() {
  const [sensorsData, setSensorsData] = useState([]);
  const [droppedTanks, setDroppedTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");

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

        setDroppedTanks(Array.isArray(objects) ? objects : []);
        setLoading(false);
      } catch (e) {
        console.error("❌ Launch load layout error:", e);
        setFatalError("Failed to load dashboard layout.");
        setDroppedTanks([]);
        setLoading(false);
      }
    };

    loadLayout();
  }, []);

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
        if (token) headers.Authorization = `Bearer ${token}`; // safe if endpoint requires auth

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

    // initial + 1s polling
    fetchDevices();
    const timer = setInterval(fetchDevices, 1000);

    return () => {
      alive = false;
      clearInterval(timer);
      controller.abort();
    };
  }, []);

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
