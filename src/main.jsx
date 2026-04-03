// src/main.jsx
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import LaunchedCustomerDashboard from "./pages/LaunchedCustomerDashboard.jsx";
import "./index.css";
import App from "./App.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard.jsx";
import AlarmLogPage from "./pages/AlarmLogPage.jsx";

// ✅ use shared auth util (now sessionStorage per-tab)
import { isLoggedIn } from "./utils/authToken";

// 🔐 Simple Auth Protection
function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />;
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* 🔐 LOGIN PAGE */}
      <Route path="/" element={<LoginPage />} />

      {/* 📝 REGISTER PAGE */}
      <Route path="/register" element={<RegisterPage />} />

      {/* 🖥️ MAIN APP (protected) */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />

      {/* 🚀 LAUNCH MAIN DASHBOARD (protected) */}
      <Route
        path="/launchMainDashboard"
        element={
          <RequireAuth>
            <LaunchedMainDashboard />
          </RequireAuth>
        }
      />

      {/* 🚀 PRIVATE CUSTOMER DASHBOARD LAUNCH (protected, old path) */}
      <Route
        path="/launchDashboard/:dashboardId"
        element={
          <RequireAuth>
            <LaunchedCustomerDashboard />
          </RequireAuth>
        }
      />

      {/* 🌐 PUBLIC CUSTOMER DASHBOARD LAUNCH (NO LOGIN) */}
      <Route
        path="/launchDashboard/:dashboardSlug/:publicLaunchId"
        element={<LaunchedCustomerDashboard />}
      />

      {/* 🚀 LAUNCH ALARM LOG (protected) */}

      <Route path="/launchAlarmLog" element={<AlarmLogPage />} />


    </Routes>
  </BrowserRouter>
);