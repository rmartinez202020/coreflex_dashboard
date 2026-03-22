import React from "react";
import DeviceManagerSection from "./homepagesections/DeviceManagerSection";
import RegisterDevicesSection from "./homepagesections/RegisterDevicesSection";

// ✅ IMPORTANT: read token the same way the rest of the app does (sessionStorage per-tab)
import { getToken, parseJwt } from "../utils/authToken";
import { API_URL } from "../config/api";

// ✅ Owner allowlist (LOCKED to one admin email only)
const PLATFORM_OWNER_EMAIL = "roquemartinez_8@hotmail.com";

// ✅ Columns exactly like your spreadsheet (ZHC1921)
// Blue row = title, second line = unit/meaning (sub)
const ZHC1921_COLUMNS = [
  { key: "deviceId", title: "DEVICE ID", minW: 200 },
  { key: "addedAt", title: "Date", minW: 140 },
  { key: "ownedBy", title: "User", minW: 140 },

  { key: "status", title: "Status", sub: "online/offline", minW: 140 },
  { key: "lastSeen", title: "last seen", minW: 130 },

  { key: "in1", title: "DI-1", sub: "0/1", minW: 90 },
  { key: "in2", title: "DI-2", sub: "0/1", minW: 90 },
  { key: "in3", title: "DI-3", sub: "0/1", minW: 90 },
  { key: "in4", title: "DI-4", sub: "0/1", minW: 90 },

  { key: "do1", title: "DO 1", sub: "0/1", minW: 90 },
  { key: "do2", title: "DO 2", sub: "0/1", minW: 90 },
  { key: "do3", title: "DO 3", sub: "0/1", minW: 90 },
  { key: "do4", title: "DO 4", sub: "0/1", minW: 90 },

  { key: "ai1", title: "AI-1", sub: "value", minW: 100 },
  { key: "ai2", title: "AI-2", sub: "value", minW: 100 },
  { key: "ai3", title: "AI-3", sub: "value", minW: 100 },
  { key: "ai4", title: "AI-4", sub: "value", minW: 100 },
];

// ---------------------------
// Helpers: normalize + email
// ---------------------------
function safeLower(s) {
  return String(s || "").trim().toLowerCase();
}

