// src/components/homepagesections/LogsAdministrationSection.jsx

import React from "react";

// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL = String(
  import.meta.env.VITE_API_URL || "https://coreflex-api.onrender.com"
).replace(/\/+$/, "");

// ============================================================
// ERROR HELPER
// ============================================================

function getApiErrorMessage(data, fallback) {
  if (!data) {
    return fallback;
  }

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail.trim();
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim();
  }

  if (
    data?.detail &&
    typeof data.detail === "object"
  ) {
    if (
      typeof data.detail.error === "string" &&
      data.detail.error.trim()
    ) {
      return data.detail.error.trim();
    }

    if (
      typeof data.detail.message === "string" &&
      data.detail.message.trim()
    ) {
      return data.detail.message.trim();
    }
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  return fallback;
}

// ============================================================
// FORMAT HELPERS
// ============================================================

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

function formatTimestamp(value) {
  if (!value) {
    return "—";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  } catch {
    return String(value);
  }
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

// ============================================================
// CATEGORY OPTIONS
// ============================================================

const CATEGORY_OPTIONS = [
  {
    value: "ALL",
    label: "All Categories",
  },
  {
    value: "SECURITY",
    label: "Security",
  },
  {
    value: "DASHBOARD",
    label: "Dashboard",
  },
  {
    value: "DEVICE",
    label: "Device",
  },
  {
    value: "USER",
    label: "User",
  },
  {
    value: "CONTROL",
    label: "Control",
  },
  {
    value: "BILLING",
    label: "Billing",
  },
  {
    value: "SYSTEM",
    label: "System",
  },
];

// ============================================================
// STATUS STYLE
// ============================================================

function getStatusClass(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();

  if (normalized === "SUCCESS") {
    return "text-green-700 font-semibold";
  }

  if (normalized === "FAILED") {
    return "text-red-600 font-semibold";
  }

  return "text-gray-700 font-semibold";
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function LogsAdministrationSection({
  onBack,
}) {
  // ==========================================================
  // USER SEARCH
  // ==========================================================

  const [emailInput, setEmailInput] = React.useState("");
  const [selectedEmail, setSelectedEmail] = React.useState("");

  // ==========================================================
  // LOG DATA
  // ==========================================================

  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");

  const [lastLoadedDate, setLastLoadedDate] = React.useState("");

  // ==========================================================
  // LOG FILTERS
  // ==========================================================

  const [categoryFilter, setCategoryFilter] =
    React.useState("ALL");

  const [searchText, setSearchText] = React.useState("");

  // ==========================================================
  // EXPANDED ROW
  // ==========================================================

  const [expandedId, setExpandedId] = React.useState(null);

  // ==========================================================
  // READ USER LOGS
  // ==========================================================

  const loadUserLogs = React.useCallback(
    async (email) => {
      const cleanEmail = normalizeEmail(email);

      if (!cleanEmail) {
        setErrorMessage("Enter a user email.");
        setSuccessMessage("");
        setLogs([]);
        setSelectedEmail("");
        setLastLoadedDate("");
        return;
      }

      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const response = await fetch(
          `${API_URL}/admin/logs/read`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },

            cache: "no-store",

            body: JSON.stringify({
              email: cleanEmail,
            }),
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data,
              `Failed to load user logs (${response.status})`
            )
          );
        }

        const rows = Array.isArray(data?.logs)
          ? data.logs
          : [];

        // ------------------------------------------------------
        // Add frontend-only row identifier
        // ------------------------------------------------------

        const normalizedRows = rows.map(
          (log, index) => ({
            ...log,

            __row_id:
              log?.id ??
              `${String(
                log?.timestamp || "log"
              )}-${index}`,
          })
        );

        setLogs(normalizedRows);

        setSelectedEmail(
          normalizeEmail(
            data?.user_email ||
              data?.email ||
              cleanEmail
          )
        );

        setLastLoadedDate(
          String(data?.date || "")
        );

        setExpandedId(null);

        setSuccessMessage(
          `Loaded ${normalizedRows.length} log${
            normalizedRows.length === 1 ? "" : "s"
          } for ${cleanEmail}`
        );
      } catch (error) {
        console.error(
          "Logs Administration read failed:",
          error
        );

        setLogs([]);
        setSelectedEmail("");
        setLastLoadedDate("");
        setExpandedId(null);

        setErrorMessage(
          String(
            error?.message ||
              "Unable to load user logs."
          )
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ==========================================================
  // SEARCH USER
  // ==========================================================

  const handleUserSearch = () => {
    loadUserLogs(emailInput);
  };

  // ==========================================================
  // ENTER KEY SEARCH
  // ==========================================================

  const handleEmailKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      handleUserSearch();
    }
  };

  // ==========================================================
  // REFRESH CURRENT USER
  // ==========================================================

  const handleRefresh = () => {
    if (!selectedEmail) {
      setErrorMessage(
        "Search for a user email first."
      );

      return;
    }

    loadUserLogs(selectedEmail);
  };

  // ==========================================================
  // FILTER LOGS
  // ==========================================================

  const filteredLogs = React.useMemo(() => {
    const search = String(searchText || "")
      .trim()
      .toLowerCase();

    return logs.filter((log) => {
      const category = String(
        log?.category || ""
      )
        .trim()
        .toUpperCase();

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
        log?.timestamp,

        log?.user_email,

        log?.actor_type,

        log?.tenant_email,
        log?.tenant_name,

        log?.category,
        log?.action,
        log?.status,
        log?.message,

        log?.customer_id,
        log?.dashboard_id,

        log?.device_id,
        log?.gateway_id,

        log?.field,
        log?.old_value,
        log?.new_value,

        log?.ip_address,
        log?.user_agent,
      ]
        .map((value) => formatValue(value))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [
    logs,
    searchText,
    categoryFilter,
  ]);

  // ==========================================================
  // EXPAND / COLLAPSE ROW
  // ==========================================================

  const toggleRow = (id) => {
    setExpandedId((current) => {
      return current === id ? null : id;
    });
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const handleClear = () => {
    setEmailInput("");
    setSelectedEmail("");

    setLogs([]);

    setCategoryFilter("ALL");
    setSearchText("");

    setExpandedId(null);

    setErrorMessage("");
    setSuccessMessage("");

    setLastLoadedDate("");
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
            Logs Administration
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Search users by email and review their
            platform logs and audit activity.
          </p>
        </div>
      </div>

      {/* =====================================================
          USER SEARCH WINDOW
      ====================================================== */}

      <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm mb-5">
        <div className="p-4">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            User Email
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(event) => {
                setEmailInput(event.target.value);
              }}
              onKeyDown={handleEmailKeyDown}
              placeholder="Enter user email..."
              autoComplete="off"
              className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
            />

            <button
              type="button"
              onClick={handleUserSearch}
              disabled={loading}
              className="px-5 py-2 rounded-md bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="px-5 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>

          {/* =================================================
              SELECTED USER
          ================================================== */}

          {selectedEmail && (
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Selected User
              </div>

              <div className="mt-1 text-sm font-semibold text-gray-900 break-all">
                {selectedEmail}
              </div>

              {lastLoadedDate && (
                <div className="mt-1 text-xs text-gray-500">
                  Log date: {lastLoadedDate}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {successMessage && !errorMessage && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* =====================================================
          LOG WINDOW
      ====================================================== */}

      <div className="w-full bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        {/* ===================================================
            TOOLBAR
        ==================================================== */}

        <div className="p-3 border-b border-gray-300">
          <div className="flex flex-col lg:flex-row gap-2">
            {/* CATEGORY */}

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(
                  event.target.value
                );
              }}
              className="w-full lg:w-[190px] border border-gray-300 rounded-md px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gray-300"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {/* SEARCH LOGS */}

            <input
              type="text"
              value={searchText}
              onChange={(event) => {
                setSearchText(
                  event.target.value
                );
              }}
              placeholder="Search logs..."
              disabled={!selectedEmail}
              className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100"
            />

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                loading || !selectedEmail
              }
              className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ===================================================
            TABLE
        ==================================================== */}

        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            {/* =================================================
                TABLE HEADER
            ================================================== */}

            <div className="grid grid-cols-[155px_120px_170px_100px_110px_minmax(300px,1fr)_250px] bg-gray-50 border-b border-gray-300 text-[11px] font-bold text-gray-700 uppercase">
              <div className="px-3 py-2">
                Time
              </div>

              <div className="px-3 py-2">
                Category
              </div>

              <div className="px-3 py-2">
                Action
              </div>

              <div className="px-3 py-2">
                Status
              </div>

              <div className="px-3 py-2">
                Actor
              </div>

              <div className="px-3 py-2">
                Message
              </div>

              <div className="px-3 py-2">
                Email
              </div>
            </div>

            {/* =================================================
                TABLE BODY
            ================================================== */}

            <div className="max-h-[520px] overflow-y-auto">
              {/* LOADING */}

              {loading && (
                <div className="flex items-center justify-center min-h-[160px] text-sm text-gray-500">
                  Loading logs...
                </div>
              )}

              {/* NO USER SELECTED */}

              {!loading &&
                !selectedEmail &&
                !errorMessage && (
                  <div className="flex items-center justify-center min-h-[160px] text-sm text-gray-500">
                    Search for a user email to
                    view logs.
                  </div>
                )}

              {/* NO LOGS */}

              {!loading &&
                selectedEmail &&
                filteredLogs.length === 0 && (
                  <div className="flex items-center justify-center min-h-[160px] text-sm text-gray-500">
                    No logs found.
                  </div>
                )}

              {/* LOG ROWS */}

              {!loading &&
                filteredLogs.map((log) => {
                  const rowId =
                    log.__row_id;

                  const expanded =
                    expandedId === rowId;

                  const actorEmail =
                    String(
                      log?.actor_type || ""
                    )
                      .trim()
                      .toUpperCase() ===
                    "TENANT"
                      ? log?.tenant_email ||
                        log?.user_email
                      : log?.user_email;

                  return (
                    <React.Fragment
                      key={rowId}
                    >
                      {/* =====================================
                          MAIN ROW
                      ====================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          toggleRow(rowId)
                        }
                        className="w-full grid grid-cols-[155px_120px_170px_100px_110px_minmax(300px,1fr)_250px] text-left border-b border-gray-200 hover:bg-gray-50 transition text-xs"
                      >
                        <div className="px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis">
                          <span className="mr-1 text-blue-500">
                            {expanded
                              ? "▼"
                              : "▶"}
                          </span>

                          {formatTimestamp(
                            log?.timestamp
                          )}
                        </div>

                        <div className="px-3 py-2 font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatValue(
                            log?.category
                          )}
                        </div>

                        <div className="px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatValue(
                            log?.action
                          )}
                        </div>

                        <div
                          className={`px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis ${getStatusClass(
                            log?.status
                          )}`}
                        >
                          {formatValue(
                            log?.status
                          )}
                        </div>

                        <div className="px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatValue(
                            log?.actor_type
                          )}
                        </div>

                        <div
                          className="px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis"
                          title={formatValue(
                            log?.message
                          )}
                        >
                          {formatValue(
                            log?.message
                          )}
                        </div>

                        <div
                          className="px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis"
                          title={formatValue(
                            actorEmail
                          )}
                        >
                          {formatValue(
                            actorEmail
                          )}
                        </div>
                      </button>

                      {/* =====================================
                          EXPANDED DETAILS
                      ====================================== */}

                      {expanded && (
                        <div className="border-b border-gray-300 bg-gray-50 px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-xs">
                            {/* OWNER */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Owner Email
                              </div>

                              <div className="text-gray-900 break-all">
                                {formatValue(
                                  log?.user_email
                                )}
                              </div>
                            </div>

                            {/* ACTOR */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Actor Type
                              </div>

                              <div className="text-gray-900">
                                {formatValue(
                                  log?.actor_type
                                )}
                              </div>
                            </div>

                            {/* TENANT EMAIL */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Tenant Email
                              </div>

                              <div className="text-gray-900 break-all">
                                {formatValue(
                                  log?.tenant_email
                                )}
                              </div>
                            </div>

                            {/* TENANT NAME */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Tenant Name
                              </div>

                              <div className="text-gray-900">
                                {formatValue(
                                  log?.tenant_name
                                )}
                              </div>
                            </div>

                            {/* CUSTOMER */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Customer
                              </div>

                              <div className="text-gray-900">
                                {formatValue(
                                  log?.customer_id
                                )}
                              </div>
                            </div>

                            {/* DASHBOARD */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Dashboard
                              </div>

                              <div className="text-gray-900">
                                {formatValue(
                                  log?.dashboard_id
                                )}
                              </div>
                            </div>

                            {/* DEVICE */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Device
                              </div>

                              <div className="text-gray-900 break-all">
                                {formatValue(
                                  log?.device_id
                                )}
                              </div>
                            </div>

                            {/* GATEWAY */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Gateway
                              </div>

                              <div className="text-gray-900 break-all">
                                {formatValue(
                                  log?.gateway_id
                                )}
                              </div>
                            </div>

                            {/* FIELD */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Field
                              </div>

                              <div className="text-gray-900">
                                {formatValue(
                                  log?.field
                                )}
                              </div>
                            </div>

                            {/* OLD VALUE */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                Old Value
                              </div>

                              <div className="text-gray-900 break-all">
                                {formatValue(
                                  log?.old_value
                                )}
                              </div>
                            </div>

                            {/* NEW VALUE */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                New Value
                              </div>

                              <div className="text-gray-900 break-all">
                                {formatValue(
                                  log?.new_value
                                )}
                              </div>
                            </div>

                            {/* IP */}

                            <div>
                              <div className="font-bold text-gray-500 uppercase mb-1">
                                IP Address
                              </div>

                              <div className="text-gray-900 break-all">
                                {formatValue(
                                  log?.ip_address
                                )}
                              </div>
                            </div>
                          </div>

                          {/* MESSAGE */}

                          <div className="mt-4">
                            <div className="font-bold text-gray-500 uppercase text-xs mb-1">
                              Message
                            </div>

                            <div className="text-xs text-gray-900 whitespace-pre-wrap break-words">
                              {formatValue(
                                log?.message
                              )}
                            </div>
                          </div>

                          {/* USER AGENT */}

                          <div className="mt-4">
                            <div className="font-bold text-gray-500 uppercase text-xs mb-1">
                              User Agent
                            </div>

                            <div className="text-xs text-gray-900 whitespace-pre-wrap break-words">
                              {formatValue(
                                log?.user_agent
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
            </div>

            {/* =================================================
                FOOTERR
            ================================================== */}

            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              <div>
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filteredLogs.length}
                </span>{" "}
                log
                {filteredLogs.length === 1
                  ? ""
                  : "s"}
              </div>

              <div>
                CoreFlex Logs Administration
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}