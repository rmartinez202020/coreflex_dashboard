// src/utils/authToken.js

// ✅ Always read from localStorage at call-time (no caching)
export const getToken = () => {
  const t = localStorage.getItem("coreflex_token");
  return (t || "").trim(); // avoid whitespace issues
};

// Optional: quick debug helper
export const getTokenStart = (len = 25) => {
  const t = getToken();
  return t ? t.slice(0, len) : "";
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

// Optional helper (nice to have for logout code)
export const clearAuth = () => {
  localStorage.removeItem("coreflex_logged_in");
  localStorage.removeItem("coreflex_token");
};
