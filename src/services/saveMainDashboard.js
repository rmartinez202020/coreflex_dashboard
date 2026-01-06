// src/services/saveMainDashboard.js
import { API_URL } from "../config/api";

// ✅ Use the single source of truth (sessionStorage-first)
import { getToken } from "../utils/authToken";

const DEBUG_DASHBOARD_API = false;

export async function saveMainDashboard(dashboard) {
  const token = getToken();

  if (!token) throw new Error("Not authenticated (missing token)");
  if (!dashboard || typeof dashboard !== "object") {
    throw new Error("Invalid dashboard payload (must be an object)");
  }

  if (DEBUG_DASHBOARD_API) {
    console.log("[saveMainDashboard] POST /dashboard/main");
    console.log("[saveMainDashboard] token start:", token.slice(0, 25));
  }

  const res = await fetch(`${API_URL}/dashboard/main`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dashboard),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Save failed (${res.status}): ${errorText || res.statusText}`);
  }

  return await res.json();
}

export async function loadMainDashboard() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated (missing token)");

  const res = await fetch(`${API_URL}/dashboard/main`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Load failed (${res.status}): ${errorText || res.statusText}`);
  }

  return await res.json();
}
