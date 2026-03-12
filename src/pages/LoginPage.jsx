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

  const isMobileKeyword = ua.includes("mobile");

  if (isIphone) return true;
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

    if (blockedPhone) {
      setError("Platform not supported on mobile phones. Please use a desktop or supported iPad.");
      return;
    }

    if (loading) return;
    setError("");
    setLoading(true);

    const startTime = Date.now();

    try {
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

      setToken(token);

      try {
        sessionStorage.setItem("coreflex_logged_in", "yes");
      } catch {
        // ignore
      }

      localStorage.removeItem("mainDashboard");
      localStorage.removeItem("coreflex_main_dashboard");
      localStorage.removeItem("coreflex_last_dashboard");
      localStorage.removeItem("dashboard_layout");
      localStorage.removeItem("dashboardState");

      window.dispatchEvent(new Event("coreflex-auth-changed"));
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
      {/* ✅ dark overlay */}
      <div className="absolute inset-0 bg-black opacity-45"></div>

      {/* ✅ animated digital falling data behind the login section */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="data-stream stream-1"></div>
        <div className="data-stream stream-2"></div>
        <div className="data-stream stream-3"></div>
        <div className="data-stream stream-4"></div>
        <div className="data-stream stream-5"></div>
        <div className="data-stream stream-6"></div>
        <div className="data-stream stream-7"></div>
        <div className="data-stream stream-8"></div>
      </div>

      {/* ✅ soft glow behind card area */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          width: "560px",
          height: "560px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(0,170,255,0.18) 0%, rgba(0,170,255,0.08) 35%, rgba(0,170,255,0.02) 55%, transparent 72%)",
          filter: "blur(28px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-4">
        {/* ✅ CoreFlex logo centered above the card */}
        <img
          src={logoWhite}
          alt="CoreFlex Logo"
          className="mb-5 select-none pointer-events-none"
          style={{
            width: "92px",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 0 10px rgba(255,255,255,0.20))",
          }}
        />

        <div className="relative bg-white/88 backdrop-blur-md shadow-2xl rounded-2xl p-10 w-full max-w-lg border border-white/20">
          <h1 className="text-3xl font-bold text-center text-[#1e293b] mb-4">
            CoreFlex IIoTs Platform
          </h1>

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

      <style>{`
        .data-stream {
          position: absolute;
          top: -30%;
          width: 2px;
          height: 260px;
          background: linear-gradient(
            to bottom,
            rgba(80, 200, 255, 0) 0%,
            rgba(120, 225, 255, 0.18) 20%,
            rgba(160, 240, 255, 0.85) 50%,
            rgba(120, 225, 255, 0.18) 80%,
            rgba(80, 200, 255, 0) 100%
          );
          box-shadow:
            0 0 8px rgba(140, 235, 255, 0.35),
            0 0 18px rgba(100, 210, 255, 0.18);
          opacity: 0.65;
          filter: blur(0.3px);
          animation-name: fallData;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .stream-1 { left: 18%; animation-duration: 7s; animation-delay: -1s; }
        .stream-2 { left: 27%; animation-duration: 9s; animation-delay: -5s; }
        .stream-3 { left: 39%; animation-duration: 8s; animation-delay: -2s; }
        .stream-4 { left: 46%; animation-duration: 6.5s; animation-delay: -4s; }
        .stream-5 { left: 54%; animation-duration: 8.8s; animation-delay: -3s; }
        .stream-6 { left: 63%; animation-duration: 7.3s; animation-delay: -6s; }
        .stream-7 { left: 74%; animation-duration: 10s; animation-delay: -2.5s; }
        .stream-8 { left: 84%; animation-duration: 7.8s; animation-delay: -7s; }

        @keyframes fallData {
          0% {
            transform: translateY(-25vh);
            opacity: 0;
          }
          12% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.8;
          }
          88% {
            opacity: 0.45;
          }
          100% {
            transform: translateY(130vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}