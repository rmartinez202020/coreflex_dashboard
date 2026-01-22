// src/services/saveMainDashboard.js
import { API_URL } from "../config/api";
import { getToken, clearAuth, getUserKeyFromToken } from "../utils/authToken";

const DEBUG_DASHBOARD_API = false;

async function readErrorBody(res) {
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const json = await res.json();
      return json?.detail ? String(json.detail) : JSON.stringify(json);
    }
    return await res.text();
  } catch {
    return "";
  }
}

// ✅ Resolve endpoint based on dashboard context
function resolveDashboardEndpoint(activeDashboard) {
  // main
  if (!activeDashboard || activeDashboard.type === "main") {
    return `${API_URL}/dashboard/main`;
  }

  // ✅ customer dashboard (matches your DB table: customers_dashboards)
  if (activeDashboard.type === "customer" && activeDashboard.dashboardId) {
    return `${API_URL}/customers-dashboards/${activeDashboard.dashboardId}`;
  }

  // fallback
  return `${API_URL}/dashboard/main`;
}

/**
 * ✅ Save dashboard (Main OR Customer dashboard)
 * @param {object} dashboardPayload - your dashboard JSON payload
 * @param {object} activeDashboard - { type:"main"|"customer", dashboardId?:string }
 */
export async function saveMainDashboard(dashboardPayload, activeDashboard) {
  const token = getToken();

  if (!token) throw new Error("Not authenticated (missing token)");
  if (!dashboardPayload || typeof dashboardPayload !== "object") {
    throw new Error("Invalid dashboard payload (must be an object)");
  }

  const endpoint = resolveDashboardEndpoint(activeDashboard);
  const isCustomer = activeDashboard?.type === "customer";

  // ✅ Customer dashboards store JSON in `layout` column -> wrap payload
  const body = isCustomer
    ? { layout: dashboardPayload }
    : dashboardPayload;

  if (DEBUG_DASHBOARD_API) {
    console.log("[saveDashboard]", isCustomer ? "PUT" : "POST", endpoint);
    console.log("[saveDashboard] userKey:", getUserKeyFromToken(token));
    console.log("[saveDashboard] token start:", token.slice(0, 20));
    console.log("[saveDashboard] payload keys:", Object.keys(dashboardPayload));
    console.log("[saveDashboard] activeDashboard:", activeDashboard);
  }

  const res = await fetch(endpoint, {
    // ✅ main can stay POST (create/upsert), customer should be PUT (update row)
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401 || res.status === 403) {
    clearAuth();
    window.dispatchEvent(new Event("coreflex-auth-changed"));
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const errorText = await readErrorBody(res);
    throw new Error(
      `Save failed (${res.status}): ${errorText || res.statusText}`
    );
  }

  // sometimes APIs return empty body on PUT
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/**
 * ✅ Load dashboard (Main OR Customer dashboard)
 * @param {object} activeDashboard - { type:"main"|"customer", dashboardId?:string }
 */
export async function loadMainDashboard(activeDashboard) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated (missing token)");

  const endpoint = resolveDashboardEndpoint(activeDashboard);

  if (DEBUG_DASHBOARD_API) {
    console.log("[loadDashboard] GET", endpoint);
    console.log("[loadDashboard] userKey:", getUserKeyFromToken(token));
    console.log("[loadDashboard] token start:", token.slice(0, 20));
    console.log("[loadDashboard] activeDashboard:", activeDashboard);
  }

  const res = await fetch(endpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 || res.status === 403) {
    clearAuth();
    window.dispatchEvent(new Event("coreflex-auth-changed"));
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const errorText = await readErrorBody(res);
    throw new Error(
      `Load failed (${res.status}): ${errorText || res.statusText}`
    );
  }

  return await res.json();
}
