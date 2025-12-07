import { useState } from "react";
import { Link } from "react-router-dom";  // ⭐ required for navigation
import bgImage from "../assets/login_photo/satellite.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Temporary "fake" login (we will replace with backend auth)
    if (email === "admin@coreflex.com" && password === "1234") {
      localStorage.setItem("coreflex_logged_in", "yes");
      window.location.href = "/app";
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "bottom",  
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black opacity-40"></div>

      {/* LOGIN CARD */}
      <div className="relative bg-white bg-opacity-90 backdrop-blur-md shadow-2xl rounded-xl p-10 w-full max-w-md z-10">
        
        <h1 className="text-3xl font-bold text-center text-[#1e293b] mb-4">
          CoreFlex IIoTs Platform
        </h1>

        <p className="text-center text-gray-600 mb-6">
          Login to access your dashboard
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 text-gray-800"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-gray-800"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4"
          >
            Login
          </button>
        </form>

        {/* ⭐ REGISTER LINK */}
        <p className="text-center text-gray-600 text-sm mt-4">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
