import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import SubscriptionAgreementGate from "./SubscriptionAgreementGate";
import {
  formatMoney,
  getDisplayPrice,
  getPlanActionLabel,
  useMySubscriptionSection,
} from "./useMySubscriptionSection";

function formatDisplayDate(value) {
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

function SmallMessageModal({ open, type = "info", title, message, onClose }) {
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

function ConfirmPopoutModal({
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

function ActionPlanCard({
  plan,
  isCurrent,
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
  const actionLabel = getPlanActionLabel(plan.key, currentPlanKey);
  const displayPrice = getDisplayPrice(plan, billingMode);

  return (
    <div
      className={`rounded-xl border bg-white px-3 py-3 shadow-sm transition flex flex-col ${
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-200"
          : isCurrent
            ? "border-emerald-300"
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

          {isCurrent && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-emerald-800">
              Current
            </span>
          )}

          {isCurrent && cancellationScheduled && (
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
      </div>

      <div className="mt-3 space-y-1.5 text-[12px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Device Limit</span>
          <span className="font-semibold text-slate-900 text-right">
            {typeof plan.deviceLimit === "number"
              ? `${plan.deviceLimit} ${plan.deviceLimit === 1 ? "device" : "devices"}`
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
        {isCurrent ? (
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
        ) : (
          <button
            onClick={() => onSelect(plan)}
            disabled={isCurrent}
            className={`w-full rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
              isSelected
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function ComparePlansModal({ open, onClose, plans }) {
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

function PaymentSuccessModal({ open, onClose }) {
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

export default function MySubscriptionSection({ onBack }) {
  const {
    showComparePlans,
    setShowComparePlans,
    billingMode,
    selectedPlanKey,
    addonTenantUsersQty,
    checkoutLoading,
    checkoutMessage,
    subscription,
    loadingSubscription,
    subscriptionError,
    paymentBreakdown,
    plans,
    tenantUserAddonPrice,
    currentPlanKey,
    currentPlan,
    effectivePlan,
    isCurrentPlanSelection,
    chargeablePlanPrice,
    addonSubtotal,
    currentPlanStatus,
    currentPlanRenewal,
    currentPlanDevicesUsed,
    currentPlanTenantUsersUsed,
    displayTax,
    displayTotal,
    showAddon,
    openProceedToPayment,
    selectPlan,
    changeBillingMode,
    changeAddonTenantUsersQty,
    cancelSelection,
  } = useMySubscriptionSection();

  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);

  const [messageModal, setMessageModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    reloadOnClose: false,
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    mode: "",
    title: "",
    message: "",
    confirmText: "OK",
    tone: "emerald",
  });

  const cancellationScheduled = Boolean(subscription?.cancel_at_period_end);

  const isTenantUsersOnlyCheckout = useMemo(() => {
    return (
      Boolean(isCurrentPlanSelection) &&
      Number(addonTenantUsersQty || 0) > 0 &&
      Number(addonSubtotal || 0) > 0 &&
      Number(chargeablePlanPrice || 0) <= 0 &&
      effectivePlan?.key === currentPlanKey
    );
  }, [
    isCurrentPlanSelection,
    addonTenantUsersQty,
    addonSubtotal,
    chargeablePlanPrice,
    effectivePlan?.key,
    currentPlanKey,
  ]);

  const canceledOnDisplay = useMemo(
    () => formatDisplayDate(subscription?.updated_at),
    [subscription?.updated_at]
  );

  const benefitsExpireDisplay = useMemo(
    () => formatDisplayDate(subscription?.renewal_date || currentPlanRenewal),
    [subscription?.renewal_date, currentPlanRenewal]
  );

  const showMessage = ({ type = "info", title, message, reloadOnClose = false }) => {
    setMessageModal({
      open: true,
      type,
      title,
      message,
      reloadOnClose,
    });
  };

  const closeMessageModal = () => {
    const shouldReload = messageModal.reloadOnClose;

    setMessageModal({
      open: false,
      type: "info",
      title: "",
      message: "",
      reloadOnClose: false,
    });

    if (shouldReload) {
      window.location.reload();
    }
  };

  const handleSelectPlan = (plan) => {
    if (cancellationScheduled && plan?.key !== currentPlanKey) {
      showMessage({
        type: "warning",
        title: "Reactivate Required",
        message:
          "Your subscription is scheduled for cancellation. Please reactivate your current plan before changing to another plan.",
      });
      return;
    }

    selectPlan(plan);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = String(params.get("session_id") || "").trim();
    const paymentFlag = String(params.get("payment") || "").trim().toLowerCase();

    if (!sessionId || paymentFlag !== "success") return;

    const token = String(getToken() || "").trim();
    if (!token) return;

    const applyKey = `coreflex_applied_checkout_${sessionId}`;
    if (sessionStorage.getItem(applyKey) === "done") {
      return;
    }

    let cancelled = false;

    const applyCheckoutSession = async () => {
      try {
        const res = await fetch(
          `${API_URL}/billing/checkout-session/${encodeURIComponent(sessionId)}/apply`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("❌ Failed to apply checkout session:", data);
          return;
        }

        if (cancelled) return;

        console.log("✅ Checkout session applied:", data);
        sessionStorage.setItem(applyKey, "done");

        const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
        window.history.replaceState({}, "", cleanUrl);
        setShowPaymentSuccessModal(true);
      } catch (err) {
        console.error("❌ Error applying checkout session:", err);
      }
    };

    applyCheckoutSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClosePaymentSuccessModal = () => {
    setShowPaymentSuccessModal(false);
    window.location.reload();
  };

  const handleCancelSubscription = () => {
    setConfirmModal({
      open: true,
      mode: "cancel",
      title: "Cancel Subscription?",
      message:
        "Your subscription will stay active until the end of the current billing period.",
      confirmText: "Schedule Cancel",
      tone: "danger",
    });
  };

  const handleReactivateSubscription = () => {
    setConfirmModal({
      open: true,
      mode: "reactivate",
      title: "Reactivate Subscription?",
      message: "Your subscription will continue renewing normally.",
      confirmText: "Reactivate",
      tone: "emerald",
    });
  };

  const closeConfirmModal = () => {
    if (cancelLoading || reactivateLoading) return;

    setConfirmModal({
      open: false,
      mode: "",
      title: "",
      message: "",
      confirmText: "OK",
      tone: "emerald",
    });
  };

  const executeCancelSubscription = async () => {
    try {
      setCancelLoading(true);

      const token = String(getToken() || "").trim();
      if (!token) {
        throw new Error("Missing authentication token.");
      }

      const response = await fetch(`${API_URL}/billing/cancel-subscription`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to cancel subscription.");
      }

      closeConfirmModal();

      showMessage({
        type: "success",
        title: "Cancellation Scheduled",
        message:
          data?.message ||
          "Your subscription is scheduled to cancel at the end of the current billing period.",
        reloadOnClose: true,
      });
    } catch (err) {
      console.error("❌ Cancel subscription failed:", err);
      closeConfirmModal();

      showMessage({
        type: "error",
        title: "Cancellation Failed",
        message: err?.message || "Failed to cancel subscription.",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const executeReactivateSubscription = async () => {
    try {
      setReactivateLoading(true);

      const token = String(getToken() || "").trim();
      if (!token) {
        throw new Error("Missing authentication token.");
      }

      const response = await fetch(`${API_URL}/billing/reactivate-subscription`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to reactivate subscription.");
      }

      closeConfirmModal();

      showMessage({
        type: "success",
        title: "Subscription Reactivated",
        message:
          data?.message ||
          "Subscription reactivated successfully. Your plan will continue normally.",
        reloadOnClose: true,
      });
    } catch (err) {
      console.error("❌ Reactivate subscription failed:", err);
      closeConfirmModal();

      showMessage({
        type: "error",
        title: "Reactivation Failed",
        message: err?.message || "Failed to reactivate subscription.",
      });
    } finally {
      setReactivateLoading(false);
    }
  };

  const handleConfirmAction = () => {
    if (confirmModal.mode === "cancel") {
      executeCancelSubscription();
      return;
    }

    if (confirmModal.mode === "reactivate") {
      executeReactivateSubscription();
    }
  };

  return (
    <>
      <PaymentSuccessModal
        open={showPaymentSuccessModal}
        onClose={handleClosePaymentSuccessModal}
      />

      <SmallMessageModal
        open={messageModal.open}
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
        onClose={closeMessageModal}
      />

      <ConfirmPopoutModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        tone={confirmModal.tone}
        loading={cancelLoading || reactivateLoading}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmModal}
      />

      <div
        className="rounded-xl border border-slate-200 bg-white overflow-hidden"
        style={{ marginTop: "-18px" }}
      >
        <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[12px]"
            >
              ← Back
            </button>

            <div>
              <div className="text-[15px] font-semibold leading-tight">
                My Subscription
              </div>
              <div className="text-[11px] text-emerald-100 leading-tight">
                View subscription plans, billing details, and platform limits.
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3 pt-1.5">
          {cancellationScheduled && (
            <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2">
              <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
                <span className="text-[13px] font-semibold text-amber-900">
                  Subscription cancellation scheduled:
                </span>

                <span className="text-[12px] text-amber-800">
                  Benefits expire on {benefitsExpireDisplay}.
                </span>

                <span className="text-[11px] text-amber-700">
                  Canceled on {canceledOnDisplay}.
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[10px] text-slate-500">Plan</div>
              <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : currentPlan.name}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[10px] text-slate-500">Status</div>
              <div
                className={`mt-0.5 text-[13px] font-semibold ${
                  cancellationScheduled ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {loadingSubscription
                  ? "Loading..."
                  : cancellationScheduled
                    ? "Canceled"
                    : currentPlanStatus}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[10px] text-slate-500">
                {cancellationScheduled ? "Benefits Expire" : "Renewal"}
              </div>
              <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
                {loadingSubscription
                  ? "Loading..."
                  : cancellationScheduled
                    ? benefitsExpireDisplay
                    : currentPlanRenewal}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[10px] text-slate-500">Devices Used</div>
              <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : currentPlanDevicesUsed}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[10px] text-slate-500">Tenants-Users</div>
              <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : currentPlanTenantUsersUsed}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-900 px-3 py-2">
              <div className="flex flex-col gap-1.5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-[13px] font-semibold leading-tight text-white">
                    Choose a Plan
                  </div>
                  <div className="mt-0.5 text-[10px] leading-tight text-slate-300">
                    Select a plan and billing type to continue to secure checkout.
                  </div>
                </div>

                <div className="inline-flex rounded-md border border-slate-300 bg-white p-[2px] self-start">
                  <button
                    onClick={() => changeBillingMode("monthly")}
                    className={`rounded-sm px-2 py-1 text-[10px] font-semibold leading-none transition ${
                      billingMode === "monthly"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => changeBillingMode("one_time")}
                    className={`rounded-sm px-2 py-1 text-[10px] font-semibold leading-none transition ${
                      billingMode === "one_time"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    One-Time License
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              {plans.map((plan) => (
                <ActionPlanCard
                  key={plan.key}
                  plan={plan}
                  isCurrent={plan.key === currentPlanKey}
                  billingMode={billingMode}
                  onSelect={handleSelectPlan}
                  isSelected={selectedPlanKey === plan.key}
                  currentPlanKey={currentPlanKey}
                  onCancelSubscription={handleCancelSubscription}
                  onReactivateSubscription={handleReactivateSubscription}
                  cancelLoading={cancelLoading}
                  reactivateLoading={reactivateLoading}
                  cancellationScheduled={cancellationScheduled}
                />
              ))}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-3 py-3">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <div className="xl:col-span-2 rounded-xl border border-emerald-200 bg-white p-3">
                  <div>
                    <div className="text-[15px] font-bold text-slate-900">
                      Purchase Additional Tenant-Users
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-slate-500">
                      Add more tenant-user seats to your current subscription.
                    </div>
                  </div>

                  {showAddon && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-[12px] font-semibold text-slate-900">
                            Additional Tenant-User
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            Select how many additional tenant-user slots you want
                            to purchase.
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-[12px] font-semibold text-slate-900">
                            {formatMoney(tenantUserAddonPrice)}
                          </div>

                          <select
                            value={addonTenantUsersQty}
                            onChange={(e) =>
                              changeAddonTenantUsersQty(Number(e.target.value || 0))
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[12px] text-slate-900 outline-none focus:border-emerald-500"
                          >
                            {[0, 1, 2, 3, 4, 5].map((qty) => (
                              <option key={qty} value={qty}>
                                {qty}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[13px] font-semibold text-slate-900">
                    Order Summary
                  </div>

                  <div className="mt-3 space-y-2 text-[12px]">
                    {effectivePlan ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">
                          {effectivePlan.name}{" "}
                          {billingMode === "monthly" ? "(Monthly)" : "(One-Time)"}
                          {isCurrentPlanSelection ? " - Current Plan" : ""}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {effectivePlan.key === "enterprise"
                            ? "Custom"
                            : formatMoney(chargeablePlanPrice || 0)}
                        </span>
                      </div>
                    ) : null}

                    {addonTenantUsersQty > 0 && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">
                          Additional Tenant-User × {addonTenantUsersQty}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatMoney(addonSubtotal)}
                        </span>
                      </div>
                    )}

                    {displayTax > 0 && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">
                          {paymentBreakdown.taxLabel ||
                            `Tax${
                              paymentBreakdown.taxRatePercent
                                ? ` (${paymentBreakdown.taxRatePercent}%)`
                                : ""
                            }`}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatMoney(displayTax)}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between gap-3">
                      <span className="text-slate-900 font-semibold">Total</span>
                      <span className="text-[16px] font-bold text-slate-900">
                        {effectivePlan?.key === "enterprise"
                          ? "Custom Quote"
                          : formatMoney(displayTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-3 py-2 text-[12px] font-semibold"
                      onClick={cancelSelection}
                    >
                      Cancel
                    </button>

                    <SubscriptionAgreementGate
                      effectivePlan={effectivePlan}
                      selectedPlanKey={selectedPlanKey}
                      currentPlanKey={currentPlanKey}
                      billingMode={billingMode}
                      checkoutLoading={checkoutLoading}
                      reactivateLoading={reactivateLoading}
                      cancellationScheduled={cancellationScheduled}
                      isTenantUsersOnlyCheckout={isTenantUsersOnlyCheckout}
                      openProceedToPayment={openProceedToPayment}
                      showMessage={showMessage}
                    />

                    {checkoutMessage && (
                      <div className="text-[10px] leading-snug text-slate-500">
                        {checkoutMessage}
                      </div>
                    )}

                    {subscriptionError && (
                      <div className="text-[10px] leading-snug text-red-600">
                        {subscriptionError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => setShowComparePlans(true)}
                  className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-4 py-1.5 text-[12px] font-semibold shadow-sm"
                >
                  Compare Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ComparePlansModal
        open={showComparePlans}
        onClose={() => setShowComparePlans(false)}
        plans={plans}
      />
    </>
  );
}