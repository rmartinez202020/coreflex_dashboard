import React from "react";

// ✅ Owner allowlist (LOCKED to one admin email only)
const PLATFORM_OWNER_EMAIL = "roquemartinez_8@hotmail.com";

// ✅ Model buttons (inside Home)
const DEVICE_MODELS = [
  { key: "zhc1921", label: "Model ZHC1921 (CF-2000)" },
  { key: "zhc1661", label: "Model ZHC1661 (CF-1600)" },
  { key: "tp4000", label: "Model TP-4000" },
];

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

export default function HomePage({
  setActiveSubPage,
  setSubPageColor,
  currentUserKey,
}) {
  const normalizedUser = (currentUserKey || "").trim().toLowerCase();
  const isPlatformOwner = normalizedUser === PLATFORM_OWNER_EMAIL;

  // ✅ Device Manager UI state (inside Home)
  const [activeModel, setActiveModel] = React.useState(null);

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

  const renderZhc1921Table = () => (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xl font-bold text-slate-900">
            Backend Device Table — ZHC1921 (CF-2000)
          </div>
          <div className="text-sm text-slate-600">
            This table will mirror the backend for authorized devices + live status.
          </div>
        </div>

        <button
          onClick={() => {
            // placeholder refresh (later this calls backend)
            setZhc1921Rows((prev) => [...prev]);
          }}
          className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
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

        {/* REGISTERED DEVICES CARD — STEEL BLUE */}
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

      {/* ✅ OWNER-ONLY: DEVICE MANAGER SECTION (INSIDE HOME) */}
      {isPlatformOwner && (
        <div className="mt-10 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Device Manager (Owner Only)
            </h2>
            <span className="text-xs text-gray-500">
              Owner: {normalizedUser || "unknown"}
            </span>
          </div>

          {/* 3 model buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEVICE_MODELS.map((m) => {
              const active = activeModel === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setActiveModel(m.key)}
                  className={[
                    "w-full rounded-xl px-5 py-4 text-left transition shadow-sm border",
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200",
                  ].join(" ")}
                >
                  <div className="text-lg font-semibold">{m.label}</div>
                  <div
                    className={
                      active ? "text-sm opacity-80" : "text-sm text-slate-600"
                    }
                  >
                    Manage authorized devices and view live I/O status.
                  </div>
                </button>
              );
            })}
          </div>

          {/* Table only for ZHC1921 */}
          {activeModel === "zhc1921" && renderZhc1921Table()}

          {/* Placeholders for the other 2 models (we’ll build next) */}
          {activeModel === "zhc1661" && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="font-semibold text-slate-900">
                ZHC1661 (CF-1600)
              </div>
              <div className="text-sm text-slate-600">
                Next: show the backend table for ZHC1661 devices.
              </div>
            </div>
          )}

          {activeModel === "tp4000" && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="font-semibold text-slate-900">TP-4000</div>
              <div className="text-sm text-slate-600">
                Next: show the backend table for TP-4000 devices.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ OWNER-ONLY BUSINESS SECTION (BOTTOM) */}
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
            {/* Business Dashboards Report */}
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

            {/* Business Users Report */}
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

            {/* Reset User Password */}
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
