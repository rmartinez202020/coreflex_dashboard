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

  // ✅ Device Manager UI state (inside Home)
  const [activeModel, setActiveModel] = React.useState(null);

  // ✅ Add-device UI (ZHC1921)
  const [newDeviceId, setNewDeviceId] = React.useState("");
  const [addError, setAddError] = React.useState("");

  // ✅ Placeholder rows (later we replace with backend API)
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

  // ✅ Temporary local add (later replaced by backend POST)
  const handleAddZhc1921Device = () => {
    const id = String(newDeviceId || "").trim();
    if (!id) {
      setAddError("Please type a DEVICE ID.");
      return;
    }
    const exists = zhc1921Rows.some((r) => String(r.deviceId) === id);
    if (exists) {
      setAddError("That DEVICE ID already exists in the table.");
      return;
    }

    setZhc1921Rows((prev) => [
      {
        deviceId: id,
        addedAt: new Date().toLocaleString(),
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
      ...prev,
    ]);

    setNewDeviceId("");
    setAddError("");
  };

  // ✅ The full manager panel for ZHC1921 (header + add device + table)
  const renderZhc1921Table = () => (
    <div className="mt-6">
      {/* ✅ Header bar like Admin Dashboard */}
      <div className="rounded-xl bg-gray-700 text-white p-4 md:p-5 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">
            Device Manager — ZHC1921 (CF-2000)
          </div>
          <div className="text-sm text-gray-200">
            Add authorized devices and view live I/O status from backend.
          </div>
        </div>

        <button
          onClick={() => {
            // placeholder refresh (later this calls backend)
            setZhc1921Rows((prev) => [...prev]);
          }}
          className="rounded-lg bg-white/10 text-white px-4 py-2 text-sm hover:bg-white/15 transition"
        >
          Refresh
        </button>
      </div>

      {/* ✅ Add Device row */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-800 mb-1">
              Add Device ID (authorized backend device)
            </div>
            <input
              value={newDeviceId}
              onChange={(e) => {
                setNewDeviceId(e.target.value);
                setAddError("");
              }}
              placeholder="Enter DEVICE ID (example: 1921251024070670)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {addError ? (
              <div className="text-xs text-red-600 mt-1">{addError}</div>
            ) : (
              <div className="text-xs text-slate-500 mt-1">
                Owner only. This will create a new row in the backend table.
              </div>
            )}
          </div>

          <button
            onClick={handleAddZhc1921Device}
            className="rounded-lg bg-slate-900 text-white px-5 py-2 text-sm hover:opacity-90"
          >
            + Add Device
          </button>
        </div>
      </div>

      {/* ✅ Table */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="w-full overflow-auto">
          <table className="min-w-max w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {ZHC1921_COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className="text-left font-semibold text-slate-700 px-3 py-3 border-b border-slate-200"
                    style={{ minWidth: c.minW }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {zhc1921Rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={ZHC1921_COLUMNS.length}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No devices found.
                  </td>
                </tr>
              ) : (
                zhc1921Rows.map((r, idx) => (
                  <tr
                    key={r.deviceId + idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    {ZHC1921_COLUMNS.map((c) => {
                      const val = r[c.key];

                      if (c.key === "status") {
                        const statusLower = String(val || "").toLowerCase();
                        const dotClass =
                          statusLower === "online"
                            ? "bg-emerald-500"
                            : "bg-slate-400";

                        return (
                          <td
                            key={c.key}
                            className="px-3 py-3 border-b border-slate-100 text-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-full ${dotClass}`}
                              />
                              <span className="capitalize">
                                {val || "offline"}
                              </span>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={c.key}
                          className="px-3 py-3 border-b border-slate-100 text-slate-800"
                        >
                          {val === undefined || val === null ? "" : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Tip: Scroll horizontally to see all columns.
      </div>
    </div>
  );

  return (
    <>
      {/* ✅ ALWAYS-VISIBLE DEBUG LINE (remove after it works) */}
      <div className="mb-3 text-[11px] text-slate-500">
        debug owner-check → detectedEmail: "{detectedEmail || "(none)"}" |
        currentUserKey: "{String(currentUserKey || "")}" | normalizedUser: "
        {normalizedUser}" | isPlatformOwner: {String(isPlatformOwner)}
      </div>

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

      {/* ✅ OWNER-ONLY: DEVICE MANAGER SECTION (EXTRACTED) */}
      {isPlatformOwner && (
        <DeviceManagerSection
          ownerEmail={normalizedUser}
          activeModel={activeModel}
          setActiveModel={setActiveModel}
          renderZhc1921Table={renderZhc1921Table}
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
