// src/utils/authToken.js
// ✅ SINGLE SOURCE OF TRUTH: localStorage only

const TOKEN_KEY = "coreflex_access_token";

// ✅ remove any legacy keys that may exist from older versions
// (IMPORTANT: include BOTH localStorage + sessionStorage cases)
const LEGACY_KEYS = [
  // tokens
  "coreflex_token",
  "coreflex_access_token",
  "access_token",
  "token",
  "jwt",

  // flags
  "coreflex_logged_in",
  "coreflex_is_logged_in",
];

// ✅ wipe keys from BOTH storages (prevents “mixed user” after login switching)
function wipeKeyEverywhere(k) {
  try {
    localStorage.removeItem(k);
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(k);
  } catch {
    // ignore
  }
}

export const clearAllAuthStorage = () => {
  // wipe all known keys in both storages
  for (const k of LEGACY_KEYS) wipeKeyEverywhere(k);
};

export const getToken = () => {
  const t = localStorage.getItem(TOKEN_KEY) || "";
  return (t || "").trim();
};

export const setToken = (token) => {
  const t = (token || "").trim();

  // ✅ wipe legacy keys so old code can’t “win”
  // (also wipes sessionStorage leftovers)
  clearAllAuthStorage();

  if (!t) {
    wipeKeyEverywhere(TOKEN_KEY);
    window.dispatchEvent(new Event("coreflex-auth-changed"));
    return;
  }

  // ✅ store ONLY here (source of truth)
  localStorage.setItem(TOKEN_KEY, t);

  // ✅ Optional compatibility flag (ONLY if you still have old guards checking it)
  // Keeping it in localStorage is fine as long as it is rewritten on every login.
  localStorage.setItem("coreflex_logged_in", "yes");

  window.dispatchEvent(new Event("coreflex-auth-changed"));
};

export const clearAuth = () => {
  wipeKeyEverywhere(TOKEN_KEY);
  clearAllAuthStorage();
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

/**
 * ✅ NEW:
 * Get email/username from token so UI can correctly detect owner-only sections.
 * (supports common claim names)
 */
export const getEmailFromToken = (tokenOverride) => {
  const token = (tokenOverride ?? getToken()).trim();
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  return (
    payload?.email ||
    payload?.user_email ||
    payload?.username ||
    payload?.preferred_username ||
    payload?.sub ||
    null
  );
};

// Optional debug helper
export const getTokenStart = (len = 25) => getToken().slice(0, len);

// ✅ helper for fetch headers
export const authHeader = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
