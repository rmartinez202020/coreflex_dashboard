// src/utils/authToken.js

const TOKEN_KEY = "coreflex_token";
const LOGIN_KEY = "coreflex_logged_in";

// ✅ single source of truth: localStorage
export const getToken = () => (localStorage.getItem(TOKEN_KEY) || "").trim();

export const setToken = (token) => {
  const t = (token || "").trim();
  if (!t) return;
  localStorage.setItem(TOKEN_KEY, t);
  localStorage.setItem(LOGIN_KEY, "yes");
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LOGIN_KEY);

  // also clean sessionStorage in case old code wrote there
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(LOGIN_KEY);
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
    return String(userId);
  }

  return payload?.sub ? String(payload.sub) : null;
};
