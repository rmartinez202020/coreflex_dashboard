// src/main.jsx

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import "./index.css";
import App from "./App.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LaunchedMainDashboard from "./pages/LaunchedMainDashboard.jsx";
import AlarmLogPage from "./pages/AlarmLogPage.jsx"; // ✅ NEW

// ✅ Use the SAME token source as API calls
import { getToken } from "./utils/authToken";

// 🔐 Auth Protection (token-based, prevents “mixed user” issues)
function RequireAuth({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/" replace />;
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

      {/* 🚀 LAUNCH MODE */}
      <Route
        path="/launchMainDashboard"
        element={
          <RequireAuth>
            <LaunchedMainDashboard />
          </RequireAuth>
        }
      />

      {/* 🚀 LAUNCH ALARM LOG (protected) ✅ NEW */}
      <Route
        path="/launchAlarmLog"
        element={
          <RequireAuth>
            <AlarmLogPage />
          </RequireAuth>
        }
      />
    </Routes>
  </BrowserRouter>
);
