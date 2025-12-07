// src/main.jsx

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";   // ⭐ ADDED
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard.jsx";

// Simple Auth Protection (temporary until backend auth is added)
function RequireAuth({ children }) {
  const loggedIn = localStorage.getItem("coreflex_logged_in") === "yes";
  return loggedIn ? children : <Navigate to="/" replace />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        {/* 🔐 LOGIN PAGE (default homepage) */}
        <Route path="/" element={<LoginPage />} />

        {/* 📝 REGISTER PAGE (public) */}
        <Route path="/register" element={<RegisterPage />} />   {/* ⭐ ADDED */}

        {/* 🖥️ MAIN PLATFORM (protected) */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <App />
            </RequireAuth>
          }
        />

        {/* 🚀 LAUNCH MODE PAGE (protected) */}
        <Route
          path="/launchMainDashboard"
          element={
            <RequireAuth>
              <LaunchedMainDashboard />
            </RequireAuth>
          }
        />

      </Routes>
    </BrowserRouter>
  </StrictMode>
);
