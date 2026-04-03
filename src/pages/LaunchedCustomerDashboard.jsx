// src/pages/LaunchedCustomerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import DashboardCanvas from "../components/DashboardCanvas";
import PortalTopBar from "./PortalTopBar.jsx";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

function buildAlarmLogLaunchUrl({
  dashboardId,
  dashboardName,
  isPublicLaunch,
  publicDashSlug,
  publicDashLaunchId,
}) {
  const dash = String(dashboardId || "").trim() || "main";
  const title = String(dashboardName || "Alarms Log (DI-AI)").trim();

  let basePath = `/launchDashboard/${encodeURIComponent(dash)}`;

  if (isPublicLaunch) {
    const slug = String(publicDashSlug || "").trim();
    const launchId = String(publicDashLaunchId || "").trim();
    if (slug && launchId) {
      basePath = `/launchDashboard/${encodeURIComponent(
        slug
      )}/${encodeURIComponent(launchId)}`;
    }
  }

  const url = new URL(basePath, window.location.origin);
  url.searchParams.set("openAlarmLog", "1");
  url.searchParams.set("windowKey", "alarmLog");
  url.searchParams.set("title", title);
  url.searchParams.set("dashboardId", dash);

  return url.toString();
}

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
  const [hasAlarmLog, setHasAlarmLog] = useState(false);

  // ✅ Public portal gate/auth states
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

  const injectDashboardIdIntoObjects = (objects, dash, allowInject = true) => {
    if (!Array.isArray(objects)) return [];
    if (!allowInject) return objects;

    const did = String(dash || "").trim();
    if (!did) return objects;

    return objects.map((o) => {
      if (!o || typeof o !== "object") return o;

      const props =
        o.properties && typeof o.properties === "object" ? o.properties : {};

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

  const resetTenantAuthState = () => {
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
  };

  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true);
        setFatalError("");
        setDroppedTanks([]);
        setResolvedDashboardId("");
        setDashboardTitle("Dashboard");
        setHasAlarmLog(false);
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
        setHasAlarmLog(false);
        setLoading(false);
      }
    };

    loadLayout();
  }, [privateDashId, publicDashSlug, publicDashLaunchId, isPublicLaunch]);

  useEffect(() => {
  const dashboardId = String(resolvedDashboardId || "").trim();
  const tenantEmailSafe = String(tenantEmail || "").trim().toLowerCase();

  if (!dashboardId) {
    setHasAlarmLog(false);
    return;
  }

  if (isPublicLaunch && (!isTenantAuthenticated || !tenantEmailSafe)) {
    setHasAlarmLog(false);
    return;
  }

  let alive = true;
  const controller = new AbortController();

  const checkAlarmLogAvailability = async () => {
    try {
      let url = "";
      let headers = {};

      if (isPublicLaunch) {
        const qs = new URLSearchParams({
          dashboard_slug: publicDashSlug,
          public_launch_id: publicDashLaunchId,
          tenant_email: tenantEmailSafe,
          window_key: "alarmLog",
        });

        url = `${API_URL}/alarm-log-windows/public/by-dashboard?${qs.toString()}`;
      } else {
        const qs = new URLSearchParams({
          dashboard_id: dashboardId,
          window_key: "alarmLog",
        });

        const token = String(getToken() || "").trim();
        headers = token ? { Authorization: `Bearer ${token}` } : {};
        url = `${API_URL}/alarm-log-windows/by-dashboard?${qs.toString()}`;
      }

      const res = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        if (alive) setHasAlarmLog(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!alive) return;

      setHasAlarmLog(Boolean(data?.found));
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("❌ Alarm log availability check failed:", err);
      if (alive) setHasAlarmLog(false);
    }
  };

  checkAlarmLogAvailability();

  return () => {
    alive = false;
    controller.abort();
  };
}, [
  resolvedDashboardId,
  isPublicLaunch,
  isTenantAuthenticated,
  tenantEmail,
  publicDashSlug,
  publicDashLaunchId,
]);

  useEffect(() => {
    if (isPublicLaunch && !isTenantAuthenticated) {
      setSensorsData([]);
      return;
    }

    let alive = true;
    let timer = null;
    let controller = null;

    const toArray = (data) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.devices)) return data.devices;
      if (Array.isArray(data?.rows)) return data.rows;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.results)) return data.results;
      return [];
    };

    const normalize = (data) =>
      toArray(data).map((s) => ({
        ...s,
        level_percent: Math.min(
          100,
          Math.round((Number(s?.level || 0) / 55) * 100)
        ),
        date_received: s?.last_update?.split?.("T")?.[0] || "",
        time_received: s?.last_update
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

          res = await fetch(
            `${API_URL}/tenant-access/devices?${qs.toString()}`,
            {
              signal: controller.signal,
            }
          );
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

        setSensorsData(normalize(data));
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

  const handleOpenAlarmLog = () => {
    const dashboardIdSafe =
      String(resolvedDashboardId || privateDashId || "main").trim() || "main";

    const url = buildAlarmLogLaunchUrl({
      dashboardId: dashboardIdSafe,
      dashboardName: "Alarms Log (DI-AI)",
      isPublicLaunch,
      publicDashSlug,
      publicDashLaunchId,
    });

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTenantLogin = async () => {
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
  };

  const handleTenantSetPassword = async () => {
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
          String(
            data?.detail || data?.error || "Failed to set the new password."
          )
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
  };

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

  const shouldHideDashboard = isPublicLaunch && !isTenantAuthenticated;

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
        tenantName={tenantName}
        accessLevel={tenantAccessLevel}
        isAuthenticated={!shouldHideDashboard}
        hasAlarmLog={hasAlarmLog}
        onOpenAlarmLog={handleOpenAlarmLog}
        onLogin={() => {}}
        onLogout={() => {
          if (isPublicLaunch) {
            resetTenantAuthState();
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
          position: "relative",
        }}
      >
        {shouldHideDashboard ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 560,
                background: "white",
                border: "1px solid #dbe3ea",
                borderRadius: 18,
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.10)",
                padding: 28,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                Customer Portal Access
              </div>

              <div
                style={{
                  fontSize: 15,
                  color: "#334155",
                  lineHeight: 1.6,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Please sign in to access this dashboard.
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.5,
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                This dashboard is available only to authorized tenant users.
              </div>

              {!requiresPasswordChange ? (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: 6,
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={tenantEmail}
                      onChange={(e) => {
                        setTenantEmail(e.target.value);
                        setTenantAuthError("");
                      }}
                      placeholder="Enter your tenant email"
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        padding: "0 14px",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      autoComplete="username"
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: 6,
                      }}
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      value={tenantPassword}
                      onChange={(e) => {
                        setTenantPassword(e.target.value);
                        setTenantAuthError("");
                      }}
                      placeholder="Enter your password"
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        padding: "0 14px",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      autoComplete="current-password"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !tenantAuthLoading) {
                          handleTenantLogin();
                        }
                      }}
                    />
                  </div>

                  {tenantAuthError ? (
                    <div
                      style={{
                        marginBottom: 14,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {tenantAuthError}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleTenantLogin}
                    disabled={tenantAuthLoading}
                    style={{
                      display: "inline-flex",
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 46,
                      borderRadius: 10,
                      border: "1px solid #475569",
                      background: tenantAuthLoading ? "#94a3b8" : "#374151",
                      color: "white",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: tenantAuthLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {tenantAuthLoading ? "Signing In..." : "Sign In"}
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      marginBottom: 16,
                      border: "1px solid #dbeafe",
                      background: "#eff6ff",
                      color: "#1e3a8a",
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    For security, please create a new password before opening
                    this dashboard.
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: 6,
                      }}
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordChangeError("");
                      }}
                      placeholder="Enter new password"
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        padding: "0 14px",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      autoComplete="new-password"
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: 6,
                      }}
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setPasswordChangeError("");
                      }}
                      placeholder="Confirm new password"
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        padding: "0 14px",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      autoComplete="new-password"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !passwordChangeLoading) {
                          handleTenantSetPassword();
                        }
                      }}
                    />
                  </div>

                  {passwordChangeError ? (
                    <div
                      style={{
                        marginBottom: 14,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {passwordChangeError}
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setRequiresPasswordChange(false);
                        setNewPassword("");
                        setConfirmNewPassword("");
                        setPasswordChangeError("");
                      }}
                      disabled={passwordChangeLoading}
                      style={{
                        flex: 1,
                        height: 46,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        background: "white",
                        color: "#334155",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: passwordChangeLoading
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleTenantSetPassword}
                      disabled={passwordChangeLoading}
                      style={{
                        flex: 1.4,
                        height: 46,
                        borderRadius: 10,
                        border: "1px solid #475569",
                        background: passwordChangeLoading
                          ? "#94a3b8"
                          : "#374151",
                        color: "white",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: passwordChangeLoading
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      {passwordChangeLoading
                        ? "Saving..."
                        : "Save New Password"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
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
            isPublicLaunch={isPublicLaunch}
            publicDashSlug={publicDashSlug}
            publicDashLaunchId={publicDashLaunchId}
            tenantEmail={tenantEmail}
            isTenantAuthenticated={isTenantAuthenticated}
            tenantAccessLevel={tenantAccessLevel}
          />
        )}
      </div>
    </div>
  );
}