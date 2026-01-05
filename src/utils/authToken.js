// src/utils/authToken.js

export const getToken = () => localStorage.getItem("coreflex_token");

export const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
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

  return payload?.user_id != null ? String(payload.user_id) : payload?.sub || null;
};
