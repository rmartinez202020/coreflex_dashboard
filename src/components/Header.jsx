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

  // Decode JWT once for display purposes
  useEffect(() => {
    const token = localStorage.getItem("coreflex_token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      const email = payload.sub || "";
      const name =
        payload.name ||
        email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

      setUserEmail(email);
      setUserName(name);
    } catch (err) {
      console.error("Header: failed to decode auth token", err);
    }
  }, []);

  return (
    <header className="absolute top-2 right-4 flex items-center gap-4">
      <div className="text-right">
        <div className="text-gray-800 font-medium text-sm">
          Welcome, {userName}
        </div>
        <div className="text-gray-500 text-xs">
          {userEmail}
        </div>
      </div>

      <button
        onClick={onLogout}
        className="px-3 py-1 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 shadow"
      >
        Logout
      </button>
    </header>
  );
}
