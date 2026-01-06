// src/utils/authToken.js

// ✅ sessionStorage first (per-tab), fallback to localStorage (legacy)
export const getToken = () => {
  const t =
    sessionStorage.getItem("coreflex_token") ||
    localStorage.getItem("coreflex_token");
  return (t || "").trim();
};

export const setToken = (token) => {
  const clean = (token || "").trim();
  if (!clean) return;

  // ✅ per-tab token
  sessionStorage.setItem("coreflex_token", clean);
  sessionStorage.setItem("coreflex_logged_in", "yes");

  // ✅ wipe legacy localStorage to prevent cross-user bleed
  localStorage.removeItem("coreflex_token");
  localStorage.removeItem("coreflex_logged_in");
};

export const isLoggedIn = () => !!getToken();

export const parseJwt = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const getUserKeyFromToken = () => {
  const token = getToken();
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  const userId = payload?.user_id;
  if (userId !== undefined && userId !== null && userId !== "") {
    const n = Number(userId);
    return Number.isFinite(n) ? n : String(userId);
  }

  return payload?.sub ? String(payload.sub) : null;
};

export const clearAuth = () => {
  sessionStorage.removeItem("coreflex_logged_in");
  sessionStorage.removeItem("coreflex_token");
  localStorage.removeItem("coreflex_logged_in");
  localStorage.removeItem("coreflex_token");
};
