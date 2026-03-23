// src/pages/LaunchedCustomerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import DashboardCanvas from "../components/DashboardCanvas";
import PortalTopBar from "../components/pages/PortalTopBar.jsx";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

export default function LaunchedCustomerDashboard() {
  const params = useParams();
  const location = useLocation();

  const pathParts = useMemo(() => {
    return String(location.pathname || "")
      .split("/")
      .map((p) => String(p || "").trim())
      .filter(Boolean);
  }, [location.pathname]);

  const fallbackDashboardId =
    pathParts[0] === "launchDashboard" && pathParts.length === 2
      ? String(pathParts[1] || "").trim()
      : "";

  const fallbackDashboardSlug =
    pathParts[0] === "launchDashboard" && pathParts.length >= 3
      ? String(pathParts[1] || "").trim()
      : "";

  const fallbackPublicLaunchId =
    pathParts[0] === "launchDashboard" && pathParts.length >= 3
      ? String(pathParts[2] || "").trim()
      : "";

  const dashboardIdRaw = String(
    params?.dashboardId || fallbackDashboardId || ""
  ).trim();

  const dashboardSlugRaw = String(
    params?.dashboardSlug || fallbackDashboardSlug || ""
  ).trim();

  const publicLaunchIdRaw = String(
    params?.publicLaunchId || fallbackPublicLaunchId || ""
  ).trim();

  const privateDashId = useMemo(() => dashboardIdRaw, [dashboardIdRaw]);
  const publicDashSlug = useMemo(() => dashboardSlugRaw, [dashboardSlugRaw]);
  const publicDashLaunchId = useMemo(
    () => publicLaunchIdRaw,
    [publicLaunchIdRaw]
  );

  const isPublicLaunch = !!publicDashSlug && !!publicDashLaunchId;

  const [sensorsData, setSensorsData] = useState([]);
  const [droppedTanks, setDroppedTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [resolvedDashboardId, setResolvedDashboardId] = useState("");
  const [dashboardTitle, setDashboardTitle] = useState("Dashboard");

  const injectDashboardIdIntoObjects = (objects, dash, allowInject = true) => {
    if (!Array.isArray(objects)) return [];
    if (!allowInject) return objects;

    const did = String(dash || "").trim();
    if (!did) return objects;

    return objects.map((o) => {
      if (!o || typeof o !== "object") return o;
      const props = o.properties || {};
      const existing = String(
        props.dashboardId || props.dashboard_id || ""
      ).trim();

      if (existing === did) return o;

      return {
        ...o,
        properties: {
          ...props,
          dashboardId: did,
        },
      };
    });
  };

  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true);
        setFatalError("");
        setDroppedTanks([]);
        setResolvedDashboardId("");
        setDashboardTitle("Dashboard");

        let res;

        if (isPublicLaunch) {
          res = await fetch(
            `${API_URL}/customers-dashboards/public/${encodeURIComponent(
              publicDashSlug
            )}/${encodeURIComponent(publicDashLaunchId)}`
          );

          if (!res.ok) {
            setFatalError("Public dashboard not found or no longer available.");
            setLoading(false);
            return;
          }

          const data = await res.json();

          const objects =
            data?.layout?.canvas?.objects ||
            data?.layout?.objects ||
            data?.canvas?.objects ||
            [];

          const backendDashId = String(data?.id || "").trim();
          setResolvedDashboardId(backendDashId);
          setDashboardTitle(
            String(data?.dashboard_name || publicDashSlug || "Dashboard").trim()
          );

          const finalObjects = injectDashboardIdIntoObjects(
            Array.isArray(objects) ? objects : [],
            backendDashId,
            true
          );

          setDroppedTanks(finalObjects);
          setLoading(false);
          return;
        }

        const token = String(getToken() || "").trim();
        if (!token) {
          setFatalError("Not logged in. Please login first, then click Launch.");
          setLoading(false);
          return;
        }

        if (!privateDashId) {
          setFatalError("Missing dashboard id.");
          setLoading(false);
          return;
        }

        res = await fetch(
          `${API_URL}/customers-dashboards/${encodeURIComponent(privateDashId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          setFatalError(
            `Dashboard not found or not owned by user (id=${privateDashId}).`
          );
          setLoading(false);
          return;
        }

        const data = await res.json();

        const objects =
          data?.layout?.canvas?.objects ||
          data?.layout?.objects ||
          data?.canvas?.objects ||
          [];

        setResolvedDashboardId(privateDashId);
        setDashboardTitle(
          String(data?.dashboard_name || privateDashId || "Dashboard").trim()
        );

        const withDash = injectDashboardIdIntoObjects(
          Array.isArray(objects) ? objects : [],
          privateDashId,
          true
        );

        setDroppedTanks(withDash);
        setLoading(false);
      } catch (e) {
        console.error("❌ Launch customer load error:", e);
        setFatalError("Failed to load customer dashboard layout.");
        setDroppedTanks([]);
        setResolvedDashboardId("");
        setDashboardTitle("Dashboard");
        setLoading(false);
      }
    };

    loadLayout();
  }, [privateDashId, publicDashSlug, publicDashLaunchId, isPublicLaunch]);

  useEffect(() => {
    let alive = true;
    let timer = null;
    let controller = null;

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
        controller = new AbortController();

        const token = String(getToken() || "").trim();
        const headers =
          !isPublicLaunch && token ? { Authorization: `Bearer ${token}` } : {};

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
    timer = setInterval(fetchDevices, 1000);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      if (controller) controller.abort();
    };
  }, [isPublicLaunch]);

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "white",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Launch error</div>
          <div style={{ opacity: 0.85 }}>{fatalError}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "white",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PortalTopBar
        dashboardName={dashboardTitle}
        tenantName={isPublicLaunch ? "Portal User" : "Signed-in User"}
        accessLevel={isPublicLaunch ? "read_only" : "read_control"}
        onLogout={() => {
          if (isPublicLaunch) {
            window.location.href = "/";
            return;
          }
          window.close();
        }}
      />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          background: "white",
        }}
      >
        <DashboardCanvas
          dashboardMode="play"
          embedMode={true}
          dashboardId={resolvedDashboardId}
          activeDashboardId={resolvedDashboardId}
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
        />
      </div>
    </div>
  );
}