// src/components/Header.jsx
import { useEffect, useState } from "react";
import { getToken, parseJwt } from "../utils/authToken";

/**
 * Header
 * - Displays welcome message (name + email)
 * - Displays Logout button
 * - Pure UI component (no routing logic)
 *
 * ✅ IMPORTANT:
 * - Must read auth from sessionStorage per-tab via getToken()
 * - Never use localStorage for identity (cross-tab pollution)
 */
export default function Header({ onLogout }) {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  const toNiceName = (email) =>
    (email || "")
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const syncFromToken = () => {
    const token = getToken(); // ✅ per-tab token (sessionStorage-first)

    if (!token) {
      setUserEmail("");
      setUserName("");
      return;
    }

    const payload = parseJwt(token); // ✅ already base64url-safe in your util
    if (!payload) {
      setUserEmail("");
      setUserName("");
      return;
    }

    // Try several common fields
    const email =
      payload.email ||
      payload.user?.email ||
      (typeof payload.sub === "string" && payload.sub.includes("@")
        ? payload.sub
        : "") ||
      payload.username ||
      "";

    const name =
      payload.name ||
      payload.full_name ||
      payload.user?.name ||
      payload.user?.full_name ||
      toNiceName(email);

    setUserEmail(String(email || "").trim());
    setUserName(String(name || "").trim());
  };

  useEffect(() => {
    // initial
    syncFromToken();

    // auth event (same tab)
    const onAuthChanged = () => syncFromToken();
    window.addEventListener("coreflex-auth-changed", onAuthChanged);

    // ✅ also resync when returning to tab
    const onVis = () => {
      if (document.visibilityState === "visible") syncFromToken();
    };
    const onFocus = () => syncFromToken();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("coreflex-auth-changed", onAuthChanged);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <header className="absolute top-2 right-4 flex items-center gap-4">
      <div className="text-right">
        <div className="text-gray-800 font-medium text-sm">
          Welcome, {userName || "User"}
        </div>
        <div className="text-gray-500 text-xs">{userEmail || ""}</div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="px-3 py-1 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 shadow"
      >
        Logout
      </button>
    </header>
  );
}
