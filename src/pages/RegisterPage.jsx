// src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import bgImage from "../assets/login_photo/satellite.jpg";
import logoWhite from "../assets/coreflex-logo-white.png";

import { API_URL } from "../config/api";

export default function RegisterPage() {
  const CONTROL_TERMS_VERSION = "v1.0";

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedControlTerms: false,
    showControlTerms: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // ✅ Prevent checking acknowledgment before user clicks View
    if (name === "acceptedControlTerms" && !form.showControlTerms) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleToggleTerms = () => {
    setForm((prev) => {
      const nextShow = !prev.showControlTerms;

      return {
        ...prev,
        showControlTerms: nextShow,
        // ✅ If user hides terms again, force acknowledgment back off
        acceptedControlTerms: nextShow ? prev.acceptedControlTerms : false,
      };
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.showControlTerms) {
      setError(
        "Please click View and review the Control & Automation Acknowledgment before creating an account."
      );
      return;
    }

    if (!form.acceptedControlTerms) {
      setError(
        "You must accept the Control & Automation Acknowledgment to create an account."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          password: form.password,
          accepted_control_terms: true,
          control_terms_version: CONTROL_TERMS_VERSION,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Registration failed.");
        return;
      }

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Unable to reach server. Please try again.");
    }
  };

  const inputClass =
    "w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 bg-white/95 shadow-sm";

  const acknowledgmentEnabled = form.showControlTerms;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ✅ same dark overlay as login */}
      <div className="absolute inset-0 bg-black opacity-55"></div>

      {/* ✅ same falling lines as login */}
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

      {/* ✅ same glow as login */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          width: "900px",
          height: "900px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(0,170,255,0.14) 0%, rgba(0,170,255,0.07) 36%, rgba(0,170,255,0.02) 58%, transparent 74%)",
          filter: "blur(34px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl">
        {/* ✅ same logo treatment as login */}
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

        <div className="relative w-full rounded-[22px] border border-white/30 bg-white/30 backdrop-blur-xl shadow-2xl px-6 py-7 md:px-8 md:py-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-center text-slate-950 mb-2 tracking-tight">
            Create Your CoreFlex Account
          </h1>

          <p className="text-center text-slate-800 text-base font-semibold mb-5">
            Fill in the information below to get started
          </p>

          {error && (
            <div className="bg-red-100/95 text-red-800 px-3 py-2 rounded text-sm mb-4 border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100/95 text-green-800 px-3 py-2 rounded text-sm mb-4 border border-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[15px] font-bold mb-2 text-slate-900">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-[15px] font-bold mb-2 text-slate-900">
                  Company
                </label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="CoreFlex Alliance"
                />
              </div>

              <div>
                <label className="block text-[15px] font-bold mb-2 text-slate-900">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-[15px] font-bold mb-2 text-slate-900">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[15px] font-bold mb-2 text-slate-900">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>

              <div className="lg:col-span-2">
                <div className="border border-white/30 rounded-xl p-4 bg-white/70 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        🔐 Control &amp; Automation Acknowledgment
                      </h3>
                      <p className="text-xs text-slate-700 mt-1 font-medium">
                        CoreFlex IIoTs Platform
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleTerms}
                      className="text-blue-700 text-sm font-semibold hover:underline whitespace-nowrap"
                    >
                      {form.showControlTerms ? "Hide" : "View"}
                    </button>
                  </div>

                  {form.showControlTerms && (
                    <div className="mt-3 border border-slate-200 rounded-md bg-white p-3">
                      <div className="max-h-32 overflow-y-auto pr-2 text-sm text-slate-800 space-y-3">
                        <p>
                          The <strong>CoreFlex IIoTs Platform</strong> provides
                          supervisory monitoring, configuration, visualization,
                          and remote command capabilities only. Any closed-loop
                          control functions (including PID or time-proportioning
                          control) must be executed locally on customer-owned
                          devices or controllers specifically designed for
                          real-time operation.
                        </p>

                        <p>
                          The CoreFlex IIoTs Platform does not guarantee
                          deterministic timing, continuous connectivity, or
                          fail-safe behavior of Ethernet, cellular, internet, or
                          third-party network services. Users are solely
                          responsible for ensuring that all control strategies,
                          safety interlocks, limits, fallback states, and tuning
                          parameters are properly implemented, tested, and
                          compliant with applicable codes, standards, and
                          equipment manufacturer requirements.
                        </p>

                        <p>
                          The CoreFlex IIoTs Platform is not intended to
                          function as a primary safety system or as a real-time
                          control system for life-safety-critical or
                          equipment-critical processes. Configuration and use of
                          automation and control features must be performed by
                          qualified personnel. Certain control features may be
                          limited or restricted based on device capabilities and
                          configuration.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="font-bold text-sm text-slate-900 mb-2">
                      ✅ Acknowledgment
                    </p>

                    <label
                      className={`flex items-start gap-3 text-sm leading-6 font-medium rounded-lg p-2 transition ${
                        acknowledgmentEnabled
                          ? "text-slate-900"
                          : "text-slate-400 cursor-not-allowed opacity-70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="acceptedControlTerms"
                        checked={form.acceptedControlTerms}
                        onChange={handleChange}
                        disabled={!acknowledgmentEnabled}
                        className="mt-1"
                      />
                      <span>
                        I acknowledge that the CoreFlex IIoTs Platform is a
                        supervisory monitoring and management system only, and
                        must not be relied upon for real-time control or
                        safety-critical functions.
                      </span>
                    </label>

                    {!acknowledgmentEnabled && (
                      <p className="text-xs text-amber-700 mt-2 font-semibold">
                        Please click <span className="underline">View</span> to
                        review the acknowledgment before accepting it.
                      </p>
                    )}

                    <p className="text-xs text-slate-700 mt-2 font-medium">
                      (You must accept this acknowledgment to create an account.)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!form.acceptedControlTerms}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-slate-800 text-sm mt-4 font-semibold">
            Already have an account?{" "}
            <Link to="/" className="text-blue-700 font-semibold hover:underline">
              Login
            </Link>
          </p>

          <p className="text-center text-slate-700 text-xs mt-3 font-medium">
            Control Terms Version: {CONTROL_TERMS_VERSION}
          </p>
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
            transform: translateY(90vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}