// src/components/homepagesections/BillingAdminSection.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function safeText(value, fallback = "—") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

function formatMoney(value, currency = "usd") {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: String(currency || "usd").toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

function syncBadgeClass(row) {
  const hasProduct = !!String(row?.stripe_product_id || "").trim();
  const hasPrice = !!String(row?.stripe_price_id || "").trim();
  if (hasProduct && hasPrice) {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border border-amber-200 bg-amber-50 text-amber-700";
}

function syncBadgeText(row) {
  const hasProduct = !!String(row?.stripe_product_id || "").trim();
  const hasPrice = !!String(row?.stripe_price_id || "").trim();
  return hasProduct && hasPrice ? "Synced" : "Not Synced";
}

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  if (!token) {
    throw new Error("Missing authentication token.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function filterByBillingMode(rows, billingMode) {
  const target = billingMode === "one_time" ? "one_time" : "monthly";
  return (Array.isArray(rows) ? rows : []).filter(
    (row) => String(row?.billing_type || "").trim().toLowerCase() === target
  );
}

function BillingModeToggle({ billingMode, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-[2px]">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
          billingMode === "monthly"
            ? "bg-emerald-600 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        Monthly
      </button>

      <button
        type="button"
        onClick={() => onChange("one_time")}
        className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
          billingMode === "one_time"
            ? "bg-emerald-600 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        One-Time
      </button>
    </div>
  );
}

function BillingPlansTable({
  rows,
  loading,
  syncingAll,
  syncingPlanIds,
  onSyncPlan,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Loading billing plans...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        No billing plans found for this billing type.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Plan
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Billing
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Price
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Device Limit
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Tenant-Users
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                History Days
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Stripe
              </th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              const isSyncing = syncingPlanIds.has(row.id);
              return (
                <tr
                  key={`${row.id}-${row.plan_key}-${row.billing_type}`}
                  className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                >
                  <td className="px-3 py-3 align-top">
                    <div className="font-semibold text-slate-900">
                      {safeText(row.plan_name, row.plan_key)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      key: {safeText(row.plan_key)}
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top text-slate-700">
                    {row.billing_type === "one_time" ? "One-Time" : "Monthly"}
                  </td>

                  <td className="px-3 py-3 align-top text-slate-700">
                    {formatMoney(row.price_usd, row.currency)}
                  </td>

                  <td className="px-3 py-3 align-top text-slate-700">
                    {row.device_limit ?? "—"}
                  </td>

                  <td className="px-3 py-3 align-top text-slate-700">
                    {row.tenant_user_limit ?? "—"}
                  </td>

                  <td className="px-3 py-3 align-top text-slate-700">
                    {row.data_history_days ?? "—"}
                  </td>

                  <td className="px-3 py-3 align-top">
                    <div
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${syncBadgeClass(
                        row
                      )}`}
                    >
                      {syncBadgeText(row)}
                    </div>
                    <div className="mt-1 text-[10px] leading-5 text-slate-500">
                      Product: {safeText(row.stripe_product_id)}
                      <br />
                      Price: {safeText(row.stripe_price_id)}
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top text-right">
                    <button
                      type="button"
                      onClick={() => onSyncPlan(row.id)}
                      disabled={syncingAll || isSyncing}
                      className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                        syncingAll || isSyncing
                          ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {isSyncing ? "Syncing..." : "Sync Plan"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillingAddonsTable({
  rows,
  loading,
  syncingAll,
  syncingAddonIds,
  onSyncAddon,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Loading billing add-ons...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        No billing add-ons found for this billing type.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-[14px] font-semibold text-slate-900">
          Billing Add-ons
        </div>
        <div className="text-[12px] text-slate-500">
          Review additional tenant-user pricing and Stripe sync status.
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Add-on
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Billing
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Price
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Stripe
              </th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              const isSyncing = syncingAddonIds.has(row.id);
              return (
                <tr
                  key={`${row.id}-${row.addon_key}-${row.billing_type}`}
                  className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                >
                  <td className="px-3 py-3 align-top">
                    <div className="font-semibold text-slate-900">
                      {safeText(row.addon_key)}
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top text-slate-700">
                    {row.billing_type === "one_time" ? "One-Time" : "Monthly"}
                  </td>

                  <td className="px-3 py-3 align-top text-slate-700">
                    {formatMoney(row.price_usd, row.currency)}
                  </td>

                  <td className="px-3 py-3 align-top">
                    <div
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${syncBadgeClass(
                        row
                      )}`}
                    >
                      {syncBadgeText(row)}
                    </div>
                    <div className="mt-1 text-[10px] leading-5 text-slate-500">
                      Product: {safeText(row.stripe_product_id)}
                      <br />
                      Price: {safeText(row.stripe_price_id)}
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top text-right">
                    <button
                      type="button"
                      onClick={() => onSyncAddon(row.id)}
                      disabled={syncingAll || isSyncing}
                      className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                        syncingAll || isSyncing
                          ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                          : "bg-cyan-600 text-white hover:bg-cyan-700"
                      }`}
                    >
                      {isSyncing ? "Syncing..." : "Sync Add-on"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BillingAdminSection({ onBack, ownerEmail = "" }) {
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingAddons, setLoadingAddons] = useState(true);
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingPlanIds, setSyncingPlanIds] = useState(() => new Set());
  const [syncingAddonIds, setSyncingAddonIds] = useState(() => new Set());
  const [billingMode, setBillingMode] = useState("monthly");

  const filteredPlans = useMemo(
    () => filterByBillingMode(plans, billingMode),
    [plans, billingMode]
  );

  const filteredAddons = useMemo(
    () => filterByBillingMode(addons, billingMode),
    [addons, billingMode]
  );

  const totalPlans = filteredPlans.length;
  const totalAddons = filteredAddons.length;

  const syncedPlansCount = useMemo(() => {
    return filteredPlans.filter(
      (row) =>
        String(row?.stripe_product_id || "").trim() &&
        String(row?.stripe_price_id || "").trim()
    ).length;
  }, [filteredPlans]);

  const syncedAddonsCount = useMemo(() => {
    return filteredAddons.filter(
      (row) =>
        String(row?.stripe_product_id || "").trim() &&
        String(row?.stripe_price_id || "").trim()
    ).length;
  }, [filteredAddons]);

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const response = await fetch(`${API_URL}/admin/billing/plans`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to load billing plans.");
      }

      setPlans(Array.isArray(data) ? data : []);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  const loadAddons = useCallback(async () => {
    setLoadingAddons(true);
    try {
      const response = await fetch(`${API_URL}/admin/billing/addons`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to load billing add-ons.");
      }

      setAddons(Array.isArray(data) ? data : []);
    } finally {
      setLoadingAddons(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setPageError("");
    try {
      await Promise.all([loadPlans(), loadAddons()]);
    } catch (err) {
      console.error("Billing admin load failed:", err);
      setPageError(err?.message || "Unable to load billing admin data.");
    }
  }, [loadPlans, loadAddons]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleSyncAll = useCallback(async () => {
    setSyncingAll(true);
    setPageError("");
    setPageMessage("");

    try {
      const response = await fetch(`${API_URL}/admin/billing/sync-all`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to sync all billing items.");
      }

      setPageMessage(
        data?.message || "All active billing plans and addons synced to Stripe."
      );
      await refreshAll();
    } catch (err) {
      console.error("Sync all failed:", err);
      setPageError(err?.message || "Unable to sync all billing items.");
    } finally {
      setSyncingAll(false);
    }
  }, [refreshAll]);

  const handleSyncPlan = useCallback(
    async (planId) => {
      setPageError("");
      setPageMessage("");
      setSyncingPlanIds((prev) => new Set(prev).add(planId));

      try {
        const response = await fetch(
          `${API_URL}/admin/billing/plans/${planId}/sync-to-stripe`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to sync billing plan.");
        }

        setPageMessage(
          data?.message || `Billing plan ${planId} synced to Stripe successfully.`
        );
        await refreshAll();
      } catch (err) {
        console.error("Sync plan failed:", err);
        setPageError(err?.message || "Unable to sync billing plan.");
      } finally {
        setSyncingPlanIds((prev) => {
          const next = new Set(prev);
          next.delete(planId);
          return next;
        });
      }
    },
    [refreshAll]
  );

  const handleSyncAddon = useCallback(
    async (addonId) => {
      setPageError("");
      setPageMessage("");
      setSyncingAddonIds((prev) => new Set(prev).add(addonId));

      try {
        const response = await fetch(
          `${API_URL}/admin/billing/addons/${addonId}/sync-to-stripe`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to sync billing add-on.");
        }

        setPageMessage(
          data?.message || `Billing add-on ${addonId} synced to Stripe successfully.`
        );
        await refreshAll();
      } catch (err) {
        console.error("Sync addon failed:", err);
        setPageError(err?.message || "Unable to sync billing add-on.");
      } finally {
        setSyncingAddonIds((prev) => {
          const next = new Set(prev);
          next.delete(addonId);
          return next;
        });
      }
    },
    [refreshAll]
  );

  return (
    <div className="mt-4 md:mt-6">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-[12px]"
            >
              ← Back
            </button>

            <div>
              <div className="text-[15px] font-semibold leading-tight">
                Billing Admin
              </div>
              <div className="text-[11px] text-slate-300 leading-tight">
                Owner-only billing management for plans, add-ons, and Stripe sync.
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300">
            Owner: {ownerEmail || "unknown"}
          </div>
        </div>

        <div className="p-4 md:p-5">
          {(pageError || pageMessage) && (
            <div
              className={`mb-4 rounded-lg px-3 py-2 text-[12px] ${
                pageError
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {pageError || pageMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-[11px] text-slate-500">Plans</div>
              <div className="mt-0.5 text-[18px] font-bold leading-tight text-slate-900">
                {totalPlans}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-600">
                {syncedPlansCount} synced to Stripe
              </div>
            </div>

            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
              <div className="text-[11px] text-slate-500">Add-ons</div>
              <div className="mt-0.5 text-[18px] font-bold leading-tight text-slate-900">
                {totalAddons}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-600">
                {syncedAddonsCount} synced to Stripe
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-[11px] text-slate-500">Sync Status</div>
              <div className="mt-0.5 text-[18px] font-bold leading-tight text-slate-900">
                {syncedPlansCount + syncedAddonsCount}/
                {totalPlans + totalAddons}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-600">
                total synced billing items
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-500">Stripe Actions</div>
                <div className="mt-0.5 text-[12px] font-semibold leading-tight text-slate-900">
                  Sync all active items
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncAll}
                disabled={syncingAll}
                className={`mt-3 rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                  syncingAll
                    ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
              >
                {syncingAll ? "Syncing All..." : "Sync All to Stripe"}
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[14px] font-semibold text-slate-900">
                  Billing Type View
                </div>
                <div className="text-[12px] text-slate-500">
                  Switch between monthly and one-time billing records.
                </div>
              </div>

              <BillingModeToggle
                billingMode={billingMode}
                onChange={setBillingMode}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5">
            <BillingPlansTable
              rows={filteredPlans}
              loading={loadingPlans}
              syncingAll={syncingAll}
              syncingPlanIds={syncingPlanIds}
              onSyncPlan={handleSyncPlan}
            />

            <BillingAddonsTable
              rows={filteredAddons}
              loading={loadingAddons}
              syncingAll={syncingAll}
              syncingAddonIds={syncingAddonIds}
              onSyncAddon={handleSyncAddon}
            />
          </div>
        </div>
      </div>
    </div>
  );
}