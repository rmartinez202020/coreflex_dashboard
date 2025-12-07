// src/pages/LaunchedMainDashboard.jsx

import React, { useEffect, useState } from "react";
import DashboardCanvas from "../components/DashboardCanvas";

export default function LaunchedMainDashboard() {
  const [sensorsData, setSensorsData] = useState([]);
  const [droppedTanks, setDroppedTanks] = useState([]);

  // --------------------------------------------------------------
  // 🔹 STEP 1 — Load FULL dashboard layout from localStorage
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
  // 🔹 STEP 2 — Load live sensor data from backend API
  // --------------------------------------------------------------
  useEffect(() => {
    fetch("http://localhost:8000/devices")
      .then((res) => res.json())
      .then((data) =>
        setSensorsData(
          data.map((s) => ({
            ...s,
            level_percent: Math.min(100, Math.round((s.level / 55) * 100)),
            date_received: s.last_update?.split("T")[0] || "",
            time_received: s.last_update
              ? new Date(s.last_update).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          }))
        )
      )
      .catch((err) => console.error("❌ Sensor API error:", err));
  }, []);

  // --------------------------------------------------------------
  // 🔹 STEP 3 — Render DashboardCanvas in VIEW MODE ONLY
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
        dashboardMode="play"   // 🚀 VIEW-ONLY
        embedMode={true}       // CLEAN LAUNCHED STYLE

        /* ----- Layout Objects ----- */
        droppedTanks={droppedTanks}
        setDroppedTanks={() => {}}  // disable editing layout

        /* ----- Sensor Data ----- */
        sensorsData={sensorsData}
        sensors={[]}  // no sensor drag items in launched mode

        /* ----- Disable EVERYTHING EDITABLE ----- */
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
