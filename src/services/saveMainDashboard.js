import { API_URL } from "../config/api";

// ✅ Always read token fresh (prevents stale auth issues)
function getToken() {
  return localStorage.getItem("coreflex_token") || "";
}

// Optional debug switch (set to true temporarily)
const DEBUG_DASHBOARD_API = false;

/**
 * Save Main Dashboard
 * Sends the full dashboard object to the backend
 */
export async function saveMainDashboard(dashboard) {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated (missing token)");
  }

  if (!dashboard || typeof dashboard !== "object") {
    throw new Error("Invalid dashboard payload (must be an object)");
  }

  if (DEBUG_DASHBOARD_API) {
    console.log("[saveMainDashboard] POST /dashboard/main");
    console.log("[saveMainDashboard] token present:", !!token);
    console.log("[saveMainDashboard] payload keys:", Object.keys(dashboard));
  }

  const res = await fetch(`${API_URL}/dashboard/main`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ fresh token every call
    },
    body: JSON.stringify(dashboard),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Save failed (${res.status}): ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Load Main Dashboard (for the CURRENT logged-in user)
 * This is critical for verifying dashboards are NOT shared between users.
 */
export async function loadMainDashboard() {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated (missing token)");
  }

  if (DEBUG_DASHBOARD_API) {
    console.log("[loadMainDashboard] GET /dashboard/main");
    console.log("[loadMainDashboard] token present:", !!token);
  }

  const res = await fetch(`${API_URL}/dashboard/main`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Load failed (${res.status}): ${errorText || res.statusText}`);
  }

  return await res.json();
}
