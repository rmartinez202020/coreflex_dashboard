// src/utils/authToken.js
// ✅ SINGLE SOURCE OF TRUTH: localStorage only

const TOKEN_KEY = "coreflex_access_token";

// remove any legacy keys that may exist from older versions
const LEGACY_KEYS = [
  "coreflex_token",
  "access_token",
  "token",
  "jwt",
  "coreflex_logged_in",
];

export const getToken = () => {
  const t = localStorage.getItem(TOKEN_KEY) || "";
  return (t || "").trim();
};

export const setToken = (token) => {
  const t = (token || "").trim();

  // wipe legacy keys so old code can’t “win”
  for (const k of LEGACY_KEYS) localStorage.removeItem(k);

  if (!t) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event("coreflex-auth-changed"));
    return;
  }

  localStorage.setItem(TOKEN_KEY, t);
  window.dispatchEvent(new Event("coreflex-auth-changed"));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  for (const k of LEGACY_KEYS) localStorage.removeItem(k);
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
