import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function BusinessUsersReportSection({
  onBack,
  ownerEmail = "",
}) {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError("");

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

      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      setError(err?.message || "Failed to load registered users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="mt-4 md:mt-6">
      {/* ✅ UPDATED SMALLER HEADER */}
      <div className="rounded-xl bg-blue-600 text-white px-4 md:px-5 py-3 md:py-4 shadow-sm">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center rounded-md bg-white/15 hover:bg-white/20 px-3 py-2 text-sm font-semibold transition"
        >
          ← Back
        </button>

        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
          Business Users Report
        </h1>
      </div>

      {/* ✅ Main white card */}
      <div className="mt-5 max-w-[1280px] mx-auto bg-white rounded-xl shadow border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Registered Platform Users
            </h2>
            <p className="text-gray-600 mt-1">
              View all registered users on the platform.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Password hashes are excluded from this report.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              Owner: {ownerEmail || "unknown"}
            </span>

            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                loading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-slate-700 text-white hover:bg-slate-800"
              }`}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-gray-600 text-sm">
            Loading registered users...
          </div>
        ) : users.length === 0 ? (
          <div className="py-10 text-gray-600 text-sm">
            No registered users found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                {users.map((user, idx) => (
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
    </div>
  );
}