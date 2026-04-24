import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function normalizeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.trunc(n));
}

function planBadgeClass(planKey) {
  const key = String(planKey || "").toLowerCase().trim();
  if (key === "enterprise") return "bg-violet-100 text-violet-800 border-violet-200";
  if (key === "industrial") return "bg-amber-100 text-amber-800 border-amber-200";
  if (key === "professional") return "bg-sky-100 text-sky-800 border-sky-200";
  if (key === "starter") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function statTileClass(kind) {
  if (kind === "good") return "border-emerald-200 bg-emerald-50";
  if (kind === "warn") return "border-amber-200 bg-amber-50";
  if (kind === "bad") return "border-red-200 bg-red-50";
  return "border-slate-200 bg-white";
}

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "industrial", label: "Industrial" },
  { value: "enterprise", label: "Enterprise" },
];

export default function AdminSubscriptionsSection({ onBack, ownerEmail }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState({
    plan_key: "free",
    device_limit: 1,
    tenants_users_limit: 1,
    is_active: true,
  });

  const token = getToken();

  const authHeaders = useMemo(() => {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const loadSubscriptions = useCallback(
    async ({ silent = false } = {}) => {
      try {
        setError("");
        setSuccessMessage("");

        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const res = await fetch(`${API_URL}/admin/subscriptions`, {
          method: "GET",
          headers: authHeaders,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.detail || data?.error || "Failed to load subscriptions.");
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        setRows(items);
      } catch (err) {
        setError(err?.message || "Failed to load subscriptions.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authHeaders]
  );

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const t = window.setTimeout(() => setSuccessMessage(""), 2400);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  const filteredRows = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        String(row.user_id || "").toLowerCase().includes(q) ||
        String(row.name || "").toLowerCase().includes(q) ||
        String(row.email || "").toLowerCase().includes(q) ||
        String(row.company || "").toLowerCase().includes(q) ||
        String(row.plan_key || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !!row.is_active) ||
        (statusFilter === "inactive" && !row.is_active) ||
        (statusFilter === "over_limit" &&
          (row.device_over_limit || row.tenant_users_over_limit));

      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => !!r.is_active).length;
    const inactive = rows.filter((r) => !r.is_active).length;
    const overDevice = rows.filter((r) => !!r.device_over_limit).length;
    const overTenant = rows.filter((r) => !!r.tenant_users_over_limit).length;

    return { total, active, inactive, overDevice, overTenant };
  }, [rows]);

  function startEdit(row) {
    setEditingUserId(row.user_id);
    setSuccessMessage("");
    setError("");
    setForm({
      plan_key: row.plan_key || "free",
      device_limit: normalizeInt(row.device_limit, 1),
      tenants_users_limit: normalizeInt(row.tenants_users_limit, 1),
      is_active: !!row.is_active,
    });
  }

  function cancelEdit() {
    setEditingUserId(null);
    setForm({
      plan_key: "free",
      device_limit: 1,
      tenants_users_limit: 1,
      is_active: true,
    });
  }

  async function saveEdit(userId) {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        plan_key: String(form.plan_key || "free").trim().toLowerCase(),
        device_limit: normalizeInt(form.device_limit, 1),
        tenants_users_limit: normalizeInt(form.tenants_users_limit, 1),
        is_active: !!form.is_active,
      };

      let res = await fetch(`${API_URL}/admin/subscriptions/${userId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      let data = await res.json().catch(() => ({}));

      if (!res.ok) {
        res = await fetch(`${API_URL}/admin/subscriptions/upsert`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            user_id: userId,
            ...payload,
          }),
        });
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "Failed to save subscription.");
      }

      setRows((prev) =>
        prev.map((row) =>
          row.user_id === userId
            ? {
                ...row,
                plan_key: payload.plan_key,
                plan_label:
                  PLAN_OPTIONS.find((p) => p.value === payload.plan_key)?.label ||
                  payload.plan_key,
                device_limit: payload.device_limit,
                tenants_users_limit: payload.tenants_users_limit,
                is_active: payload.is_active,
                status: payload.is_active ? "Active" : "Inactive",
              }
            : row
        )
      );

      setSuccessMessage("Subscription saved successfully.");
      cancelEdit();
      await loadSubscriptions({ silent: true });
    } catch (err) {
      setError(err?.message || "Failed to save subscription.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 md:mt-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white px-5 py-5 shadow-sm">
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
        >
          ← Back
        </button>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Admin Subscriptions
            </h1>
            <p className="mt-2 text-sm text-slate-200">
              View live backend subscription rows and edit plan, limits, and active status.
            </p>
          </div>

          <div className="text-xs text-slate-300">
            Owner: {ownerEmail || "unknown"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`rounded-2xl border p-4 shadow-sm ${statTileClass("default")}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Users
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-800">{stats.total}</div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${statTileClass("good")}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Active
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-800">{stats.active}</div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${statTileClass("warn")}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Inactive
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-800">{stats.inactive}</div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${statTileClass("bad")}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Over Device Limit
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-800">{stats.overDevice}</div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${statTileClass("bad")}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Over Tenant Limit
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-800">{stats.overTenant}</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              User Subscriptions Table
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Refresh, inspect, and edit backend subscription rows.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search user, email, plan, company..."
              className="w-full md:w-72 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
              <option value="over_limit">Over limit only</option>
            </select>

            <button
              onClick={() => loadSubscriptions({ silent: true })}
              disabled={refreshing || loading}
              className="rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[1500px] w-full">
            <thead className="bg-slate-800 text-white">
              <tr className="text-left text-sm">
                <th className="px-4 py-3 font-semibold">User ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Device Limit</th>
                <th className="px-4 py-3 font-semibold">Devices Used</th>
                <th className="px-4 py-3 font-semibold">Tenant Limit</th>
                <th className="px-4 py-3 font-semibold">Tenant Used</th>
                <th className="px-4 py-3 font-semibold">Active Date</th>
                <th className="px-4 py-3 font-semibold">Renewal Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-slate-500">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-slate-500">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isEditing = editingUserId === row.user_id;
                  const overDevice = !!row.device_over_limit;
                  const overTenant = !!row.tenant_users_over_limit;

                  return (
                    <React.Fragment key={row.user_id}>
                      <tr className="align-top text-sm hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {row.user_id}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {row.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.company || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${planBadgeClass(
                              row.plan_key
                            )}`}
                          >
                            {row.plan_label || row.plan_key || "Free"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {row.device_limit ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              overDevice
                                ? "font-semibold text-red-600"
                                : "text-slate-800"
                            }
                          >
                            {row.devices_used ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {row.tenants_users_limit ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              overTenant
                                ? "font-semibold text-red-600"
                                : "text-slate-800"
                            }
                          >
                            {row.tenant_users_used ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {fmtDate(row.active_date)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {fmtDate(row.renewal_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              row.is_active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {row.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(row)}
                              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isEditing ? (
                        <tr>
                          <td colSpan={13} className="bg-slate-50 px-4 py-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-lg font-bold text-slate-900">
                                    Edit Subscription — User {row.user_id}
                                  </div>
                                  <div className="text-sm text-slate-600">
                                    {row.name || "Unknown user"} • {row.email || "No email"}
                                  </div>
                                </div>

                                <div className="text-xs text-slate-500">
                                  Dates are synced from Stripe billing
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <div>
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Plan
                                  </label>
                                  <select
                                    value={form.plan_key}
                                    onChange={(e) =>
                                      setForm((prev) => ({
                                        ...prev,
                                        plan_key: e.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                                  >
                                    {PLAN_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Device Limit
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={form.device_limit}
                                    onChange={(e) =>
                                      setForm((prev) => ({
                                        ...prev,
                                        device_limit: e.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tenant Users Limit
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={form.tenants_users_limit}
                                    onChange={(e) =>
                                      setForm((prev) => ({
                                        ...prev,
                                        tenants_users_limit: e.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Active Date
                                  </label>
                                  <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                                    {fmtDate(row.active_date)}
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    Read-only. This date is managed by Stripe/backend sync.
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Renewal Date
                                  </label>
                                  <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                                    {fmtDate(row.renewal_date)}
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    Read-only. Changing this in CoreFlex does not trigger Stripe billing.
                                  </div>
                                </div>

                                <div className="flex items-end">
                                  <label className="flex w-full items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700">
                                    <input
                                      type="checkbox"
                                      checked={!!form.is_active}
                                      onChange={(e) =>
                                        setForm((prev) => ({
                                          ...prev,
                                          is_active: e.target.checked,
                                        }))
                                      }
                                      className="h-4 w-4"
                                    />
                                    Active Subscription
                                  </label>
                                </div>
                              </div>

                              <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                                <button
                                  onClick={cancelEdit}
                                  disabled={saving}
                                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
                                >
                                  Cancel
                                </button>

                                <button
                                  onClick={() => saveEdit(row.user_id)}
                                  disabled={saving}
                                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                                >
                                  {saving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}