// src/components/Header.jsx
import { useEffect, useState } from "react";

/**
 * Header
 * - Displays welcome message (name + email)
 * - Displays Logout button
 * - Pure UI component (no routing logic)
 */
export default function Header({ onLogout }) {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // ✅ base64url-safe JWT payload decode
  const decodeJwtPayload = (token) => {
    try {
      const part = token.split(".")[1];
      if (!part) return null;

      // base64url → base64
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");

      // pad
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

      const json = atob(padded);
      return JSON.parse(json);
    } catch (err) {
      console.error("Header: failed to decode auth token", err);
      return null;
    }
  };

  const toNiceName = (email) =>
    (email || "")
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const syncFromToken = () => {
    const token = localStorage.getItem("coreflex_token");

    if (!token) {
      setUserEmail("");
      setUserName("");
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      setUserEmail("");
      setUserName("");
      return;
    }

    const email = payload.email || payload.sub || "";
    const name = payload.name || payload.full_name || toNiceName(email);

    setUserEmail(email);
    setUserName(name);
  };

  // ✅ Decode on mount + refresh whenever auth changes
  useEffect(() => {
    syncFromToken();

    const onAuthChanged = () => syncFromToken();
    window.addEventListener("coreflex-auth-changed", onAuthChanged);
    return () => window.removeEventListener("coreflex-auth-changed", onAuthChanged);
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
        type="button" // ✅ IMPORTANT
        onClick={onLogout} // ✅ must call the real logout handler
        className="px-3 py-1 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 shadow"
      >
        Logout
      </button>
    </header>
  );
}
