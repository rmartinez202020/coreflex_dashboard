import { API_URL } from "../config/api";

/**
 * Save Main Dashboard
 * Sends the full dashboard object to the backend
 */
export async function saveMainDashboard(dashboard) {
  const token = localStorage.getItem("coreflex_token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  if (!dashboard || typeof dashboard !== "object") {
    throw new Error("Invalid dashboard payload");
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
    const errorText = await res.text();
    throw new Error(`Save failed: ${errorText}`);
  }

  return await res.json();
}

