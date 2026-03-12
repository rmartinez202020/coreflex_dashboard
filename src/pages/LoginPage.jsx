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
      setError(
        "Platform not supported on mobile phones. Please use a desktop or supported iPad."
      );
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
      {/* ✅ darker overlay so background does not fight with text */}
      <div className="absolute inset-0 bg-black opacity-55"></div>

      {/* ✅ more animated digital falling data */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="data-stream stream-1"></div>
        <div className="data-stream stream-2"></div>
        <div className="data-stream stream-3"></div>
        <div className="data-stream stream-4"></div>
        <div className="data-stream stream-5"></div>
        <div className="data-stream stream-6"></div>
        <div className="data-stream stream-7"></div>
        <div className="data-stream stream-8"></div>
        <div className="data-stream stream-9"></div>
        <div className="data-stream stream-10"></div>
        <div className="data-stream stream-11"></div>
        <div className="data-stream stream-12"></div>
        <div className="data-stream stream-13"></div>
        <div className="data-stream stream-14"></div>
        <div className="data-stream stream-15"></div>
        <div className="data-stream stream-16"></div>
      </div>

      {/* ✅ soft glow behind card area */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          width: "620px",
          height: "620px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(0,170,255,0.14) 0%, rgba(0,170,255,0.07) 36%, rgba(0,170,255,0.02) 58%, transparent 74%)",
          filter: "blur(34px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-4">
        {/* ✅ Bigger logo */}
        <img
          src={logoWhite}
          alt="CoreFlex Logo"
          className="mb-5 select-none pointer-events-none"
          style={{
            width: "138px",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 0 12px rgba(255,255,255,0.28))",
          }}
        />

        {/* ✅ Smaller login card + stronger visibility */}
        <div className="relative w-full max-w-[460px] rounded-[22px] border border-white/30 bg-white/30 backdrop-blur-xl shadow-2xl px-8 py-9">
          <h1 className="text-[2.15rem] font-extrabold text-center text-slate-950 mb-3 tracking-tight">
            CoreFlex IIoTs Platform
          </h1>

          {blockedPhone ? (
            <div className="text-center">
              <div className="bg-red-50/95 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-4">
                <b>Platform Not Supported</b>
                <div className="mt-1">
                  CoreFlex IIoTs Platform is not supported on mobile phones.
                </div>
                <div className="mt-1">
                  Please use a desktop computer or a supported iPad.
                </div>
              </div>

              <div className="text-slate-900 text-sm font-medium">
                Need help? Email{" "}
                <a
                  href="mailto:info@coreflexalliance.net"
                  className="text-blue-700 font-semibold hover:underline"
                >
                  info@coreflexalliance.net
                </a>
              </div>
            </div>
          ) : (
            <>
              <p className="text-center text-slate-800 text-base font-semibold mb-6">
                Login to access your account
              </p>

              {error && (
                <div className="bg-red-100/95 text-red-800 px-3 py-2 rounded text-sm mb-4 border border-red-200">
                  {error}
                </div>
              )}

              <form ref={formRef} onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[15px] font-bold mb-2 text-slate-900">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 bg-white/95 disabled:bg-gray-100 shadow-sm"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-bold mb-2 text-slate-900">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handlePasswordKeyEvent}
                    onKeyDown={handlePasswordKeyEvent}
                    required
                    disabled={loading}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 bg-white/95 disabled:bg-gray-100 shadow-sm"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />

                  {capsLockOn && (
                    <div className="mt-2 text-sm font-semibold text-yellow-700">
                      ⚠️ Caps Lock is ON
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg mt-1 text-white font-semibold text-lg transition ${
                    loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Logging in…" : "Login"}
                </button>
              </form>

              <div className="text-center text-slate-800 text-sm mt-5">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold">Forgot your password?</span>
                  <button
                    type="button"
                    onClick={() => setShowResetInfo((prev) => !prev)}
                    className="text-blue-700 hover:text-blue-800 font-semibold"
                    title="How to reset password"
                  >
                    ℹ️
                  </button>
                </div>

                {showResetInfo && (
                  <div className="mt-3 text-slate-900 font-semibold">
                    Request a Reset Password at{" "}
                    <a
                      href="mailto:info@coreflexalliance.net"
                      className="text-blue-700 font-semibold hover:underline"
                    >
                      info@coreflexalliance.net
                    </a>
                  </div>
                )}
              </div>

              <p className="text-center text-slate-800 text-sm mt-4 font-semibold">
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-700 font-semibold hover:underline"
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
          top: -24%;
          width: 2px;
          height: 260px;
          background: linear-gradient(
            to bottom,
            rgba(80, 200, 255, 0) 0%,
            rgba(120, 225, 255, 0.12) 18%,
            rgba(160, 240, 255, 0.58) 50%,
            rgba(120, 225, 255, 0.12) 82%,
            rgba(80, 200, 255, 0) 100%
          );
          box-shadow:
            0 0 6px rgba(140, 235, 255, 0.22),
            0 0 14px rgba(100, 210, 255, 0.12);
          opacity: 0.42;
          filter: blur(0.3px);
          animation-name: fallDataToGround;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .stream-1  { left: 6%;  animation-duration: 7.2s; animation-delay: -1.0s; }
        .stream-2  { left: 12%; animation-duration: 8.6s; animation-delay: -5.0s; }
        .stream-3  { left: 18%; animation-duration: 7.8s; animation-delay: -2.0s; }
        .stream-4  { left: 24%; animation-duration: 9.2s; animation-delay: -4.0s; }
        .stream-5  { left: 30%; animation-duration: 8.1s; animation-delay: -3.0s; }
        .stream-6  { left: 36%; animation-duration: 7.0s; animation-delay: -6.0s; }
        .stream-7  { left: 42%; animation-duration: 8.9s; animation-delay: -2.5s; }
        .stream-8  { left: 48%; animation-duration: 7.5s; animation-delay: -7.0s; }
        .stream-9  { left: 54%; animation-duration: 8.4s; animation-delay: -1.5s; }
        .stream-10 { left: 60%; animation-duration: 7.6s; animation-delay: -5.5s; }
        .stream-11 { left: 66%; animation-duration: 9.4s; animation-delay: -3.5s; }
        .stream-12 { left: 72%; animation-duration: 7.9s; animation-delay: -6.5s; }
        .stream-13 { left: 78%; animation-duration: 8.8s; animation-delay: -2.2s; }
        .stream-14 { left: 84%; animation-duration: 7.3s; animation-delay: -4.8s; }
        .stream-15 { left: 90%; animation-duration: 8.0s; animation-delay: -1.8s; }
        .stream-16 { left: 95%; animation-duration: 9.0s; animation-delay: -6.8s; }

        @keyframes fallDataToGround {
          0% {
            transform: translateY(-18vh);
            opacity: 0;
          }
          10% {
            opacity: 0.28;
          }
          45% {
            opacity: 0.50;
          }
          80% {
            opacity: 0.30;
          }
          100% {
            transform: translateY(76vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}