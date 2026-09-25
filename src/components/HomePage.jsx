import React from "react";
import DeviceManagerSection from "./homepagesections/DeviceManagerSection";
import DeviceManagerDf572Section from "./homepagesections/DeviceManagerDf572Section";
import RegisterDevicesSection from "./homepagesections/RegisterDevicesSection";
import BusinessUsersReportSection from "./homepagesections/BusinessUsersReportSection";
import BusinessDashboardsReportSection from "./homepagesections/BusinessDashboardsReportSection";
import TenantUsersPage from "./homepagesections/TenantUsersPage";
import MySubscriptionSection from "./homepagesections/MySubscriptionSection";
import BillingAdminSection from "./homepagesections/BillingAdminSection";
import AdminSubscriptionsSection from "./homepagesections/admin_subscriptions";
import LogsActivitySection from "./homepagesections/LogsActivitySection";
import LogsAdministrationSection from "./homepagesections/LogsAdministrationSection";
import TagExplorerSection from "./homepagesections/TagExplorerSection";

import { getToken, parseJwt } from "../utils/authToken";

const PLATFORM_OWNER_EMAIL = "roquemartinez_8@hotmail.com";

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

function safeLower(s) {
  return String(s || "").trim().toLowerCase();
}

function looksLikeEmail(s) {
  const v = String(s || "").trim();
  return v.includes("@") && v.includes(".");
}

