import React from "react";
import DeviceManagerSection from "./homepagesections/DeviceManagerSection";

// ✅ Owner allowlist (LOCKED to one admin email only)
const PLATFORM_OWNER_EMAIL = "roquemartinez_8@hotmail.com";

// ✅ Columns exactly like your spreadsheet (ZHC1921)
const ZHC1921_COLUMNS = [
  { key: "deviceId", label: "DEVICE ID", minW: 220 },
  { key: "addedAt", label: "added by admin on date", minW: 190 },
  { key: "ownedBy", label: "own by user", minW: 180 },
  { key: "status", label: "Status (online/offline)", minW: 170 },
  { key: "lastSeen", label: "last seen", minW: 170 },

  { key: "in1", label: "Input 1 (0/1)", minW: 120 },
  { key: "in2", label: "Input 2 (0/1)", minW: 120 },
  { key: "in3", label: "Input 3 (0/1)", minW: 120 },
  { key: "in4", label: "Input 4 (0/1)", minW: 120 },

  { key: "do1", label: "DO 1 (0/1)", minW: 110 },
  { key: "do2", label: "DO 2 (0/1)", minW: 110 },
  { key: "do3", label: "DO 3 (0/1)", minW: 110 },
  { key: "do4", label: "DO 4 (0/1)", minW: 110 },

  { key: "ai1", label: "AI-1 value", minW: 120 },
  { key: "ai2", label: "AI-2 value", minW: 120 },
  { key: "ai3", label: "AI-3 value", minW: 120 },
  { key: "ai4", label: "AI-4 value", minW: 120 },
];

// ---------------------------
// Helpers: email + JWT decode
// ---------------------------
function safeLower(s) {
  return String(s || "").trim().toLowerCase();
}

function looksLikeEmail(s) {
  const v = String(s || "").trim();
  return v.includes("@") && v.includes(".");
}

function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function detectEmail(currentUserKey) {
  // 1) If currentUserKey already is email, use it
  if (looksLikeEmail(currentUserKey)) return String(currentUserKey).trim();

  // 2) Try common localStorage email keys
  const emailKeys = [
    "coreflex_user_email",
    "coreflex_email",
    "user_email",
    "email",
    "userEmail",
  ];
  for (const k of emailKeys) {
    const v = localStorage.getItem(k);
    if (looksLikeEmail(v)) return String(v).trim();
  }

  // 3) Try decoding JWT from common token keys
  const tokenKeys = [
    "coreflex_access_token",
    "coreflex_token",
    "access_token",
    "token",
    "jwt",
  ];
  for (const tk of tokenKeys) {
    const t = localStorage.getItem(tk);
    const payload = decodeJwtPayload(t);
    if (!payload) continue;

    const candidates = [
      payload.email,
      payload.user?.email,
      payload.sub,
      payload.username,
    ];

    for (const c of candidates) {
      if (looksLikeEmail(c)) return String(c).trim();
    }
  }

  return "";
}

