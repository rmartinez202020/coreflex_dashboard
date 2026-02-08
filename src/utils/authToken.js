// src/utils/authToken.js
// ✅ SINGLE SOURCE OF TRUTH: sessionStorage (tab-isolated)
// This prevents "User A" and "User B" from overwriting each other in the same browser.

const TOKEN_KEY = "coreflex_access_token";

// Remove any legacy keys that may exist from older versions
const LEGACY_KEYS = [
  "coreflex_token",
  "access_token",
  "token",
  "jwt",
  "coreflex_logged_in",
];

// ---- helpers ----
const removeEverywhere = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {}
  try {
    sessionStorage.removeItem(key);
  } catch {}
};

const setSession = (key, val) => {
  try {
    sessionStorage.setItem(key, val);
  } catch {}
};

const getSession = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const getLocal = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

// ✅ Token read: session first, then local fallback (for old deployments)
export const getToken = () => {
  const t = getSession(TOKEN_KEY) || getLocal(TOKEN_KEY) || "";
  return String(t || "").trim();
};

// ✅ Token write: session ONLY (tab isolated)
export const setToken = (token) => {
  const t = String(token || "").trim();

  // wipe legacy keys so old code can’t “win”
  for (const k of LEGACY_KEYS) removeEverywhere(k);

  if (!t) {
    removeEverywhere(TOKEN_KEY);
    window.dispatchEvent(new Event("coreflex-auth-changed"));
    return;
  }

  // ✅ store token in sessionStorage ONLY
  setSession(TOKEN_KEY, t);

  // ✅ OPTIONAL (DO NOT enable if you want multiple users in same browser)
  // localStorage.setItem(TOKEN_KEY, t);

  window.dispatchEvent(new Event("coreflex-auth-changed"));
};

export const clearAuth = () => {
  removeEverywhere(TOKEN_KEY);
  for (const k of LEGACY_KEYS) removeEverywhere(k);
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
  const token = String(tokenOverride ?? getToken()).trim();
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
