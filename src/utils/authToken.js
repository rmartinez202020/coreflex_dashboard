// src/utils/authToken.js
//
// ✅ FIX: support multi-user in SAME BROWSER by using sessionStorage first.
// - sessionStorage = per-tab (no collisions between tabs/users)
// - localStorage  = fallback for backwards compatibility
//
// IMPORTANT:
// - Update LoginPage to write token to sessionStorage (recommended).
// - Keep fallback to localStorage so existing users still work.

const TOKEN_KEY = "coreflex_token";
const LOGGED_IN_KEY = "coreflex_logged_in";

// ✅ Always read token at call-time (no caching)
export const getToken = () => {
  const t =
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY);

  return (t || "").trim();
};

// Optional: quick debug helper
export const getTokenStart = (len = 25) => {
  const t = getToken();
  return t ? t.slice(0, len) : "";
};

// ✅ Prefer sessionStorage going forward (per-tab auth)
export const setToken = (token) => {
  const clean = (token || "").trim();
  if (!clean) return;

  sessionStorage.setItem(TOKEN_KEY, clean);
  sessionStorage.setItem(LOGGED_IN_KEY, "yes");

  // Optional: remove localStorage token to prevent cross-tab collisions
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LOGGED_IN_KEY);
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

// ✅ Returns stable user identity from token
// Prefer user_id if present, otherwise fallback to sub (email)
export const getUserKeyFromToken = () => {
  const token = getToken();
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  const userId = payload?.user_id;

  // Prefer numeric user id (stable + avoids "9" vs 9 comparison issues)
  if (userId !== undefined && userId !== null && userId !== "") {
    const n = Number(userId);
    return Number.isFinite(n) ? n : String(userId);
  }

  // fallback to email (sub)
  return payload?.sub ? String(payload.sub) : null;
};

// ✅ Clears BOTH storages (prevents “ghost” sessions)
export const clearAuth = () => {
  sessionStorage.removeItem(LOGGED_IN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(LOGGED_IN_KEY);
  localStorage.removeItem(TOKEN_KEY);
};
