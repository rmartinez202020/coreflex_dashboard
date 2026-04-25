import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import SubscriptionAgreementGate from "./SubscriptionAgreementGate";
import {
  formatMoney,
  useMySubscriptionSection,
} from "./useMySubscriptionSection";
import {
  ActionPlanCard,
  ComparePlansModal,
  ConfirmPopoutModal,
  formatDisplayDate,
  LoadingDataModal,
  normalizeAgreementRows,
  PaymentSuccessModal,
  SmallMessageModal,
} from "./MySubscriptionSectionParts";

function addOneMonth(value) {
  if (!value) return null;

  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;

    const originalDay = d.getDate();
    d.setMonth(d.getMonth() + 1);

    if (d.getDate() !== originalDay) {
      d.setDate(0);
    }

    return d;
  } catch (err) {
    return null;
  }
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

  const [showInitialLoadingModal, setShowInitialLoadingModal] = useState(true);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [oneTimePaidPlanMap, setOneTimePaidPlanMap] = useState({});

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

  const paidOneTimePlanKeySet = useMemo(() => {
    return new Set(Object.keys(oneTimePaidPlanMap));
  }, [oneTimePaidPlanMap]);

  const paidOneTimePlan = useMemo(() => {
    if (!plans?.length || paidOneTimePlanKeySet.size <= 0) return null;

    const currentPaidPlan = plans.find((plan) =>
      paidOneTimePlanKeySet.has(String(plan?.key || "").toLowerCase())
    );

    return currentPaidPlan || null;
  }, [plans, paidOneTimePlanKeySet]);

  const paidOneTimePlanKey = String(paidOneTimePlan?.key || "").toLowerCase();
  const paidOneTimeDate = paidOneTimePlanKey
    ? oneTimePaidPlanMap[paidOneTimePlanKey]
    : null;

  const hasOneTimePaidPlan = Boolean(paidOneTimePlanKey);

  const paidOneTimePlanIndex = useMemo(() => {
    if (!hasOneTimePaidPlan || !plans?.length || !paidOneTimePlanKey) return -1;

    return plans.findIndex(
      (plan) => String(plan?.key || "").toLowerCase() === paidOneTimePlanKey
    );
  }, [hasOneTimePaidPlan, plans, paidOneTimePlanKey]);

  const cancellationScheduled =
    !hasOneTimePaidPlan && Boolean(subscription?.cancel_at_period_end);

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

  const bypassAgreementModal = useMemo(() => {
    return billingMode === "one_time" || isTenantUsersOnlyCheckout;
  }, [billingMode, isTenantUsersOnlyCheckout]);

  const hasCheckoutSelection = useMemo(() => {
    return (
      Boolean(selectedPlanKey && selectedPlanKey !== currentPlanKey) ||
      Number(addonTenantUsersQty || 0) > 0
    );
  }, [selectedPlanKey, currentPlanKey, addonTenantUsersQty]);

  const shouldShowPlanChargeLine = useMemo(() => {
    return Boolean(effectivePlan) && !isCurrentPlanSelection;
  }, [effectivePlan, isCurrentPlanSelection]);

  const displayedCurrentPlan = hasOneTimePaidPlan ? paidOneTimePlan : currentPlan;
  const displayedStatus = hasOneTimePaidPlan ? "Paid" : currentPlanStatus;
  const displayedRenewal = hasOneTimePaidPlan
    ? formatDisplayDate(paidOneTimeDate)
    : currentPlanRenewal;

  const displayedDevicesUsed = currentPlanDevicesUsed;
  const displayedTenantUsersUsed = currentPlanTenantUsersUsed;

  const canceledOnDisplay = useMemo(
    () => formatDisplayDate(subscription?.updated_at),
    [subscription?.updated_at]
  );

  const benefitsExpireDisplay = useMemo(() => {
    const renewalDate = subscription?.renewal_date || currentPlanRenewal;

    if (renewalDate) {
      return formatDisplayDate(renewalDate);
    }

    const activeDatePlusOneMonth = addOneMonth(subscription?.active_date);
    if (activeDatePlusOneMonth) {
      return formatDisplayDate(activeDatePlusOneMonth);
    }

    return "—";
  }, [
    subscription?.renewal_date,
    subscription?.active_date,
    currentPlanRenewal,
  ]);

  const showMessage = ({
    type = "info",
    title,
    message,
    reloadOnClose = false,
  }) => {
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
    const planKey = String(plan?.key || "").toLowerCase();

    if (planKey === "enterprise") {
      return;
    }

    if (paidOneTimePlanKeySet.has(planKey)) {
      return;
    }

    if (hasOneTimePaidPlan && paidOneTimePlanIndex >= 0) {
      const selectedPlanIndex = plans.findIndex(
        (item) => String(item?.key || "").toLowerCase() === planKey
      );

      if (selectedPlanIndex >= 0 && selectedPlanIndex < paidOneTimePlanIndex) {
        showMessage({
          type: "warning",
          title: "Downgrade Locked",
          message:
            "This account already has a paid one-time license. You can only upgrade to a higher plan.",
        });
        return;
      }
    }

    if (cancellationScheduled && planKey !== currentPlanKey) {
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
    const timer = window.setTimeout(() => {
      setShowInitialLoadingModal(false);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const token = String(getToken() || "").trim();
    if (!token) return;

    let cancelled = false;

    const loadOneTimePaidPlans = async () => {
      const urlsToTry = [
        `${API_URL}/subscription-agreements/me`,
        `${API_URL}/subscription-agreements/accepted`,
        `${API_URL}/subscription-agreements`,
      ];

      for (const url of urlsToTry) {
        try {
          const res = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) continue;

          const data = await res.json().catch(() => ({}));
          const rows = normalizeAgreementRows(data);

          const paidMap = {};

          rows.forEach((row) => {
            const billingType = String(row?.billing_type || row?.billingType || "")
              .trim()
              .toLowerCase();
            const confirmed = row?.confirmed;
            const planKey = String(row?.plan_key || row?.planKey || "")
              .trim()
              .toLowerCase();

            if (billingType !== "one_time" || confirmed === false || !planKey) {
              return;
            }

            const paidAt =
              row?.confirmed_at ||
              row?.confirmedAt ||
              row?.paid_at ||
              row?.paidAt ||
              row?.created_at ||
              row?.createdAt ||
              null;

            const oldTime = paidMap[planKey]
              ? new Date(paidMap[planKey]).getTime()
              : 0;
            const newTime = paidAt ? new Date(paidAt).getTime() : 0;

            if (!paidMap[planKey] || newTime >= oldTime) {
              paidMap[planKey] = paidAt;
            }
          });

          if (!cancelled) {
            setOneTimePaidPlanMap(paidMap);
          }

          return;
        } catch (err) {
          console.warn("Could not load one-time paid plan data:", err);
        }
      }
    };

    loadOneTimePaidPlans();

    return () => {
      cancelled = true;
    };
  }, []);

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
      <LoadingDataModal open={showInitialLoadingModal} />

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
                {loadingSubscription ? "Loading..." : displayedCurrentPlan.name}
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
                    : displayedStatus}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[10px] text-slate-500">
                {hasOneTimePaidPlan
                  ? "Paid On"
                  : cancellationScheduled
                    ? "Benefits Expire"
                    : "Renewal"}
              </div>
              <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
                {loadingSubscription
                  ? "Loading..."
                  : cancellationScheduled
                    ? benefitsExpireDisplay
                    : displayedRenewal}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[10px] text-slate-500">Devices Used</div>
              <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : displayedDevicesUsed}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[10px] text-slate-500">Tenants-Users</div>
              <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : displayedTenantUsersUsed}
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
              {plans.map((plan, planIndex) => {
                const planKey = String(plan.key || "").toLowerCase();
                const paidDate = oneTimePaidPlanMap[planKey] || null;
                const planIsOneTimePaid = paidOneTimePlanKeySet.has(planKey);

                const isOneTimeDowngradeBlocked =
                  hasOneTimePaidPlan &&
                  paidOneTimePlanIndex >= 0 &&
                  planIndex >= 0 &&
                  planIndex < paidOneTimePlanIndex;

                return (
                  <ActionPlanCard
                    key={plan.key}
                    plan={plan}
                    isCurrent={!planIsOneTimePaid && plan.key === currentPlanKey}
                    isOneTimePaid={planIsOneTimePaid}
                    isOneTimeDowngradeBlocked={isOneTimeDowngradeBlocked}
                    oneTimePaidDate={paidDate}
                    billingMode={billingMode}
                    onSelect={handleSelectPlan}
                    isSelected={
                      selectedPlanKey === plan.key &&
                      !planIsOneTimePaid &&
                      !isOneTimeDowngradeBlocked
                    }
                    currentPlanKey={currentPlanKey}
                    onCancelSubscription={handleCancelSubscription}
                    onReactivateSubscription={handleReactivateSubscription}
                    cancelLoading={cancelLoading}
                    reactivateLoading={reactivateLoading}
                    cancellationScheduled={cancellationScheduled}
                  />
                );
              })}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-3 py-3">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <div className="xl:col-span-2 rounded-xl border border-emerald-200 bg-white p-3">
                  <div>
                    <div className="text-[15px] font-bold text-slate-900">
                      Purchase Additional Tenant-Users
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-slate-500">
                      Add more tenant-user seats to your current account.
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
                            Select how many you want to purchase.
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
                    {shouldShowPlanChargeLine && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">
                          {effectivePlan.name}{" "}
                          {billingMode === "monthly" ? "(Monthly)" : "(One-Time)"}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {effectivePlan.key === "enterprise"
                            ? "Custom"
                            : formatMoney(chargeablePlanPrice || 0)}
                        </span>
                      </div>
                    )}

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
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold text-slate-900 hover:bg-slate-50"
                      onClick={cancelSelection}
                    >
                      Cancel
                    </button>

                    <div
                      className={`w-full ${
                        hasCheckoutSelection
                          ? "[&>button]:!w-full [&>button]:!bg-emerald-500 [&>button:hover]:!bg-emerald-600 [&>button]:!py-4 [&>button]:!text-[14px] [&>button]:!rounded-xl [&>button]:!shadow-md"
                          : "[&>button]:!w-full [&>button]:!bg-slate-300 [&>button]:!text-slate-600 [&>button]:!py-4 [&>button]:!text-[14px] [&>button]:!rounded-xl [&>button]:!cursor-not-allowed [&>button:hover]:!bg-slate-300"
                      }`}
                    >
                      <SubscriptionAgreementGate
                        effectivePlan={effectivePlan}
                        selectedPlanKey={selectedPlanKey}
                        currentPlanKey={currentPlanKey}
                        billingMode={billingMode}
                        checkoutLoading={checkoutLoading || !hasCheckoutSelection}
                        reactivateLoading={reactivateLoading}
                        cancellationScheduled={cancellationScheduled}
                        isTenantUsersOnlyCheckout={bypassAgreementModal}
                        openProceedToPayment={openProceedToPayment}
                        showMessage={showMessage}
                      />
                    </div>

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