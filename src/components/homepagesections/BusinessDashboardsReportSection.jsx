import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function BusinessDashboardsReportSection({
  onBack,
  ownerEmail = "",
}) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const fetchDashboards = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = String(getToken() || "").trim();

      const res = await fetch(`${API_URL}/customers-dashboards/admin/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to load dashboards");
      }

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load dashboards");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  return (
    <div className="mt-4 md:mt-6">
      {/* ✅ HEADER (MATCH USERS STYLE — SMALL + TEAL) */}
      <div className="rounded-xl bg-gray-900 text-white px-4 md:px-5 py-3 md:py-4 shadow-sm">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center rounded-md bg-white/15 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold transition"
        >
          ← Back
        </button>

        <h1 className="text-lg md:text-xl font-bold tracking-tight">
          Business Dashboards Report
        </h1>
      </div>

      {/* ✅ CONTENT */}
      <div className="mt-5 max-w-[1280px] mx-auto bg-white rounded-xl shadow border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              All Customer Dashboards
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              View all dashboards created on the platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Owner: {ownerEmail || "unknown"}
            </span>

            <button
              onClick={fetchDashboards}
              disabled={loading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                loading
                  ? "bg-gray-200 text-gray-500"
                  : "bg-slate-700 text-white hover:bg-slate-800"
              }`}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-sm text-gray-600">
            Loading dashboards...
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-600">
            No dashboards found.
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">User ID</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Dashboard Name</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-4 py-3 border-t">{r.id}</td>
                    <td className="px-4 py-3 border-t">{r.user_id}</td>
                    <td className="px-4 py-3 border-t">{r.customer_name}</td>
                    <td className="px-4 py-3 border-t">{r.dashboard_name}</td>
                    <td className="px-4 py-3 border-t">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="px-4 py-3 border-t">
                      {formatDateTime(r.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}