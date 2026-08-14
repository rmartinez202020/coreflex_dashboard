// src/components/homepagesections/LogsActivitySection.jsx

import React from "react";

// ============================================================
// SAMPLE DATA
// ------------------------------------------------------------
// Frontend template only.
//
// Later this array will be replaced by the real logs returned
// from the backend / Node-RED historian.
// ============================================================

const SAMPLE_LOGS = [
  {
    id: 1,
    timestamp: "2026-08-11T04:20:47.536Z",
    user_id: 11,
    user_email: "owner@example.com",

    actor_type: "TENANT",
    tenant_user_id: 12,
    tenant_email: "tenant@example.com",
    tenant_name: "Martinez",

    category: "SECURITY",
    action: "LOGIN_SUCCESS",
    status: "SUCCESS",
    message: "Tenant login successful",

    customer_id: null,
    dashboard_id: "20",
    device_id: null,
    gateway_id: null,

    field: null,
    old_value: null,
    new_value: null,

    ip_address: "72.76.251.181",
    user_agent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },

  {
    id: 2,
    timestamp: "2026-08-11T03:59:39.444Z",
    user_id: 11,
    user_email: "owner@example.com",

    actor_type: "OWNER",
    tenant_user_id: null,
    tenant_email: null,
    tenant_name: null,

    category: "SECURITY",
    action: "LOGIN_FAILED",
    status: "FAILED",
    message: "Login failed: invalid credentials",

    customer_id: null,
    dashboard_id: null,
    device_id: null,
    gateway_id: null,

    field: null,
    old_value: null,
    new_value: null,

    ip_address: "72.76.251.181",
    user_agent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },

  {
    id: 3,
    timestamp: "2026-08-11T03:58:04.888Z",
    user_id: 11,
    user_email: "owner@example.com",

    actor_type: "OWNER",
    tenant_user_id: null,
    tenant_email: null,
    tenant_name: null,

    category: "SECURITY",
    action: "LOGIN_SUCCESS",
    status: "SUCCESS",
    message: "User login successful",

    customer_id: null,
    dashboard_id: null,
    device_id: null,
    gateway_id: null,

    field: null,
    old_value: null,
    new_value: null,

    ip_address: "72.76.251.181",
    user_agent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
];

// ============================================================
// HELPERS
// ============================================================

function formatTimestamp(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  return date.toLocaleString();
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function getStatusClass(status) {
  const value = String(status || "").toUpperCase();

  if (value === "SUCCESS") {
    return "text-green-700 font-semibold";
  }

  if (value === "FAILED") {
    return "text-red-700 font-semibold";
  }

  return "text-gray-800 font-semibold";
}

// ============================================================
// DETAIL FIELD
// ============================================================

function DetailField({ label, value }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-1 md:gap-4 py-1.5">
      <div className="text-xs font-semibold text-gray-500">
        {label}
      </div>

      <div className="text-xs text-gray-900 break-all">
        {formatValue(value)}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function LogsActivitySection({ onBack }) {
  const [logs] = React.useState(SAMPLE_LOGS);

  const [expandedId, setExpandedId] = React.useState(null);

  const [searchText, setSearchText] = React.useState("");

  const [categoryFilter, setCategoryFilter] =
    React.useState("ALL");

  // ==========================================================
  // FILTER LOGS
  // ==========================================================

  const filteredLogs = React.useMemo(() => {
    const search = String(searchText || "")
      .trim()
      .toLowerCase();

    return logs.filter((log) => {
      const category = String(log.category || "").toUpperCase();

      if (
        categoryFilter !== "ALL" &&
        category !== categoryFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [
        log.timestamp,
        log.user_id,
        log.user_email,
        log.actor_type,
        log.tenant_user_id,
        log.tenant_email,
        log.tenant_name,
        log.category,
        log.action,
        log.status,
        log.message,
        log.customer_id,
        log.dashboard_id,
        log.device_id,
        log.gateway_id,
        log.field,
        log.old_value,
        log.new_value,
        log.ip_address,
      ]
        .map((value) => formatValue(value))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [logs, searchText, categoryFilter]);

  // ==========================================================
  // ROW CLICK
  // ==========================================================

  const toggleRow = (id) => {
    setExpandedId((current) => {
      return current === id ? null : id;
    });
  };

  // ==========================================================
  // REFRESH
  // ----------------------------------------------------------
  // Template only for now.
  // Later this will request fresh log data from the backend.
  // ==========================================================

  const handleRefresh = () => {
    setExpandedId(null);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Logs & Activity
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Audit and security activity for your account.
          </p>
        </div>
      </div>

      {/* =====================================================
          MAIN LOG WINDOW
      ====================================================== */}

      <div className="w-full bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        {/* ===================================================
            TOOLBAR
        ==================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-3 border-b border-gray-300 bg-white">
          {/* CATEGORY */}

          <div className="w-full lg:w-[190px]">
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
              className="w-full h-9 rounded border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-500"
            >
              <option value="ALL">All Categories</option>
              <option value="SECURITY">Security</option>
              <option value="DASHBOARD">Dashboard</option>
              <option value="DEVICE">Device</option>
              <option value="USER">User</option>
              <option value="CONTROL">Control</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          {/* SEARCH */}

          <div className="flex-1">
            <input
              type="text"
              value={searchText}
              onChange={(e) =>
                setSearchText(e.target.value)
              }
              placeholder="Search logs..."
              className="w-full h-9 rounded border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-500"
            />
          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            className="h-9 px-4 rounded border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            ↻ Refresh
          </button>
        </div>

        {/* ===================================================
            LOG TABLE
        ==================================================== */}

        <div className="w-full overflow-x-auto">
          <div className="min-w-[1050px]">
            {/* TABLE HEADER */}

            <div className="grid grid-cols-[190px_120px_190px_110px_110px_1fr] bg-gray-50 border-b border-gray-300">
              <div className="px-3 py-2 text-[11px] font-bold text-gray-600">
                TIME
              </div>

              <div className="px-3 py-2 text-[11px] font-bold text-gray-600">
                CATEGORY
              </div>

              <div className="px-3 py-2 text-[11px] font-bold text-gray-600">
                ACTION
              </div>

              <div className="px-3 py-2 text-[11px] font-bold text-gray-600">
                STATUS
              </div>

              <div className="px-3 py-2 text-[11px] font-bold text-gray-600">
                ACTOR
              </div>

              <div className="px-3 py-2 text-[11px] font-bold text-gray-600">
                MESSAGE
              </div>
            </div>

            {/* TABLE BODY */}

            {filteredLogs.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                No logs found.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id;

                return (
                  <React.Fragment key={log.id}>
                    {/* =======================================
                        LOG ROW
                    ======================================== */}

                    <button
                      type="button"
                      onClick={() => toggleRow(log.id)}
                      className="w-full grid grid-cols-[190px_120px_190px_110px_110px_1fr] text-left bg-white border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <div className="px-3 py-2.5 text-xs text-gray-900 whitespace-nowrap">
                        <span className="inline-block w-4 text-gray-400">
                          {isExpanded ? "▼" : "▶"}
                        </span>

                        {formatTimestamp(log.timestamp)}
                      </div>

                      <div className="px-3 py-2.5 text-xs font-semibold text-gray-900">
                        {formatValue(log.category)}
                      </div>

                      <div className="px-3 py-2.5 text-xs text-gray-900">
                        {formatValue(log.action)}
                      </div>

                      <div
                        className={`px-3 py-2.5 text-xs ${getStatusClass(
                          log.status
                        )}`}
                      >
                        {formatValue(log.status)}
                      </div>

                      <div className="px-3 py-2.5 text-xs text-gray-900">
                        {formatValue(log.actor_type)}
                      </div>

                      <div className="px-3 py-2.5 text-xs text-gray-700 truncate">
                        {formatValue(log.message)}
                      </div>
                    </button>

                    {/* =======================================
                        EXPANDED RECORD
                    ======================================== */}

                    {isExpanded && (
                      <div className="bg-gray-50 border-b border-gray-300 px-5 py-4">
                        <div className="mb-3">
                          <div className="text-sm font-bold text-gray-900">
                            Complete Log Record
                          </div>

                          <div className="text-xs text-gray-500 mt-0.5">
                            Full information stored for this
                            event.
                          </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-md p-4">
                          {/* EVENT */}

                          <div className="mb-4">
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
                              Event
                            </div>

                            <DetailField
                              label="Timestamp UTC"
                              value={log.timestamp}
                            />

                            <DetailField
                              label="Category"
                              value={log.category}
                            />

                            <DetailField
                              label="Action"
                              value={log.action}
                            />

                            <DetailField
                              label="Status"
                              value={log.status}
                            />

                            <DetailField
                              label="Message"
                              value={log.message}
                            />
                          </div>

                          {/* OWNER */}

                          <div className="mb-4">
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
                              Account Owner
                            </div>

                            <DetailField
                              label="User ID"
                              value={log.user_id}
                            />

                            <DetailField
                              label="User Email"
                              value={log.user_email}
                            />
                          </div>

                          {/* ACTOR */}

                          <div className="mb-4">
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
                              Actor
                            </div>

                            <DetailField
                              label="Actor Type"
                              value={log.actor_type}
                            />

                            <DetailField
                              label="Tenant User ID"
                              value={log.tenant_user_id}
                            />

                            <DetailField
                              label="Tenant Email"
                              value={log.tenant_email}
                            />

                            <DetailField
                              label="Tenant Name"
                              value={log.tenant_name}
                            />
                          </div>

                          {/* PLATFORM CONTEXT */}

                          <div className="mb-4">
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
                              Platform Context
                            </div>

                            <DetailField
                              label="Customer ID"
                              value={log.customer_id}
                            />

                            <DetailField
                              label="Dashboard ID"
                              value={log.dashboard_id}
                            />

                            <DetailField
                              label="Device ID"
                              value={log.device_id}
                            />

                            <DetailField
                              label="Gateway ID"
                              value={log.gateway_id}
                            />
                          </div>

                          {/* CHANGE DETAILS */}

                          <div className="mb-4">
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
                              Change / Control Details
                            </div>

                            <DetailField
                              label="Field"
                              value={log.field}
                            />

                            <DetailField
                              label="Old Value"
                              value={log.old_value}
                            />

                            <DetailField
                              label="New Value"
                              value={log.new_value}
                            />
                          </div>

                          {/* REQUEST */}

                          <div>
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
                              Request Information
                            </div>

                            <DetailField
                              label="IP Address"
                              value={log.ip_address}
                            />

                            <DetailField
                              label="User Agent"
                              value={log.user_agent}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* ===================================================
            FOOTER
        ==================================================== */}

        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-300">
          <div className="text-xs text-gray-500">
            Showing {filteredLogs.length} log
            {filteredLogs.length === 1 ? "" : "s"}
          </div>

          <div className="text-xs text-gray-500">
            CoreFlex Logs & Activity
          </div>
        </div>
      </div>
    </div>
  );
}