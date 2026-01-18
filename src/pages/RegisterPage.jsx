import { useState } from "react";
import { Link } from "react-router-dom";
import bgImage from "../assets/login_photo/satellite.jpg";

import { API_URL } from "../config/api";

export default function RegisterPage() {
  const CONTROL_TERMS_VERSION = "v1.0";

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedControlTerms: false, // ✅ required
    showControlTerms: false, // ✅ NEW (collapse/expand)
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ✅ Require acceptance
    if (!form.acceptedControlTerms) {
      setError(
        "You must accept the Control & Automation Acknowledgment to create an account."
      );
      return;
    }

    // Password confirmation check
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

          // 🔐 Control terms tracking (backend stores timestamp)
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
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-40"></div>

      {/* Register Card */}
      <div className="relative bg-white bg-opacity-90 backdrop-blur-md shadow-2xl rounded-xl p-8 w-full max-w-xl z-10">
        <h1 className="text-3xl font-bold text-center text-[#1e293b] mb-3">
          Create Your CoreFlex Account
        </h1>

        <p className="text-center text-gray-600 mb-5">
          Fill in the information below to get started
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 px-3 py-2 rounded text-sm mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2 text-gray-800"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700">Company</label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-gray-800"
              placeholder="CoreFlex Alliance"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2 text-gray-800"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2 text-gray-800"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2 text-gray-800"
              placeholder="••••••••"
            />
          </div>

          {/* ✅ Control & Automation Acknowledgment (compact + scroll) */}
          <div className="border rounded-lg p-4 bg-gray-50 mt-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  🔐 Control &amp; Automation Acknowledgment
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  CoreFlex IIoTs Platform
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    showControlTerms: !prev.showControlTerms,
                  }))
                }
                className="text-blue-600 text-sm font-semibold hover:underline whitespace-nowrap"
              >
                {form.showControlTerms ? "Hide" : "View"}
              </button>
            </div>

            {/* Collapsible Terms */}
            {form.showControlTerms && (
              <div className="mt-3 border rounded-md bg-white p-3">
                <div className="max-h-40 overflow-y-auto pr-2 text-sm text-gray-700 space-y-3">
                  <p>
                    The <strong>CoreFlex IIoTs Platform</strong> provides
                    supervisory monitoring, configuration, visualization, and
                    remote command capabilities only. Any closed-loop control
                    functions (including PID or time-proportioning control) must
                    be executed locally on customer-owned devices or controllers
                    specifically designed for real-time operation.
                  </p>

                  <p>
                    The CoreFlex IIoTs Platform does not guarantee deterministic
                    timing, continuous connectivity, or fail-safe behavior of
                    Ethernet, cellular, internet, or third-party network
                    services. Users are solely responsible for ensuring that all
                    control strategies, safety interlocks, limits, fallback
                    states, and tuning parameters are properly implemented,
                    tested, and compliant with applicable codes, standards, and
                    equipment manufacturer requirements.
                  </p>

                  <p>
                    The CoreFlex IIoTs Platform is not intended to function as a
                    primary safety system or as a real-time control system for
                    life-safety-critical or equipment-critical processes.
                    Configuration and use of automation and control features
                    must be performed by qualified personnel. Certain control
                    features may be limited or restricted based on device
                    capabilities and configuration.
                  </p>
                </div>
              </div>
            )}

            {/* Acknowledgment checkbox ALWAYS visible */}
            <div className="mt-4">
              <p className="font-semibold text-sm text-gray-800 mb-2">
                ✅ Acknowledgment
              </p>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="acceptedControlTerms"
                  checked={form.acceptedControlTerms}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>
                  I understand and agree that CoreFlex IIoTs Platform is a
                  supervisory system and does not perform real-time or
                  safety-critical control.
                </span>
              </label>

              <p className="text-xs text-gray-500 mt-2">
                (You must accept this acknowledgment to create an account.)
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!form.acceptedControlTerms}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 font-semibold hover:underline">
            Login
          </Link>
        </p>

        {/* Optional: show version for audit clarity */}
        <p className="text-center text-gray-400 text-xs mt-3">
          Control Terms Version: {CONTROL_TERMS_VERSION}
        </p>
      </div>
    </div>
  );
}