export default function HomePage({
  setActiveSubPage,
  setSubPageColor,
  currentUserKey,
}) {
  // ✅ Robust email detection
  const detectedEmail = detectEmail(currentUserKey);
  const normalizedUser = safeLower(detectedEmail || currentUserKey);
  const isPlatformOwner = normalizedUser === safeLower(PLATFORM_OWNER_EMAIL);

  // ✅ Device Manager state
  const [activeModel, setActiveModel] = React.useState(null);

  // ✅ Placeholder rows (later replace with backend API)
  const [zhc1921Rows, setZhc1921Rows] = React.useState([
    {
      deviceId: "1921251024070670",
      addedAt: "—",
      ownedBy: "—",
      status: "offline",
      lastSeen: "—",
      in1: 0,
      in2: 0,
      in3: 0,
      in4: 0,
      do1: 0,
      do2: 0,
      do3: 0,
      do4: 0,
      ai1: "",
      ai2: "",
      ai3: "",
      ai4: "",
    },
  ]);

  // ✅ When Device Manager opens (model selected), scroll to top so it feels like a “new page”
  React.useEffect(() => {
    if (activeModel) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeModel]);

  // ✅ Treat “device manager open” like a full-page section (like Admin Dashboard)
  const isDeviceManagerOpen = isPlatformOwner && !!activeModel;

  // ✅ FULL “DEVICE MANAGER PAGE” VIEW
  if (isDeviceManagerOpen) {
    return (
      <div className="mt-4 md:mt-6">
        {/* Top bar like Admin Dashboard */}
        <div className="rounded-xl bg-slate-700 text-white px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setActiveModel(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 transition text-sm"
          >
            ← Back
          </button>

          <div className="text-sm md:text-base font-semibold">
            Device Manager — {String(activeModel || "")}
          </div>

          <div className="text-xs text-slate-200 opacity-90">
            Owner: {normalizedUser || "unknown"}
          </div>
        </div>

        {/* The device manager section itself (full width) */}
        <div className="mt-3">
          <DeviceManagerSection
            mode="page" // ✅ IMPORTANT: page mode removes mt-10 border-t padding
            ownerEmail={normalizedUser}
            activeModel={activeModel}
            setActiveModel={setActiveModel}
            zhc1921Columns={ZHC1921_COLUMNS}
            zhc1921Rows={zhc1921Rows}
            setZhc1921Rows={setZhc1921Rows}
          />
        </div>
      </div>
    );
  }

  // ✅ NORMAL HOME VIEW (unchanged)
  return (
    <>
      {/* TOP ROW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* PROFILE CARD */}
        <div
          className="rounded-xl bg-blue-600 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:opacity-95 transition"
          onClick={() => {
            setActiveSubPage("profile");
            setSubPageColor("bg-blue-600");
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👤</span>
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>
          <p className="text-sm text-blue-100">View and edit your profile.</p>
        </div>

        {/* CUSTOMERS / LOCATIONS CARD */}
        <div
          className="rounded-xl bg-teal-500 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:opacity-95 transition"
          onClick={() => {
            setActiveSubPage("customers");
            setSubPageColor("bg-teal-500");
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📍</span>
            <h2 className="text-lg font-semibold">Customers / Locations</h2>
          </div>
          <p className="text-sm text-teal-100">
            Add customers and real site addresses.
          </p>
        </div>

        {/* REGISTERED DEVICES CARD */}
        <div className="rounded-xl bg-sky-700 text-white p-4 md:p-5 flex flex-col justify-between hover:bg-sky-800 transition">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📡</span>
            <h2 className="text-lg font-semibold">Registered Devices</h2>
          </div>
          <p className="text-sm text-sky-100">
            Review all sensors and gateways.
          </p>
        </div>
      </div>

      {/* ADMIN DASHBOARD CARD */}
      <div className="mt-4 md:mt-6">
        <div
          className="rounded-xl bg-gray-700 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:bg-gray-800 transition"
          onClick={() => {
            setActiveSubPage("dashboardAdmin");
            setSubPageColor("bg-gray-700");
          }}
        >
          <h2 className="text-lg font-semibold mb-2">Admin Dashboard</h2>
          <p className="text-sm text-gray-200 mb-2">
            Create and manage customer dashboards.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs md:text-sm">
            <span>• Create Dashboards</span>
            <span>• Assign to Customers</span>
            <span>• Open / Edit / Launch</span>
          </div>

          <div className="mt-3 text-xs text-gray-300 opacity-90">
            Click to open Dashboard Admin
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="rounded-xl bg-slate-600 text-white p-4 md:p-5 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">Settings</h2>
          <p className="text-sm text-slate-100">Configure preferences.</p>
        </div>

        <div className="rounded-xl bg-emerald-500 text-white p-4 md:p-5 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">Billing & Payments</h2>
          <p className="text-sm text-emerald-100">Manage subscriptions.</p>
        </div>

        <div className="rounded-xl bg-gray-800 text-white p-4 md:p-5 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">Logs & Activity</h2>
          <p className="text-sm text-gray-200">Audit recent events.</p>
        </div>
      </div>

      {/* ✅ OWNER-ONLY: DEVICE MANAGER ENTRY (model chooser lives here until a model is selected) */}
      {isPlatformOwner && (
        <DeviceManagerSection
          mode="inline" // ✅ IMPORTANT: keep mt-10 border-t spacing on Home
          ownerEmail={normalizedUser}
          activeModel={activeModel}
          setActiveModel={setActiveModel}
          zhc1921Columns={ZHC1921_COLUMNS}
          zhc1921Rows={zhc1921Rows}
          setZhc1921Rows={setZhc1921Rows}
        />
      )}

      {/* ✅ OWNER-ONLY BUSINESS SECTION (unchanged) */}
      {isPlatformOwner && (
        <div className="mt-10 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Business Reports (Owner Only)
            </h2>
            <span className="text-xs text-gray-500">
              Owner: {normalizedUser || "unknown"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setActiveSubPage("businessDashboardsReport");
                setSubPageColor("bg-gray-900");
              }}
              className="w-full rounded-xl bg-gray-900 text-white px-5 py-4 text-left hover:opacity-90 transition"
            >
              <div className="text-lg font-semibold">
                Business Dashboards Report
              </div>
              <div className="text-sm opacity-80">
                View all users and dashboards created.
              </div>
            </button>

            <button
              onClick={() => {
                setActiveSubPage("businessUsersReport");
                setSubPageColor("bg-teal-600");
              }}
              className="w-full rounded-xl bg-teal-600 text-white px-5 py-4 text-left hover:opacity-90 transition"
            >
              <div className="text-lg font-semibold">Business Users Report</div>
              <div className="text-sm opacity-90">
                View total users and account stats.
              </div>
            </button>

            <button
              onClick={() => {
                setActiveSubPage("resetUserPassword");
                setSubPageColor("bg-orange-700");
              }}
              className="w-full rounded-xl bg-orange-700 text-white px-5 py-4 text-left hover:opacity-90 transition"
            >
              <div className="text-lg font-semibold">Reset User Password</div>
              <div className="text-sm opacity-90">
                Reset password for any user (owner-only).
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
