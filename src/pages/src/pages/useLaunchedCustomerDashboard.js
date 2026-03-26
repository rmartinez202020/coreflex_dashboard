// src/pages/useLaunchedCustomerDashboard.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

function looksLikeAlarmLogObject(obj) {
  if (!obj || typeof obj !== "object") return false;

  const props =
    obj.properties && typeof obj.properties === "object" ? obj.properties : {};

  const typeCandidates = [
    obj.type,
    obj.widgetType,
    obj.componentType,
    props.type,
    props.widgetType,
    props.componentType,
    props.windowType,
    props.kind,
    props.name,
    props.title,
    props.windowKey,
    props.key,
  ]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean);

  const joined = typeCandidates.join(" | ");

  return (
    joined.includes("alarmlog") ||
    joined.includes("alarm log") ||
    joined.includes("alarms log") ||
    joined.includes("alarm-log") ||
    joined.includes("alarm_log")
  );
}

function buildAlarmLogLaunchUrl({ dashboardId, dashboardName }) {
  const dash = String(dashboardId || "").trim() || "main";
  const name = String(dashboardName || "").trim() || "Dashboard";

  const url = new URL("/launchAlarmLog", window.location.origin);
  url.searchParams.set("dashboardId", dash);
  url.searchParams.set("dashboardName", name);
  url.searchParams.set("windowKey", "alarmLog");

  return url.toString();
}

function injectDashboardIdIntoObjects(objects, dash, allowInject = true) {
  if (!Array.isArray(objects)) return [];
  if (!allowInject) return objects;

  const did = String(dash || "").trim();
  if (!did) return objects;

  return objects.map((o) => {
    if (!o || typeof o !== "object") return o;

    const props =
      o.properties && typeof o.properties === "object" ? o.properties : {};

    const existing = String(props.dashboardId || props.dashboard_id || "").trim();

    if (existing === did) return o;

    return {
      ...o,
      properties: {
        ...props,
        dashboardId: did,
      },
    };
  });
}

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.devices)) return data.devices;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeDevices(data) {
  return toArray(data).map((s) => ({
    ...s,
    level_percent: Math.min(100, Math.round((Number(s?.level || 0) / 55) * 100)),
    date_received: s?.last_update?.split?.("T")?.[0] || "",
    time_received: s?.last_update
      ? new Date(s.last_update).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  }));
}

