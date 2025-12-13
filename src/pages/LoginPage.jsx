
throw new Error("🔥 THIS LOGIN FILE IS LOADED 🔥");




import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_URL } from "../config/api";
console.log("API URL =", API_URL);

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("🔥 LOGIN CLICKED");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("🔁 Response status:", res.status);

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await res.json();
      console.log("✅ LOGIN SUCCESS:", data);

      localStorage.setItem("coreflex_logged_in", "yes");
      localStorage.setItem("coreflex_token", data.access_token);

      navigate("/app");
    } catch (err) {
      console.error("❌ LOGIN ERROR:", err);
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Login</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
