import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardCanvas from "../components/DashboardCanvas";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

export default function LaunchedCustomerDashboard() {
  const { dashboardId } = useParams();
  const dashId = useMemo(() => String(dashboardId || "").trim(), [dashboardId]);

  const [sensorsData, setSensorsData] = useState([]);
  const [droppedTanks, setDroppedTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");

  // ✅ Load customer dashboard layout from backend
  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true);
        setFatalError("");

        const token = String(getToken() || "").trim();
        if (!token) {
          setFatalError("Not logged in. Please login first, then click Launch.");
          setDroppedTanks([]);
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${API_URL}/customers-dashboards/${encodeURIComponent(dashId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          setFatalError(`Dashboard not found or not owned by user (id=${dashId}).`);
          setDroppedTanks([]);
          setLoading(false);
          return;
        }

        const data = await res.json();

        const objects =
          data?.layout?.canvas?.objects ||
          data?.layout?.objects ||
          data?.canvas?.objects ||
          [];

        setDroppedTanks(Array.isArray(objects) ? objects : []);
        setLoading(false);
      } catch (e) {
        console.error("❌ Launch customer load error:", e);
        setFatalError("Failed to load customer dashboard layout.");
        setDroppedTanks([]);
        setLoading(false);
      }
    };

    if (dashId) loadLayout();
  }, [dashId]);

  // ✅ Devices polling (same as main launch)
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const normalize = (data) =>
      (data || []).map((s) => ({
        ...s,
        level_percent: Math.min(100, Math.round((Number(s.level || 0) / 55) * 100)),
        date_received: s.last_update?.split?.("T")?.[0] || "",
        time_received: s.last_update
          ? new Date(s.last_update).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
      }));

    const fetchDevices = async () => {
      try {
        const token = String(getToken() || "").trim();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

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

  // ✅ never blank
  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading dashboard…
      </div>
    );
  }

  if (fatalError) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Launch error</div>
          <div style={{ opacity: 0.85 }}>{fatalError}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "white", overflow: "hidden" }}>
      <DashboardCanvas
        dashboardMode="play"
        droppedTanks={droppedTanks}
        setDroppedTanks={setDroppedTanks}
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
        onOpenGraphicDisplaySettings={() => {}}
        // ✅ key for counter polling logic inside DashboardCanvas
        dashboardId={dashId}
        activeDashboardId={dashId}
      />
    </div>
  );
}