export default function useLaunchedCustomerDashboard() {
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

  const [isTenantAuthenticated, setIsTenantAuthenticated] = useState(false);
  const [tenantName, setTenantName] = useState("Portal User");
  const [tenantAccessLevel, setTenantAccessLevel] = useState("read_only");

  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPassword, setTenantPassword] = useState("");
  const [tenantAuthLoading, setTenantAuthLoading] = useState(false);
  const [tenantAuthError, setTenantAuthError] = useState("");

  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");

  const resetTenantAuthState = useCallback(() => {
    setIsTenantAuthenticated(false);
    setTenantName("Portal User");
    setTenantAccessLevel("read_only");
    setTenantAuthError("");
    setRequiresPasswordChange(false);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordChangeError("");
    setTenantPassword("");
    setSensorsData([]);
  }, []);

  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true);
        setFatalError("");
        setDroppedTanks([]);
        setResolvedDashboardId("");
        setDashboardTitle("Dashboard");
        resetTenantAuthState();

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
  }, [
    privateDashId,
    publicDashSlug,
    publicDashLaunchId,
    isPublicLaunch,
    resetTenantAuthState,
  ]);

  useEffect(() => {
    if (isPublicLaunch && !isTenantAuthenticated) {
      setSensorsData([]);
      return;
    }

    let alive = true;
    let timer = null;
    let controller = null;

    const fetchDevices = async () => {
      try {
        controller = new AbortController();

        const token = String(getToken() || "").trim();
        let res;

        if (isPublicLaunch) {
          const email = String(tenantEmail || "").trim().toLowerCase();

          if (!email || !isTenantAuthenticated) {
            if (alive) setSensorsData([]);
            return;
          }

          const qs = new URLSearchParams({
            dashboard_slug: publicDashSlug,
            public_launch_id: publicDashLaunchId,
            tenant_email: email,
          });

          res = await fetch(`${API_URL}/tenant-access/devices?${qs.toString()}`, {
            signal: controller.signal,
          });
        } else {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          res = await fetch(`${API_URL}/devices`, {
            headers,
            signal: controller.signal,
          });
        }

        if (!res.ok) throw new Error("Failed to load devices");

        const data = await res.json().catch(() => []);
        if (!alive) return;

        setSensorsData(normalizeDevices(data));
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("❌ Launch device poll failed:", err);
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
  }, [
    isPublicLaunch,
    isTenantAuthenticated,
    tenantEmail,
    publicDashSlug,
    publicDashLaunchId,
  ]);

  const hasAlarmLog = useMemo(() => {
    return Array.isArray(droppedTanks)
      ? droppedTanks.some((obj) => looksLikeAlarmLogObject(obj))
      : false;
  }, [droppedTanks]);

  const handleOpenAlarmLog = useCallback(() => {
    const dashboardIdSafe =
      String(resolvedDashboardId || privateDashId || "main").trim() || "main";

    const url = buildAlarmLogLaunchUrl({
      dashboardId: dashboardIdSafe,
      dashboardName: dashboardTitle,
    });

    window.open(url, "_blank", "noopener,noreferrer");
  }, [resolvedDashboardId, privateDashId, dashboardTitle]);

  const handleTenantLogin = useCallback(async () => {
    const email = String(tenantEmail || "").trim().toLowerCase();
    const password = String(tenantPassword || "").trim();

    if (!email || !password) {
      setTenantAuthError("Please enter your email and password.");
      return;
    }

    setTenantAuthLoading(true);
    setTenantAuthError("");
    setPasswordChangeError("");

    try {
      const res = await fetch(
        `${API_URL}/customers-dashboards/tenant-access/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dashboard_slug: publicDashSlug,
            public_launch_id: publicDashLaunchId,
            email,
            password,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          String(
            data?.detail ||
              data?.error ||
              "Tenant login failed. Please verify your credentials."
          )
        );
      }

      const mustChange = Boolean(data?.must_change_password);

      setTenantName(
        String(data?.tenant_name || data?.full_name || email || "Portal User")
      );
      setTenantAccessLevel(
        String(data?.access_level || "read_only").trim() || "read_only"
      );

      if (mustChange) {
        setRequiresPasswordChange(true);
        setIsTenantAuthenticated(false);
        return;
      }

      setRequiresPasswordChange(false);
      setIsTenantAuthenticated(true);
    } catch (err) {
      console.error("❌ Tenant login failed:", err);
      setTenantAuthError(String(err?.message || err));
    } finally {
      setTenantAuthLoading(false);
    }
  }, [tenantEmail, tenantPassword, publicDashSlug, publicDashLaunchId]);

  const handleTenantSetPassword = useCallback(async () => {
    const email = String(tenantEmail || "").trim().toLowerCase();
    const currentPassword = String(tenantPassword || "").trim();
    const nextPassword = String(newPassword || "").trim();
    const confirmPassword = String(confirmNewPassword || "").trim();

    if (!nextPassword || !confirmPassword) {
      setPasswordChangeError("Please enter and confirm the new password.");
      return;
    }

    if (nextPassword.length < 8) {
      setPasswordChangeError("New password must be at least 8 characters.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordChangeError("New password and confirmation do not match.");
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeError("");
    setTenantAuthError("");

    try {
      const res = await fetch(
        `${API_URL}/customers-dashboards/tenant-access/set-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dashboard_slug: publicDashSlug,
            public_launch_id: publicDashLaunchId,
            email,
            temporary_password: currentPassword,
            new_password: nextPassword,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          String(data?.detail || data?.error || "Failed to set the new password.")
        );
      }

      setTenantPassword(nextPassword);
      setNewPassword("");
      setConfirmNewPassword("");
      setRequiresPasswordChange(false);
      setTenantName(
        String(data?.tenant_name || data?.full_name || email || "Portal User")
      );
      setTenantAccessLevel(
        String(data?.access_level || "read_only").trim() || "read_only"
      );
      setIsTenantAuthenticated(true);
    } catch (err) {
      console.error("❌ Tenant password change failed:", err);
      setPasswordChangeError(String(err?.message || err));
    } finally {
      setPasswordChangeLoading(false);
    }
  }, [
    tenantEmail,
    tenantPassword,
    newPassword,
    confirmNewPassword,
    publicDashSlug,
    publicDashLaunchId,
  ]);

  const shouldHideDashboard = isPublicLaunch && !isTenantAuthenticated;

  return {
    pathParts,

    privateDashId,
    publicDashSlug,
    publicDashLaunchId,
    isPublicLaunch,

    sensorsData,
    setSensorsData,

    droppedTanks,
    setDroppedTanks,

    loading,
    setLoading,

    fatalError,
    setFatalError,

    resolvedDashboardId,
    setResolvedDashboardId,

    dashboardTitle,
    setDashboardTitle,

    isTenantAuthenticated,
    setIsTenantAuthenticated,

    tenantName,
    setTenantName,

    tenantAccessLevel,
    setTenantAccessLevel,

    tenantEmail,
    setTenantEmail,

    tenantPassword,
    setTenantPassword,

    tenantAuthLoading,
    setTenantAuthLoading,

    tenantAuthError,
    setTenantAuthError,

    requiresPasswordChange,
    setRequiresPasswordChange,

    newPassword,
    setNewPassword,

    confirmNewPassword,
    setConfirmNewPassword,

    passwordChangeLoading,
    setPasswordChangeLoading,

    passwordChangeError,
    setPasswordChangeError,

    hasAlarmLog,
    shouldHideDashboard,

    resetTenantAuthState,
    handleOpenAlarmLog,
    handleTenantLogin,
    handleTenantSetPassword,
  };
}