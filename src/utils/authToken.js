// src/utils/authToken.js
// ✅ SINGLE SOURCE OF TRUTH: sessionStorage-first (with localStorage fallback)

const TOKEN_KEY = "coreflex_token";
const LOGGED_IN_KEY = "coreflex_logged_in";

export const getToken = () => {
  const t =
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY) ||
    "";
  return (t || "").trim();
};

export const setToken = (token) => {
  const t = (token || "").trim();
  if (!t) return;

  // ✅ store in session (preferred)
  sessionStorage.setItem(TOKEN_KEY, t);
  sessionStorage.setItem(LOGGED_IN_KEY, "yes");

  // ✅ optional: keep localStorage in sync to avoid old code paths breaking
  // If you want TRUE single source, comment these two lines out.
  localStorage.setItem(TOKEN_KEY, t);
  localStorage.setItem(LOGGED_IN_KEY, "yes");

  // ✅ notify same-tab listeners
  window.dispatchEvent(new Event("coreflex-auth-changed"));
};

export const clearAuth = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(LOGGED_IN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LOGGED_IN_KEY);

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
