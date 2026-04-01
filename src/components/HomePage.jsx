import React from "react";
import DeviceManagerSection from "./homepagesections/DeviceManagerSection";
import RegisterDevicesSection from "./homepagesections/RegisterDevicesSection";
import BusinessUsersReportSection from "./homepagesections/BusinessUsersReportSection";
import BusinessDashboardsReportSection from "./homepagesections/BusinessDashboardsReportSection";
import TenantUsersPage from "./homepagesections/TenantUsersPage";

// ✅ IMPORTANT: read token the same way the rest of the app does (sessionStorage per-tab)
import { getToken, parseJwt } from "../utils/authToken";

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

// ✅ Subscription plans
const SUBSCRIPTION_PLANS = [
  {
    key: "free",
    plan: "Free",
    monthlyPrice: "$0",
    oneTimeLicense: "N/A",
    deviceLimit: "1 device",
    dashboards: "1",
    dataHistory: "7 days",
    features: "Basic telemetry, basic widgets, device testing",
    annualSupport: "N/A",
  },
  {
    key: "starter",
    plan: "Starter",
    monthlyPrice: "$20 / month",
    oneTimeLicense: "$399",
    deviceLimit: "5 devices",
    dashboards: "Unlimited",
    dataHistory: "30 days",
    features: "Alarms, dashboards, telemetry monitoring",
    annualSupport: "$79 / year",
  },
  {
    key: "professional",
    plan: "Professional",
    monthlyPrice: "$80 / month",
    oneTimeLicense: "$1,200",
    deviceLimit: "50 devices",
    dashboards: "Unlimited",
    dataHistory: "1 year",
    features: "Automation rules, data export, advanced dashboards",
    annualSupport: "$199 / year",
  },
  {
    key: "industrial",
    plan: "Industrial",
    monthlyPrice: "$350 / month",
    oneTimeLicense: "$3,500",
    deviceLimit: "200 devices",
    dashboards: "Unlimited",
    dataHistory: "Unlimited*",
    features: "Multi-site dashboards, analytics, advanced monitoring",
    annualSupport: "$599 / year",
  },
  {
    key: "enterprise",
    plan: "Enterprise",
    monthlyPrice: "$900+ / month",
    oneTimeLicense: "$8,000+",
    deviceLimit: "Unlimited devices",
    dashboards: "Unlimited",
    dataHistory: "Unlimited",
    features: "Custom integrations, dedicated server, priority support",
    annualSupport: "$1,500 / year",
  },
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

// ✅ Inline extracted-style section for subscription page
function MySubscriptionSection({ onBack }) {
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-emerald-700 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm"
          >
            ← Back
          </button>

          <div>
            <div className="text-lg font-semibold">My Subscription</div>
            <div className="text-xs text-emerald-100">
              Review available subscription plans and platform limits.
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="text-sm font-semibold text-emerald-900">
            Subscription Details
          </div>
          <div className="mt-1 text-sm text-emerald-800">
            View CoreFlex subscription plans, billing structure, device limits,
            dashboard limits, data history, features, and annual updates &
            support.
          </div>
        </div>

        {/* Desktop / tablet table */}
        <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-100 text-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Plan</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Monthly Price
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  One-Time License
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Device Limit
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Dashboards
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Data History
                </th>
                <th className="px-4 py-3 text-left font-semibold">Features</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Annual Updates & Support
                </th>
              </tr>
            </thead>
            <tbody>
              {SUBSCRIPTION_PLANS.map((row, idx) => (
                <tr
                  key={row.key}
                  className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  <td className="px-4 py-4 align-top font-semibold text-slate-900">
                    {row.plan}
                  </td>
                  <td className="px-4 py-4 align-top">{row.monthlyPrice}</td>
                  <td className="px-4 py-4 align-top">{row.oneTimeLicense}</td>
                  <td className="px-4 py-4 align-top font-semibold">
                    {row.deviceLimit}
                  </td>
                  <td className="px-4 py-4 align-top">{row.dashboards}</td>
                  <td className="px-4 py-4 align-top">{row.dataHistory}</td>
                  <td className="px-4 py-4 align-top">{row.features}</td>
                  <td className="px-4 py-4 align-top">{row.annualSupport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile / smaller screens cards */}
        <div className="lg:hidden grid grid-cols-1 gap-4">
          {SUBSCRIPTION_PLANS.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="bg-emerald-600 text-white px-4 py-3 flex items-center gap-2">
                <span className="text-lg">💳</span>
                <div className="text-base font-semibold">{row.plan}</div>
              </div>

              <div className="p-4 grid grid-cols-1 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-xs text-slate-500">Monthly Price</div>
                  <div className="font-semibold">{row.monthlyPrice}</div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-xs text-slate-500">One-Time License</div>
                  <div className="font-semibold">{row.oneTimeLicense}</div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-xs text-slate-500">Device Limit</div>
                  <div className="font-semibold">{row.deviceLimit}</div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-xs text-slate-500">Dashboards</div>
                  <div className="font-semibold">{row.dashboards}</div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-xs text-slate-500">Data History</div>
                  <div className="font-semibold">{row.dataHistory}</div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-xs text-slate-500">Features</div>
                  <div className="font-medium">{row.features}</div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-xs text-slate-500">
                    Annual Updates & Support
                  </div>
                  <div className="font-semibold">{row.annualSupport}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage({
  setActiveSubPage,
  setSubPageColor,
  currentUserKey,
}) {
  // ✅ UI state
  const [showRegisterDevices, setShowRegisterDevices] = React.useState(false);
  const [activeModel, setActiveModel] = React.useState(null);

  // ✅ NEW: dedicated Business Users Report page state
  const [showBusinessUsersReportPage, setShowBusinessUsersReportPage] =
    React.useState(false);

  // ✅ NEW: dedicated Business Dashboards Report page state
  const [showBusinessDashboardsReportPage, setShowBusinessDashboardsReportPage] =
    React.useState(false);

  // ✅ NEW: dedicated Tenant Users & Access page state
  const [showTenantUsersPage, setShowTenantUsersPage] = React.useState(false);

  // ✅ NEW: dedicated My Subscription page state
  const [showMySubscriptionPage, setShowMySubscriptionPage] =
    React.useState(false);

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
      setShowBusinessUsersReportPage(false);
      setShowBusinessDashboardsReportPage(false);
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

  // ✅ When Business Users Report opens, scroll to top too
  React.useEffect(() => {
    if (showBusinessUsersReportPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showBusinessUsersReportPage]);

  // ✅ When Business Dashboards Report opens, scroll to top too
  React.useEffect(() => {
    if (showBusinessDashboardsReportPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showBusinessDashboardsReportPage]);

  // ✅ When Tenant Users page opens, scroll to top too
  React.useEffect(() => {
    if (showTenantUsersPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showTenantUsersPage]);

  // ✅ When My Subscription page opens, scroll to top too
  React.useEffect(() => {
    if (showMySubscriptionPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showMySubscriptionPage]);

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

  // ✅ FULL “BUSINESS USERS REPORT PAGE” VIEW
  if (isPlatformOwner && showBusinessUsersReportPage) {
    return (
      <div className="mt-4 md:mt-6">
        <BusinessUsersReportSection
          onBack={() => setShowBusinessUsersReportPage(false)}
          ownerEmail={detectedEmail || normalizedUser}
        />
      </div>
    );
  }

  // ✅ FULL “BUSINESS DASHBOARDS REPORT PAGE” VIEW
  if (isPlatformOwner && showBusinessDashboardsReportPage) {
    return (
      <div className="mt-4 md:mt-6">
        <BusinessDashboardsReportSection
          onBack={() => setShowBusinessDashboardsReportPage(false)}
          ownerEmail={detectedEmail || normalizedUser}
        />
      </div>
    );
  }

  // ✅ FULL “TENANT USERS & ACCESS PAGE” VIEW
  if (showTenantUsersPage) {
    return (
      <div className="mt-4 md:mt-6">
        <TenantUsersPage onGoBack={() => setShowTenantUsersPage(false)} />
      </div>
    );
  }

  // ✅ FULL “MY SUBSCRIPTION PAGE” VIEW
  if (showMySubscriptionPage) {
    return (
      <div className="mt-4 md:mt-6">
        <MySubscriptionSection
          onBack={() => setShowMySubscriptionPage(false)}
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
        <div
          className="rounded-xl bg-cyan-600 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:bg-cyan-700 transition"
          onClick={() => setShowTenantUsersPage(true)}
        >
          <h2 className="text-lg font-semibold mb-2">Tenant Users & Access</h2>
          <p className="text-sm text-slate-100">
            Create tenant users and assign dashboard access by permission level.
          </p>
          <div className="mt-3 text-xs text-slate-200 opacity-90">
            Click to open Tenant Users & Access
          </div>
        </div>

        <div
          className="rounded-xl bg-emerald-500 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:bg-emerald-600 transition"
          onClick={() => setShowMySubscriptionPage(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💳</span>
            <h2 className="text-lg font-semibold">My Subscription</h2>
          </div>
          <p className="text-sm text-emerald-100">
            Manage your subscription, billing details, and payment methods.
          </p>
          <div className="mt-3 text-xs text-emerald-100 opacity-90">
            Click to open subscription details
          </div>
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
              onClick={() => setShowBusinessDashboardsReportPage(true)}
              className="w-full rounded-xl bg-gray-900 text-white px-5 py-4 text-left hover:opacity-90 transition"
            >
              <div className="text-lg font-semibold">
                Business Dashboards Report
              </div>
              <div className="text-sm opacity-80">
                View all users and dashboards created.
              </div>
              <div className="mt-2 text-xs opacity-90">
                Click to open dashboards report
              </div>
            </button>

            <button
              onClick={() => setShowBusinessUsersReportPage(true)}
              className="w-full rounded-xl bg-teal-600 text-white px-5 py-4 text-left hover:opacity-90 transition"
            >
              <div className="text-lg font-semibold">Business Users Report</div>
              <div className="text-sm opacity-90">
                View total users and account stats.
              </div>
              <div className="mt-2 text-xs opacity-90">
                Click to open users report
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}