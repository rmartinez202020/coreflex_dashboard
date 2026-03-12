// src/pages/LoginPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import bgImage from "../assets/login_photo/satellite.jpg";
import logoWhite from "../assets/coreflex-logo-white.png";
import { API_URL } from "../config/api";

import { setToken, clearAuth } from "../utils/authToken";

const MIN_LOADING_TIME = 2000;

// ✅ Detect PHONES only (allow iPads + desktops)
function isPhoneDevice() {
  const ua = navigator.userAgent.toLowerCase();

  const isIphone = ua.includes("iphone") || ua.includes("ipod");
  const isAndroid = ua.includes("android");
  const isIPad = ua.includes("ipad");

  // Many Android phones include "mobile". Some tablets don't.
  const isMobileKeyword = ua.includes("mobile");

  // iPhone always blocked
  if (isIphone) return true;

  // Android phone blocked (android + mobile), but NOT iPad
  if (isAndroid && isMobileKeyword && !isIPad) return true;

  return false;
}

export default function LoginPage() {
  const formRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetInfo, setShowResetInfo] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // ✅ One-time phone detection
  const blockedPhone = useMemo(() => {
    try {
      return isPhoneDevice();
    } catch {
      return false;
    }
  }, []);

  const waitRemaining = async (startTime) => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // ✅ Hard block login on phones
    if (blockedPhone) {
      setError("Platform not supported on mobile phones. Please use a desktop or supported iPad.");
      return;
    }

    if (loading) return;
    setError("");
    setLoading(true);

    const startTime = Date.now();

    try {
      // ✅ Clear old auth first (removes legacy localStorage keys too)
      clearAuth();

      const emailClean = String(email || "").trim();

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailClean, password }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        await waitRemaining(startTime);
        throw new Error(data?.detail || data?.error || "Invalid email or password");
      }

      const token = String(data?.access_token || data?.token || "").trim();
      if (!token) {
        await waitRemaining(startTime);
        throw new Error("Login failed: missing access_token");
      }

      await waitRemaining(startTime);

      // ✅ Store token using your auth helper (sessionStorage only)
      setToken(token);

      // ✅ OPTIONAL (per-tab only)
      try {
        sessionStorage.setItem("coreflex_logged_in", "yes");
      } catch {
        // ignore
      }

      // ✅ Clear ONLY dashboard caches (not auth)
      localStorage.removeItem("mainDashboard");
      localStorage.removeItem("coreflex_main_dashboard");
      localStorage.removeItem("coreflex_last_dashboard");
      localStorage.removeItem("dashboard_layout");
      localStorage.removeItem("dashboardState");

      // ✅ Notify app (same-tab listeners)
      window.dispatchEvent(new Event("coreflex-auth-changed"));

      // ✅ Redirect to app
      window.location.assign("/app");
    } catch (err) {
      await waitRemaining(startTime);
      setError(err?.message || "Login failed");
      setLoading(false);
    }
  };

  const handlePasswordKeyEvent = (e) => {
    const caps = e.getModifierState && e.getModifierState("CapsLock");
    setCapsLockOn(!!caps);
  };

  const submitLogin = () => {
    if (loading) return;
    formRef.current?.requestSubmit?.();
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Enter") return;
      if (loading) return;
      if (e.isComposing) return;
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;

      const t = e.target;
      const tag = t?.tagName?.toLowerCase?.() || "";
      if (tag === "textarea") return;
      if (tag === "button" || tag === "a") return;
      if (!formRef.current) return;

      e.preventDefault();
      submitLogin();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading]);

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black opacity-40"></div>

      {/* ✅ CoreFlex logo top-left */}
      <img
        src={logoWhite}
        alt="CoreFlex Logo"
        className="absolute top-6 left-6 z-20 select-none pointer-events-none"
        style={{
          width: "170px",
          height: "auto",
          objectFit: "contain",
        }}
      />

      <div className="relative bg-white bg-opacity-90 backdrop-blur-md shadow-2xl rounded-xl p-10 w-full max-w-lg z-10">
        <h1 className="text-3xl font-bold text-center text-[#1e293b] mb-4">
          CoreFlex IIoTs Platform
        </h1>

        {/* ✅ If phone: show block message and DO NOT render login form */}
        {blockedPhone ? (
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              <b>Platform Not Supported</b>
              <div className="mt-1">
                CoreFlex IIoTs Platform is not supported on mobile phones.
              </div>
              <div className="mt-1">
                Please use a desktop computer or a supported iPad.
              </div>
            </div>

            <div className="text-gray-700 text-sm">
              Need help? Email{" "}
              <a
                href="mailto:info@coreflexalliance.net"
                className="text-blue-600 font-semibold hover:underline"
              >
                info@coreflexalliance.net
              </a>
            </div>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-6">
              Login to access your account
            </p>

            {error && (
              <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm mb-4">
                {error}
              </div>
            )}

            <form ref={formRef} onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full border rounded px-3 py-2 text-gray-800 disabled:bg-gray-100"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={handlePasswordKeyEvent}
                  onKeyDown={handlePasswordKeyEvent}
                  required
                  disabled={loading}
                  className="w-full border rounded px-3 py-2 text-gray-800 disabled:bg-gray-100"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />

                {capsLockOn && (
                  <div className="mt-1 text-sm text-yellow-600">
                    ⚠️ Caps Lock is ON
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 rounded mt-4 text-white transition ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Logging in…" : "Login"}
              </button>
            </form>

            <div className="text-center text-gray-600 text-sm mt-4">
              <div className="flex items-center justify-center gap-2">
                <span>Forgot your password?</span>
                <button
                  type="button"
                  onClick={() => setShowResetInfo((prev) => !prev)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                  title="How to reset password"
                >
                  ℹ️
                </button>
              </div>

              {showResetInfo && (
                <div className="mt-2 text-gray-700">
                  Request a Reset Password at{" "}
                  <a
                    href="mailto:info@coreflexalliance.net"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    info@coreflexalliance.net
                  </a>
                </div>
              )}
            </div>

            <p className="text-center text-gray-600 text-sm mt-4">
              Don’t have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 font-semibold hover:underline"
              >
                Create one
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}