function looksLikeEmail(s) {
  const v = String(s || "").trim();
  return v.includes("@") && v.includes(".");
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

/**
 * ✅ Detect identity ONLY from:
 * - currentUserKey (from useAuthController)
 * - JWT payload from getToken() (sessionStorage per-tab)
 *
 * ❌ DO NOT read identity from localStorage here (shared across tabs)
 */
function detectEmailFromAuth(currentUserKey) {
  // 1) If currentUserKey already is email, use it
  if (looksLikeEmail(currentUserKey)) return String(currentUserKey).trim();

  // 2) Decode JWT from the SAME token used for API calls (sessionStorage per-tab)
  const t = getToken();
  const payload = parseJwt(t);

  if (payload) {
    const candidates = [
      payload.email,
      payload.user?.email,
      payload.username,
      payload.sub, // sometimes email, sometimes id
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
  // ✅ UI state
  const [showRegisterDevices, setShowRegisterDevices] = React.useState(false);
  const [activeModel, setActiveModel] = React.useState(null);

  // ✅ NEW: business users inline report state
  const [showBusinessUsersReport, setShowBusinessUsersReport] = React.useState(false);
  const [businessUsers, setBusinessUsers] = React.useState([]);
  const [businessUsersLoading, setBusinessUsersLoading] = React.useState(false);
  const [businessUsersError, setBusinessUsersError] = React.useState("");

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

  // ✅ Identity state (per-tab)
  const [detectedEmail, setDetectedEmail] = React.useState(() =>
    detectEmailFromAuth(currentUserKey)
  );

  const normalizedUser = safeLower(detectedEmail || currentUserKey);
  const isPlatformOwner = normalizedUser === safeLower(PLATFORM_OWNER_EMAIL);

  // ✅ Refresh identity when auth changes in THIS TAB
  React.useEffect(() => {
    const refreshIdentity = () => {
      const next = detectEmailFromAuth(currentUserKey);
      setDetectedEmail(next);
    };

    refreshIdentity();

    window.addEventListener("coreflex-auth-changed", refreshIdentity);
    return () => {
      window.removeEventListener("coreflex-auth-changed", refreshIdentity);
    };
  }, [currentUserKey]);

  /**
   * ✅ If another tab logs in/out, it might update localStorage keys used elsewhere.
   * We do NOT read identity from localStorage, BUT we can still re-check token + currentUserKey.
   * This keeps Home stable across multi-tab activity.
   */
  React.useEffect(() => {
    const onStorage = () => {
      setDetectedEmail(detectEmailFromAuth(currentUserKey));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [currentUserKey]);

  /**
   * ✅ Critical: when identity/owner status changes, reset owner-only UI state
   * so you don’t get stuck with activeModel open from a previous user.
   */
  React.useEffect(() => {
    if (!isPlatformOwner) {
      setActiveModel(null);
      setShowBusinessUsersReport(false);
      setBusinessUsers([]);
      setBusinessUsersError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformOwner, normalizedUser]);

  // ✅ When Device Manager opens (model selected), scroll to top
  React.useEffect(() => {
    if (activeModel) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeModel]);

  // ✅ When Register Devices opens, scroll to top too
  React.useEffect(() => {
    if (showRegisterDevices) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showRegisterDevices]);

  const fetchBusinessUsers = React.useCallback(async () => {
    setBusinessUsersLoading(true);
    setBusinessUsersError("");

    try {
      const token = String(getToken() || "").trim();

      const res = await fetch(`${API_URL}/auth/business-users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data?.detail || data?.error || "Failed to load registered users."
        );
      }

      setBusinessUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      setBusinessUsersError(
        err?.message || "Failed to load registered users."
      );
      setBusinessUsers([]);
    } finally {
      setBusinessUsersLoading(false);
    }
  }, []);

  const handleBusinessUsersClick = async () => {
    const nextOpen = !showBusinessUsersReport;
    setShowBusinessUsersReport(nextOpen);

    if (nextOpen) {
      await fetchBusinessUsers();
      window.setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 80);
    }
  };

  // ✅ Treat “device manager open” like a full-page section
  const isDeviceManagerOpen = isPlatformOwner && !!activeModel;

  // ✅ FULL “REGISTER DEVICES PAGE” VIEW
  if (showRegisterDevices) {
    return (
      <div className="mt-4 md:mt-6">
        <RegisterDevicesSection onBack={() => setShowRegisterDevices(false)} />
      </div>
    );
  }

  // ✅ FULL “DEVICE MANAGER PAGE” VIEW
  if (isDeviceManagerOpen) {
    return (
      <div className="mt-4 md:mt-6">
        <DeviceManagerSection
          mode="page"
          ownerEmail={detectedEmail || normalizedUser}
          activeModel={activeModel}
          setActiveModel={setActiveModel}
          zhc1921Columns={ZHC1921_COLUMNS}
          zhc1921Rows={zhc1921Rows}
          setZhc1921Rows={setZhc1921Rows}
        />
      </div>
    );
  }

  // ✅ NORMAL HOME VIEW
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
        <div
          className="rounded-xl bg-sky-700 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:bg-sky-800 transition"
          onClick={() => setShowRegisterDevices(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📡</span>
            <h2 className="text-lg font-semibold">Registered Devices</h2>
          </div>
          <p className="text-sm text-sky-100">
            Register devices by model (CF-2000 / CF-1600 / TP-400).
          </p>
          <div className="mt-3 text-xs text-sky-200 opacity-90">
            Click to open Register Devices
          </div>
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

      {/* ✅ OWNER-ONLY: DEVICE MANAGER ENTRY */}
      {isPlatformOwner && (
        <DeviceManagerSection
          mode="inline"
          ownerEmail={detectedEmail || normalizedUser}
          activeModel={activeModel}
          setActiveModel={setActiveModel}
          zhc1921Columns={ZHC1921_COLUMNS}
          zhc1921Rows={zhc1921Rows}
          setZhc1921Rows={setZhc1921Rows}
        />
      )}

      {/* ✅ OWNER-ONLY BUSINESS SECTION */}
      {isPlatformOwner && (
        <div className="mt-10 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Business Reports (Owner Only)
            </h2>
            <span className="text-xs text-gray-500">
              Owner: {detectedEmail || normalizedUser || "unknown"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onClick={handleBusinessUsersClick}
              className="w-full rounded-xl bg-teal-600 text-white px-5 py-4 text-left hover:opacity-90 transition"
            >
              <div className="text-lg font-semibold">Business Users Report</div>
              <div className="text-sm opacity-90">
                View total users and account stats.
              </div>
              <div className="mt-2 text-xs opacity-90">
                {showBusinessUsersReport ? "Click to hide users table" : "Click to view registered users"}
              </div>
            </button>
          </div>

          {showBusinessUsersReport && (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Registered Platform Users
                  </h3>
                  <p className="text-sm text-gray-600">
                    Showing all registered users without password hashes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchBusinessUsers}
                  disabled={businessUsersLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    businessUsersLoading
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-slate-700 text-white hover:bg-slate-800"
                  }`}
                >
                  {businessUsersLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {businessUsersError && (
                <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {businessUsersError}
                </div>
              )}

              {businessUsersLoading ? (
                <div className="px-5 py-8 text-sm text-gray-600">
                  Loading registered users...
                </div>
              ) : businessUsers.length === 0 ? (
                <div className="px-5 py-8 text-sm text-gray-600">
                  No registered users found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                          Terms Accepted At
                        </th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                          Terms Version
                        </th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                          Accepted Control Terms
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {businessUsers.map((user, idx) => (
                        <tr
                          key={`${user.id}-${user.email}-${idx}`}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="px-4 py-3 border-t border-gray-200 whitespace-nowrap text-gray-900">
                            {user.id ?? "—"}
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200 whitespace-nowrap text-gray-900">
                            {user.name || "—"}
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200 whitespace-nowrap text-gray-900">
                            {user.company || "—"}
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200 whitespace-nowrap text-gray-900">
                            {user.email || "—"}
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200 whitespace-nowrap text-gray-900">
                            {formatDateTime(user.control_terms_accepted_at)}
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200 whitespace-nowrap text-gray-900">
                            {user.control_terms_version || "—"}
                          </td>
                          <td className="px-4 py-3 border-t border-gray-200 whitespace-nowrap text-gray-900">
                            {user.accepted_control_terms ? "true" : "false"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}