// src/utils/authToken.js
// ✅ SINGLE SOURCE OF TRUTH: sessionStorage (per-tab)
// This fixes multi-tab login issues (two users in two tabs).

const TOKEN_KEY = "coreflex_access_token";

// remove any legacy keys that may exist from older versions
const LEGACY_KEYS = [
  "coreflex_token",
  "access_token",
  "token",
  "jwt",
  "coreflex_logged_in",
];

function wipeLegacy() {
  for (const k of LEGACY_KEYS) {
    try {
      localStorage.removeItem(k);
    } catch {}
    try {
      sessionStorage.removeItem(k);
    } catch {}
  }
}

export const getToken = () => {
  try {
    const t = sessionStorage.getItem(TOKEN_KEY) || "";
    return (t || "").trim();
  } catch {
    return "";
  }
};

export const setToken = (token) => {
  wipeLegacy();

  const t = (token || "").trim();

  try {
    if (!t) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("coreflex-auth-changed"));
      return;
    }

    sessionStorage.setItem(TOKEN_KEY, t);
    window.dispatchEvent(new Event("coreflex-auth-changed"));
  } catch {
    // if storage fails, still dispatch so UI can react
    window.dispatchEvent(new Event("coreflex-auth-changed"));
  }
};

export const clearAuth = () => {
  wipeLegacy();
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
  window.dispatchEvent(new Event("coreflex-auth-changed"));
};

export const isLoggedIn = () => !!getToken();

// ---------- JWT helpers ----------
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

/**
 * ✅ IMPORTANT:
 * Accept tokenOverride so we ALWAYS decode the SAME token used for API calls.
 */
export const getUserKeyFromToken = (tokenOverride) => {
  const token = (tokenOverride ?? getToken()).trim();
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  const userId = payload?.user_id;
  if (userId !== undefined && userId !== null && userId !== "") {
    return String(userId);
  }

  return payload?.sub ? String(payload.sub) : null;
};

// Optional debug helper
export const getTokenStart = (len = 25) => getToken().slice(0, len);

// ✅ helper for fetch headers
export const authHeader = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
