import React from "react";
import {
  formatMoney,
  getDisplayPrice,
  getPlanActionLabel,
} from "./useMySubscriptionSection";

export function formatDisplayDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (err) {
    return "—";
  }
}

export function normalizeAgreementRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.agreements)) return data.agreements;
  if (Array.isArray(data?.acceptances)) return data.acceptances;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

export function SmallMessageModal({
  open,
  type = "info",
  title,
  message,
  onClose,
}) {
  if (!open) return null;

  const isSuccess = type === "success";
  const isError = type === "error";
  const isWarning = type === "warning";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/45 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold ${
              isSuccess
                ? "bg-emerald-100 text-emerald-700"
                : isError
                  ? "bg-red-100 text-red-700"
                  : isWarning
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-700"
            }`}
          >
            {isSuccess ? "✓" : isError ? "!" : isWarning ? "!" : "i"}
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="text-[18px] font-semibold text-slate-900">
            {title}
          </div>
          <div className="mt-1 text-[13px] leading-relaxed text-slate-600">
            {message}
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className={`w-full rounded-lg px-3 py-2 text-[13px] font-semibold text-white ${
              isError
                ? "bg-red-600 hover:bg-red-700"
                : isWarning
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmPopoutModal({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  loading = false,
  tone = "emerald",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDanger = tone === "danger";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/45 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="text-center">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold ${
              isDanger
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            ?
          </div>

          <div className="mt-4 text-[18px] font-semibold text-slate-900">
            {title}
          </div>

          <div className="mt-2 text-[13px] leading-relaxed text-slate-600">
            {message}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-3 py-2 text-[13px] font-semibold text-white disabled:cursor-wait ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400"
            }`}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActionPlanCard({
  plan,
  isCurrent,
  isOneTimePaid,
  isOneTimeDowngradeBlocked = false,
  oneTimePaidDate,
  billingMode,
  onSelect,
  isSelected,
  currentPlanKey,
  onCancelSubscription,
  onReactivateSubscription,
  cancelLoading,
  reactivateLoading,
  cancellationScheduled,
}) {
  const isEnterprise = plan?.key === "enterprise";
  const actionLabel = getPlanActionLabel(plan.key, currentPlanKey);
  const displayPrice = getDisplayPrice(plan, billingMode);
  const paidDateDisplay = formatDisplayDate(oneTimePaidDate);

  const showPaidBadge = Boolean(isOneTimePaid);
  const showCurrentBadge = Boolean(isCurrent) && !showPaidBadge;

  return (
    <div
      className={`rounded-xl border bg-white px-3 py-3 shadow-sm transition flex flex-col ${
        isSelected &&
        !isEnterprise &&
        !showPaidBadge &&
        !isOneTimeDowngradeBlocked
          ? "border-emerald-500 ring-2 ring-emerald-200"
          : showCurrentBadge || showPaidBadge
            ? "border-emerald-300"
            : isOneTimeDowngradeBlocked
              ? "border-slate-200 opacity-80"
              : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight text-slate-900">
            {plan.name}
          </div>
          <div className="mt-1 text-[11px] leading-snug text-slate-500">
            {plan.shortFeature}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {plan.badge && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-amber-800">
              {plan.badge}
            </span>
          )}

          {showCurrentBadge && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-emerald-800">
              Current
            </span>
          )}

          {showPaidBadge && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-emerald-800">
              Paid
            </span>
          )}

          {isOneTimeDowngradeBlocked && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-slate-600">
              Locked
            </span>
          )}

          {showCurrentBadge && cancellationScheduled && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-amber-800">
              Canceled
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">
          {billingMode === "monthly" ? "Monthly Price" : "One-Time License"}
        </div>
        <div className="mt-1 text-[18px] font-bold leading-tight text-slate-900">
          {displayPrice}
        </div>

        {showPaidBadge && (
          <div className="mt-1 text-[11px] font-semibold text-emerald-700">
            Paid on {paidDateDisplay}
          </div>
        )}

        {isOneTimeDowngradeBlocked && (
          <div className="mt-1 text-[11px] font-semibold text-slate-500">
            Downgrade unavailable after one-time purchase
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5 text-[12px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Device Limit</span>
          <span className="font-semibold text-slate-900 text-right">
            {typeof plan.deviceLimit === "number"
              ? `${plan.deviceLimit} ${
                  plan.deviceLimit === 1 ? "device" : "devices"
                }`
              : plan.deviceLimit}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Tenants-Users</span>
          <span className="font-semibold text-slate-900">
            +{plan.tenantsUsers}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Data History</span>
          <span className="font-semibold text-slate-900 text-right">
            {plan.dataHistory}
          </span>
        </div>
      </div>

      <div className="mt-4">
        {showCurrentBadge ? (
          <div className="flex gap-2">
            <button
              onClick={cancellationScheduled ? onReactivateSubscription : undefined}
              disabled={
                reactivateLoading || cancelLoading ? true : !cancellationScheduled
              }
              className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
                cancellationScheduled
                  ? reactivateLoading
                    ? "bg-emerald-400 text-white cursor-wait"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
              }`}
            >
              {cancellationScheduled
                ? reactivateLoading
                  ? "Reactivating..."
                  : "Reactivate Plan"
                : actionLabel}
            </button>

            <button
              onClick={onCancelSubscription}
              disabled={cancelLoading || reactivateLoading || cancellationScheduled}
              className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
                cancellationScheduled
                  ? "bg-amber-100 text-amber-800 border border-amber-300 cursor-default"
                  : cancelLoading
                    ? "bg-red-400 text-white cursor-wait"
                    : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {cancellationScheduled
                ? "Cancellation Scheduled"
                : cancelLoading
                  ? "Cancelling..."
                  : "Cancel any time"}
            </button>
          </div>
        ) : showPaidBadge ? (
          <button
            disabled
            className="w-full rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-[12px] font-semibold text-emerald-800 cursor-default"
          >
            Paid • {paidDateDisplay}
          </button>
        ) : isOneTimeDowngradeBlocked ? (
          <button
            disabled
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-500 cursor-not-allowed"
          >
            Downgrade Locked
          </button>
        ) : (
          <button
            onClick={isEnterprise ? undefined : () => onSelect(plan)}
            disabled={isEnterprise}
            className={`w-full rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
              isEnterprise
                ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                : isSelected
                  ? "bg-emerald-700 text-white hover:bg-emerald-800"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isEnterprise ? "Contact Sales" : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function ComparePlansModal({ open, onClose, plans }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 px-4">
      <div className="w-full max-w-7xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div>
            <div className="text-lg font-semibold">Compare Plans</div>
            <div className="text-xs text-slate-300">
              Review plan limits, pricing, and support details.
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm font-semibold hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
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
                  Tenants-Users
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Data History
                </th>
                <th className="px-4 py-3 text-left font-semibold">Features</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Annual Updates &amp; Support
                </th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, idx) => (
                <tr
                  key={plan.key}
                  className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  <td className="px-4 py-4 font-semibold">{plan.name}</td>
                  <td className="px-4 py-4">
                    {plan.key === "enterprise"
                      ? "$900+ / month"
                      : formatMoney(plan.monthlyPrice, " / month")}
                  </td>
                  <td className="px-4 py-4">
                    {plan.key === "enterprise"
                      ? "Custom Quote"
                      : plan.oneTimeLicense === null
                        ? "N/A"
                        : formatMoney(plan.oneTimeLicense)}
                  </td>
                  <td className="px-4 py-4 font-semibold">
                    {typeof plan.deviceLimit === "number"
                      ? `${plan.deviceLimit} ${
                          plan.deviceLimit === 1 ? "device" : "devices"
                        }`
                      : plan.deviceLimit}
                  </td>
                  <td className="px-4 py-4">+{plan.tenantsUsers}</td>
                  <td className="px-4 py-4">{plan.dataHistory}</td>
                  <td className="px-4 py-4">{plan.features}</td>
                  <td className="px-4 py-4">
                    {plan.annualSupport === null
                      ? "N/A"
                      : formatMoney(plan.annualSupport, " / year")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function PaymentSuccessModal({ open, onClose }) {
  if (!open) return null;

  return (
    <SmallMessageModal
      open={open}
      type="success"
      title="Payment Successful"
      message="Your subscription is being updated now."
      onClose={onClose}
    />
  );
}