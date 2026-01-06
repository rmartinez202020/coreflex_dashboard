// src/utils/authToken.js

const TOKEN_KEY = "coreflex_token";
const LOGGED_IN_KEY = "coreflex_logged_in";

// ✅ per-tab auth first (sessionStorage), fallback to localStorage
export const getToken = () => {
  const t =
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY);

  return (t || "").trim();
};

export const getTokenStart = (len = 25) => {
  const t = getToken();
  return t ? t.slice(0, len) : "";
};

export const setToken = (token) => {
  const clean = (token || "").trim();
  if (!clean) return;

  sessionStorage.setItem(TOKEN_KEY, clean);
  sessionStorage.setItem(LOGGED_IN_KEY, "yes");

  // Prevent cross-tab collisions
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LOGGED_IN_KEY);
};

// ✅ IMPORTANT: your app should use THIS to decide if user is logged in
export const isLoggedIn = () => {
  const hasSessionFlag = sessionStorage.getItem(LOGGED_IN_KEY) === "yes";
  const hasLocalFlag = localStorage.getItem(LOGGED_IN_KEY) === "yes";
  const hasToken = !!getToken();
  return hasSessionFlag || hasLocalFlag || hasToken;
};

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
  sessionStorage.removeItem(LOGGED_IN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(LOGGED_IN_KEY);
  localStorage.removeItem(TOKEN_KEY);
};
