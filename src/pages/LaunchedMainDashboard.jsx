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
  // ✅ STEP 2 — Load live sensor/device data
  // --------------------------------------------------------------
  useEffect(() => {
    fetch(`${API_URL}/devices`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load devices");
        return res.json();
      })
      .then((data) =>
        setSensorsData(
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
          }))
        )
      )
      .catch((err) => {
        console.error("❌ Sensor API error:", err);
        setSensorsData([]);
      });
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
  //    IMPORTANT:
  //    - We allow setDroppedTanks so toggle/pushbutton can update state
  //    - We still block drag/edit via play mode + empty handlers
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
        setDroppedTanks={setDroppedTanks} // ✅ allow controls to update their own state in play

        /* ----- Sensor Data ----- */
        sensorsData={sensorsData}
        sensors={[]} // ✅ no drag items in launched mode

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

        // ✅ disable selection + drag actions in launched mode
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

        // ✅ no property modals in launch mode
        onOpenDisplaySettings={() => {}}
        onOpenGraphicDisplaySettings={() => {}}
      />
    </div>
  );
}
