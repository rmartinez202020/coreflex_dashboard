// src/pages/LaunchedMainDashboard.jsx
import React, { useEffect, useState } from "react";
import DashboardCanvas from "../components/DashboardCanvas";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

export default function LaunchedMainDashboard() {
  const [sensorsData, setSensorsData] = useState([]);
  const [droppedTanks, setDroppedTanks] = useState([]);

  // --------------------------------------------------------------
  // STEP 1 — Load FULL dashboard layout from localStorage
  // --------------------------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem("coreflex_dashboard_objects");
      if (saved) {
        const parsed = JSON.parse(saved);
        setDroppedTanks(parsed || []);
      }
    } catch (e) {
      console.error("❌ Error loading dashboard layout:", e);
    }
  }, []);

  // --------------------------------------------------------------
  // STEP 2 — Load live sensor data from backend API
  // --------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();

    async function loadDevices() {
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/devices`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Devices API failed: ${res.status} ${text}`);
        }

        const data = await res.json();

        setSensorsData(
          (data || []).map((s) => ({
            ...s,
            level_percent: Math.min(100, Math.round(((s.level || 0) / 55) * 100)),
            date_received: s.last_update?.split("T")[0] || "",
            time_received: s.last_update
              ? new Date(s.last_update).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          }))
        );
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("❌ Sensor API error:", err);
        }
      }
    }

    loadDevices();
    return () => controller.abort();
  }, []);

  // --------------------------------------------------------------
  // STEP 3 — Render DashboardCanvas in VIEW MODE ONLY
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
        droppedTanks={droppedTanks}
        setDroppedTanks={() => {}}
        sensorsData={sensorsData}
        sensors={[]}
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
      />
    </div>
  );
}
