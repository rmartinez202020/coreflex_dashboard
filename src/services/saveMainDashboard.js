// src/services/saveMainDashboard.js
import { API_URL } from "../config/api";
import { getToken, clearAuth, getUserKeyFromToken } from "../utils/authToken";

// Optional debug switch (set to true temporarily)
const DEBUG_DASHBOARD_API = false;

async function readErrorBody(res) {
  // FastAPI sometimes returns JSON { detail: ... }, sometimes plain text
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

/**
 * Save Main Dashboard
 */
export async function saveMainDashboard(dashboard) {
  const token = getToken();

  if (!token) throw new Error("Not authenticated (missing token)");
  if (!dashboard || typeof dashboard !== "object") {
    throw new Error("Invalid dashboard payload (must be an object)");
  }

  if (DEBUG_DASHBOARD_API) {
    console.log("[saveMainDashboard] POST /dashboard/main");
    console.log("[saveMainDashboard] userKey:", getUserKeyFromToken());
    console.log("[saveMainDashboard] token start:", token.slice(0, 20));
    console.log("[saveMainDashboard] payload keys:", Object.keys(dashboard));
  }

  const res = await fetch(`${API_URL}/dashboard/main`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dashboard),
  });

  // ✅ If token is invalid/expired, force clean re-login
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

  return await res.json();
}

/**
 * Load Main Dashboard (CURRENT logged-in user)
 */
export async function loadMainDashboard() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated (missing token)");

  if (DEBUG_DASHBOARD_API) {
    console.log("[loadMainDashboard] GET /dashboard/main");
    console.log("[loadMainDashboard] userKey:", getUserKeyFromToken());
    console.log("[loadMainDashboard] token start:", token.slice(0, 20));
  }

  const res = await fetch(`${API_URL}/dashboard/main`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  // ✅ If token is invalid/expired, force clean re-login
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