function detectEmailFromAuth(currentUserKey) {
  if (looksLikeEmail(currentUserKey)) return String(currentUserKey).trim();

  const t = getToken();
  const payload = parseJwt(t);

  if (payload) {
    const candidates = [
      payload.email,
      payload.user?.email,
      payload.username,
      payload.sub,
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
  const [showRegisterDevices, setShowRegisterDevices] = React.useState(false);
  const [activeModel, setActiveModel] = React.useState(null);

  const [showBusinessUsersReportPage, setShowBusinessUsersReportPage] =
    React.useState(false);

  const [showBusinessDashboardsReportPage, setShowBusinessDashboardsReportPage] =
    React.useState(false);

  const [showTenantUsersPage, setShowTenantUsersPage] = React.useState(false);

  const [showMySubscriptionPage, setShowMySubscriptionPage] =
    React.useState(false);

  const [showBillingAdminPage, setShowBillingAdminPage] = React.useState(false);

  const [showAdminSubscriptionsPage, setShowAdminSubscriptionsPage] =
    React.useState(false);

  const [showLogsActivityPage, setShowLogsActivityPage] =
    React.useState(false);

  const [showLogsAdministrationPage, setShowLogsAdministrationPage] =
    React.useState(false);

  // TAG EXPLORER
  const [showTagExplorerPage, setShowTagExplorerPage] =
    React.useState(false);

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

  const [detectedEmail, setDetectedEmail] = React.useState(() =>
    detectEmailFromAuth(currentUserKey)
  );

  const normalizedUser = safeLower(detectedEmail || currentUserKey);
  const isPlatformOwner =
    normalizedUser === safeLower(PLATFORM_OWNER_EMAIL);

  React.useEffect(() => {
    const refreshIdentity = () => {
      const next = detectEmailFromAuth(currentUserKey);
      setDetectedEmail(next);
    };

    refreshIdentity();

    window.addEventListener("coreflex-auth-changed", refreshIdentity);

    return () => {
      window.removeEventListener(
        "coreflex-auth-changed",
        refreshIdentity
      );
    };
  }, [currentUserKey]);

  React.useEffect(() => {
    const onStorage = () => {
      setDetectedEmail(detectEmailFromAuth(currentUserKey));
    };

    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, [currentUserKey]);

  React.useEffect(() => {
    if (!isPlatformOwner) {
      setActiveModel(null);
      setShowBusinessUsersReportPage(false);
      setShowBusinessDashboardsReportPage(false);
      setShowBillingAdminPage(false);
      setShowAdminSubscriptionsPage(false);
      setShowLogsAdministrationPage(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformOwner, normalizedUser]);

  React.useEffect(() => {
    if (activeModel) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeModel]);

  React.useEffect(() => {
    if (showRegisterDevices) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showRegisterDevices]);

  React.useEffect(() => {
    if (showBusinessUsersReportPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showBusinessUsersReportPage]);

  React.useEffect(() => {
    if (showBusinessDashboardsReportPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showBusinessDashboardsReportPage]);

  React.useEffect(() => {
    if (showTenantUsersPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showTenantUsersPage]);

  React.useEffect(() => {
    if (showMySubscriptionPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showMySubscriptionPage]);

  React.useEffect(() => {
    if (showBillingAdminPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showBillingAdminPage]);

  React.useEffect(() => {
    if (showAdminSubscriptionsPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showAdminSubscriptionsPage]);

  React.useEffect(() => {
    if (showLogsActivityPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showLogsActivityPage]);

  React.useEffect(() => {
    if (showLogsAdministrationPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showLogsAdministrationPage]);

  React.useEffect(() => {
    if (showTagExplorerPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showTagExplorerPage]);

  const isDeviceManagerOpen =
    isPlatformOwner && !!activeModel;

  if (showRegisterDevices) {
    return (
      <div className="mt-4 md:mt-6">
        <RegisterDevicesSection
          onBack={() => setShowRegisterDevices(false)}
        />
      </div>
    );
  }

  // DF572 must be handled BEFORE generic DeviceManagerSection
  if (isPlatformOwner && activeModel === "DF572") {
    return (
      <div className="mt-4 md:mt-6">
        <DeviceManagerDf572Section
          mode="page"
          ownerEmail={detectedEmail || normalizedUser}
          onBack={() => setActiveModel(null)}
        />
      </div>
    );
  }

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

  if (isPlatformOwner && showBusinessUsersReportPage) {
    return (
      <div className="mt-4 md:mt-6">
        <BusinessUsersReportSection
          onBack={() =>
            setShowBusinessUsersReportPage(false)
          }
          ownerEmail={detectedEmail || normalizedUser}
        />
      </div>
    );
  }

  if (
    isPlatformOwner &&
    showBusinessDashboardsReportPage
  ) {
    return (
      <div className="mt-4 md:mt-6">
        <BusinessDashboardsReportSection
          onBack={() =>
            setShowBusinessDashboardsReportPage(false)
          }
          ownerEmail={detectedEmail || normalizedUser}
        />
      </div>
    );
  }

  if (showTenantUsersPage) {
    return (
      <div className="mt-4 md:mt-6">
        <TenantUsersPage
          onGoBack={() => setShowTenantUsersPage(false)}
        />
      </div>
    );
  }

  if (showMySubscriptionPage) {
    return (
      <div className="mt-4 md:mt-6">
        <MySubscriptionSection
          onBack={() =>
            setShowMySubscriptionPage(false)
          }
        />
      </div>
    );
  }

  if (isPlatformOwner && showBillingAdminPage) {
    return (
      <div className="mt-4 md:mt-6">
        <BillingAdminSection
          onBack={() =>
            setShowBillingAdminPage(false)
          }
          ownerEmail={detectedEmail || normalizedUser}
        />
      </div>
    );
  }

  if (
    isPlatformOwner &&
    showAdminSubscriptionsPage
  ) {
    return (
      <div className="mt-4 md:mt-6">
        <AdminSubscriptionsSection
          onBack={() =>
            setShowAdminSubscriptionsPage(false)
          }
          ownerEmail={detectedEmail || normalizedUser}
        />
      </div>
    );
  }

  if (showLogsActivityPage) {
    return (
      <div className="mt-4 md:mt-6">
        <LogsActivitySection
          onBack={() =>
            setShowLogsActivityPage(false)
          }
        />
      </div>
    );
  }

  if (
    isPlatformOwner &&
    showLogsAdministrationPage
  ) {
    return (
      <div className="mt-4 md:mt-6">
        <LogsAdministrationSection
          onBack={() =>
            setShowLogsAdministrationPage(false)
          }
        />
      </div>
    );
  }

  // TAG EXPLORER PAGE
  if (showTagExplorerPage) {
    return (
      <TagExplorerSection
        onBack={() => setShowTagExplorerPage(false)}
      />
    );
  }

  return (
    <>
      {/* TOP ROW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div
          className="rounded-xl bg-blue-600 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:opacity-95 transition"
          onClick={() => {
            setActiveSubPage("profile");
            setSubPageColor("bg-blue-600");
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👤</span>
            <h2 className="text-lg font-semibold">
              Profile
            </h2>
          </div>

          <p className="text-sm text-blue-100">
            View and edit your profile.
          </p>
        </div>

        <div
          className="rounded-xl bg-teal-500 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:opacity-95 transition"
          onClick={() => {
            setActiveSubPage("customers");
            setSubPageColor("bg-teal-500");
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📍</span>

            <h2 className="text-lg font-semibold">
              Customers / Locations
            </h2>
          </div>

          <p className="text-sm text-teal-100">
            Add customers and real site addresses.
          </p>
        </div>

        <div
          className="rounded-xl bg-sky-700 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:bg-sky-800 transition"
          onClick={() => setShowRegisterDevices(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📡</span>

            <h2 className="text-lg font-semibold">
              Registered Devices
            </h2>
          </div>

          <p className="text-sm text-sky-100">
            Register devices by model (CF-2000 / CF-1600 /
            TP-400 / DF572).
          </p>

          <div className="mt-3 text-xs text-sky-200 opacity-90">
            Click to open Register Devices
          </div>
        </div>
      </div>

      {/* ADMIN DASHBOARD CARD */}
      <div className="mt-4 md:mt-6">
        <div
          className="min-h-[150px] rounded-xl bg-gray-700 text-white px-4 py-6 md:px-5 md:py-7 cursor-pointer hover:bg-gray-800 transition"
          onClick={() => {
            setActiveSubPage("dashboardAdmin");
            setSubPageColor("bg-gray-700");
          }}
        >
          <div className="flex min-h-[94px] flex-col gap-5 lg:flex-row lg:items-center">
            {/* TITLE */}
            <div className="shrink-0 lg:w-[260px]">
              <h2 className="text-lg font-semibold">
                Admin Dashboard
              </h2>

              <p className="mt-1 text-sm text-gray-200">
                Manage the complete dashboard lifecycle.
              </p>
            </div>

            {/* TIMELINE */}
            <div className="min-w-0 flex-1">
              <div className="relative">
                {/* horizontal connecting line */}
                <div className="absolute left-[12.5%] right-[12.5%] top-[6px] hidden h-px bg-gray-400/80 sm:block" />

                <div className="relative grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-3 w-3 rounded-full bg-blue-400 ring-[3px] ring-gray-700" />
                    <div className="mt-2 text-xs font-bold uppercase tracking-wide">
                      Create
                    </div>
                    <div className="text-xs text-gray-100">
                      Dashboard
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="h-3 w-3 rounded-full bg-purple-400 ring-[3px] ring-gray-700" />
                    <div className="mt-2 text-xs font-bold uppercase tracking-wide">
                      Assign
                    </div>
                    <div className="text-xs text-gray-100">
                      Customer
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="h-3 w-3 rounded-full bg-amber-400 ring-[3px] ring-gray-700" />
                    <div className="mt-2 text-xs font-bold uppercase tracking-wide">
                      Edit
                    </div>
                    <div className="text-xs text-gray-100">
                      Dashboard
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="h-3 w-3 rounded-full bg-emerald-400 ring-[3px] ring-gray-700" />
                    <div className="mt-2 text-xs font-bold uppercase tracking-wide">
                      Operate
                    </div>
                    <div className="text-xs text-gray-100">
                      Dashboard
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OPEN ACTION */}
            <div className="shrink-0 lg:border-l lg:border-gray-500 lg:pl-6">
              <div className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">
                <span>Open Dashboard Admin</span>
                <span className="ml-2 text-base">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div
          className="rounded-xl bg-cyan-600 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:bg-cyan-700 transition"
          onClick={() => setShowTenantUsersPage(true)}
        >
          <h2 className="text-lg font-semibold mb-2">
            Tenant Users & Access
          </h2>

          <p className="text-sm text-slate-100">
            Create tenant users and assign dashboard access by
            permission level.
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

            <h2 className="text-lg font-semibold">
              My Subscription
            </h2>
          </div>

          <p className="text-sm text-emerald-100">
            Manage your subscription, billing details, and
            payment methods.
          </p>

          <div className="mt-3 text-xs text-emerald-100 opacity-90">
            Click to open subscription details
          </div>
        </div>

        <div
          className="rounded-xl bg-gray-800 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer hover:bg-gray-900 transition"
          onClick={() => setShowLogsActivityPage(true)}
        >
          <h2 className="text-lg font-semibold mb-2">
            Logs & Activity
          </h2>

          <p className="text-sm text-gray-200">
            Audit recent events.
          </p>

          <div className="mt-3 text-xs text-gray-300 opacity-90">
            Click to open Logs & Activity
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* TAG EXPLORER */}
      {/* ====================================================== */}

      <div className="mt-6">
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 shadow-md">
          <div className="relative z-10 flex min-h-[190px] flex-col gap-5 px-6 py-7 md:flex-row md:items-center md:gap-7 md:px-8">

            {/* SMALLER FOLDER */}
            <div className="flex shrink-0 items-center justify-center md:border-r md:border-amber-300 md:pr-7">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-amber-100">

                <div className="relative h-14 w-16 rounded-md bg-gradient-to-br from-amber-300 to-amber-500 shadow-sm">

                  {/* folder tab */}
                  <div className="absolute -top-2 left-1 h-4 w-8 rounded-t-md bg-amber-300" />

                  <span className="absolute inset-0 flex items-center justify-center text-3xl text-white">
                    🏷
                  </span>
                </div>
              </div>
            </div>

            {/* TITLE + DESCRIPTION */}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                Tag Explorer
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 md:text-[15px]">
                View and document all device points in one
                place. Add clear descriptions to your I/O
                points for easier identification, monitoring,
                and system organization.
              </p>
            </div>

            {/* DECORATIVE TAG / LIST */}
            <div
              aria-hidden="true"
              className="hidden shrink-0 items-center gap-3 text-amber-300/40 lg:flex"
            >
              <span className="text-6xl">🏷</span>

              <div className="space-y-2">
                <div className="h-2 w-20 rounded-full bg-amber-300/40" />
                <div className="h-2 w-16 rounded-full bg-amber-300/30" />
                <div className="h-2 w-20 rounded-full bg-amber-300/40" />
              </div>
            </div>

            {/* TALLER BUTTON */}
            <button
              type="button"
              onClick={() => setShowTagExplorerPage(true)}
              className="
                group
                flex
                min-h-[82px]
                shrink-0
                items-center
                justify-center
                gap-5
                rounded-2xl
                bg-gradient-to-b
                from-amber-300
                to-amber-400
                px-8
                text-base
                font-bold
                text-slate-950
                shadow-md
                transition
                hover:from-amber-400
                hover:to-amber-500
                hover:shadow-lg
                md:min-w-[245px]
              "
            >
              <span>Open Tag Explorer</span>

              <span
                aria-hidden="true"
                className="text-2xl transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* OWNER-ONLY: COMPACT DEVICE MANAGER ENTRY */}
      {isPlatformOwner && (
        <div className="mt-8 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">
              Device Manager (Owner Only)
            </h2>

            <span className="text-[11px] text-gray-500">
              Owner:{" "}
              {detectedEmail ||
                normalizedUser ||
                "unknown"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveModel("ZHC1921")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-left shadow-sm hover:bg-gray-50 transition min-h-[82px]"
            >
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                Model ZHC1921 (CF-2000)
              </div>

              <div className="mt-1 text-xs text-gray-600 leading-snug">
                Manage devices and live I/O.
              </div>
            </button>

            <button
              onClick={() => setActiveModel("ZHC1661")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-left shadow-sm hover:bg-gray-50 transition min-h-[82px]"
            >
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                Model ZHC1661 (CF-1600)
              </div>

              <div className="mt-1 text-xs text-gray-600 leading-snug">
                Manage devices and live I/O.
              </div>
            </button>

            <button
              onClick={() => setActiveModel("TP4000")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-left shadow-sm hover:bg-gray-50 transition min-h-[82px]"
            >
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                Model TP-4000
              </div>

              <div className="mt-1 text-xs text-gray-600 leading-snug">
                Manage devices and live I/O.
              </div>
            </button>

            <button
              onClick={() => setActiveModel("DF572")}
              className="w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-3 text-left shadow-sm hover:bg-cyan-100 transition min-h-[82px]"
            >
              <div className="text-sm font-semibold text-cyan-900 leading-tight">
                Wireless Level Sensor DF572
              </div>

              <div className="mt-1 text-xs text-cyan-700 leading-snug">
                Manage sensors and telemetry.
              </div>
            </button>
          </div>
        </div>
      )}

      {/* OWNER-ONLY BUSINESS SECTION */}
      {isPlatformOwner && (
        <div className="mt-8 border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">
              Business Reports (Owner Only)
            </h2>

            <span className="text-[11px] text-gray-500">
              Owner:{" "}
              {detectedEmail ||
                normalizedUser ||
                "unknown"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <button
              onClick={() =>
                setShowBusinessDashboardsReportPage(true)
              }
              className="w-full rounded-lg bg-gray-900 text-white px-4 py-3 text-left hover:opacity-90 transition min-h-[112px]"
            >
              <div className="text-base font-semibold leading-tight">
                Business Dashboards Report
              </div>

              <div className="mt-1 text-[13px] leading-snug opacity-80">
                View all users and dashboards created.
              </div>

              <div className="mt-2 text-[11px] opacity-90">
                Click to open dashboards report
              </div>
            </button>

            <button
              onClick={() =>
                setShowBusinessUsersReportPage(true)
              }
              className="w-full rounded-lg bg-teal-600 text-white px-4 py-3 text-left hover:opacity-90 transition min-h-[112px]"
            >
              <div className="text-base font-semibold leading-tight">
                Business Users Report
              </div>

              <div className="mt-1 text-[13px] leading-snug opacity-90">
                View total users and account stats.
              </div>

              <div className="mt-2 text-[11px] opacity-90">
                Click to open users report
              </div>
            </button>

            <button
              onClick={() =>
                setShowAdminSubscriptionsPage(true)
              }
              className="w-full rounded-lg bg-indigo-700 text-white px-4 py-3 text-left hover:opacity-90 transition min-h-[112px]"
            >
              <div className="text-base font-semibold leading-tight">
                Admin Subscriptions
              </div>

              <div className="mt-1 text-[13px] leading-snug opacity-90">
                View and modify all user subscriptions,
                limits, and backend data.
              </div>

              <div className="mt-2 text-[11px] opacity-90">
                Click to open admin subscriptions
              </div>
            </button>

            <button
              onClick={() =>
                setShowBillingAdminPage(true)
              }
              className="w-full rounded-lg bg-emerald-700 text-white px-4 py-3 text-left hover:opacity-90 transition min-h-[112px]"
            >
              <div className="text-base font-semibold leading-tight">
                Billing Admin
              </div>

              <div className="mt-1 text-[13px] leading-snug opacity-90">
                Manage plans, add-ons, pricing, and Stripe
                sync as platform owner.
              </div>

              <div className="mt-2 text-[11px] opacity-90">
                Click to open billing admin
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setShowLogsAdministrationPage(true)
              }
              className="w-full rounded-lg bg-gray-800 text-white px-4 py-3 text-left hover:bg-gray-900 transition min-h-[112px]"
            >
              <div className="text-base font-semibold leading-tight">
                Logs administration
              </div>

              <div className="mt-1 text-[13px] leading-snug opacity-90">
                Manage platform logs and audit
                administration.
              </div>

              <div className="mt-2 text-[11px] opacity-90">
                Logs administration
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}