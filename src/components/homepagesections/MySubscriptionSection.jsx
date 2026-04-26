import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import MySubscriptionSectionView from "./MySubscriptionSectionView";
import { useMySubscriptionSection } from "./useMySubscriptionSection";
import {
  formatDisplayDate,
  normalizeAgreementRows,
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

  const isAddonSelectionActive = Number(addonTenantUsersQty || 0) > 0;
  const isPlanSelectionActive = Boolean(selectedPlanKey);

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

  const hasActiveMonthlySubscription = useMemo(() => {
    const planKey = String(currentPlanKey || "").toLowerCase();
    const status = String(currentPlanStatus || subscription?.status || "")
      .trim()
      .toLowerCase();

    return (
      billingMode === "one_time" &&
      !hasOneTimePaidPlan &&
      !cancellationScheduled &&
      planKey !== "free" &&
      ["active", "paid", "trialing"].includes(status)
    );
  }, [
    billingMode,
    currentPlanKey,
    currentPlanStatus,
    subscription?.status,
    hasOneTimePaidPlan,
    cancellationScheduled,
  ]);

  const isTenantUsersOnlyCheckout = useMemo(() => {
    const effectiveKey = String(effectivePlan?.key || "").toLowerCase();
    const currentKey = String(currentPlanKey || "").toLowerCase();

    return (
      Boolean(isCurrentPlanSelection) &&
      Number(addonTenantUsersQty || 0) > 0 &&
      Number(addonSubtotal || 0) > 0 &&
      Number(chargeablePlanPrice || 0) <= 0 &&
      effectiveKey === currentKey
    );
  }, [
    isCurrentPlanSelection,
    addonTenantUsersQty,
    addonSubtotal,
    chargeablePlanPrice,
    effectivePlan?.key,
    currentPlanKey,
  ]);

  const checkoutBillingMode = billingMode;

  const bypassAgreementModal = useMemo(() => {
    return checkoutBillingMode === "one_time" || isTenantUsersOnlyCheckout;
  }, [checkoutBillingMode, isTenantUsersOnlyCheckout]);

  const hasCheckoutSelection = useMemo(() => {
    if (hasActiveMonthlySubscription) {
      return Number(addonTenantUsersQty || 0) > 0;
    }

    return (
      Boolean(
        selectedPlanKey &&
          (selectedPlanKey !== currentPlanKey ||
            checkoutBillingMode === "one_time")
      ) || Number(addonTenantUsersQty || 0) > 0
    );
  }, [
    hasActiveMonthlySubscription,
    selectedPlanKey,
    currentPlanKey,
    checkoutBillingMode,
    addonTenantUsersQty,
  ]);

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
    if (isAddonSelectionActive) {
      return;
    }

    const planKey = String(plan?.key || "").toLowerCase();

    if (planKey === "enterprise") {
      return;
    }

    if (hasActiveMonthlySubscription && planKey !== "free") {
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

    if (
      checkoutBillingMode !== "one_time" &&
      cancellationScheduled &&
      planKey !== currentPlanKey
    ) {
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

  const handleProceedToPayment = () => {
    const extraTenantUsers = Math.max(0, Number(addonTenantUsersQty || 0));

    const isAddonOnlyPurchase =
      extraTenantUsers > 0 && isTenantUsersOnlyCheckout;

    const planKey = String(
      isAddonOnlyPurchase
        ? currentPlanKey
        : effectivePlan?.key || selectedPlanKey || currentPlanKey || "free"
    )
      .trim()
      .toLowerCase();

    const payloadOverride = {
      planKey,

      // ✅ Tenant-user add-ons are NOT one-time plan purchases.
      // They must be processed as tenant_user_addon_only.
      billingType: isAddonOnlyPurchase ? "monthly" : checkoutBillingMode,

      // ✅ Backend expects this exact field name.
      extraTenantUsers,

      // ✅ Backend should use this to charge/add ONLY tenant-users.
      checkoutType: isAddonOnlyPurchase ? "tenant_user_addon_only" : "",

      effectivePlanKey: planKey,
      billingMode: isAddonOnlyPurchase ? "monthly" : checkoutBillingMode,

      isTenantUsersOnlyCheckout: isAddonOnlyPurchase,
    };

    console.log("✅ CHECKOUT PAYLOAD OVERRIDE:", payloadOverride);

    return openProceedToPayment(payloadOverride);
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

            if (
              billingType !== "one_time" ||
              confirmed === false ||
              !planKey ||
              planKey === "free"
            ) {
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
    <MySubscriptionSectionView
      onBack={onBack}
      showInitialLoadingModal={showInitialLoadingModal}
      showPaymentSuccessModal={showPaymentSuccessModal}
      handleClosePaymentSuccessModal={handleClosePaymentSuccessModal}
      messageModal={messageModal}
      closeMessageModal={closeMessageModal}
      confirmModal={confirmModal}
      handleConfirmAction={handleConfirmAction}
      closeConfirmModal={closeConfirmModal}
      showComparePlans={showComparePlans}
      setShowComparePlans={setShowComparePlans}
      billingMode={billingMode}
      selectedPlanKey={selectedPlanKey}
      addonTenantUsersQty={addonTenantUsersQty}
      checkoutLoading={checkoutLoading}
      checkoutMessage={checkoutMessage}
      paymentBreakdown={paymentBreakdown}
      plans={plans}
      tenantUserAddonPrice={tenantUserAddonPrice}
      currentPlanKey={currentPlanKey}
      effectivePlan={effectivePlan}
      chargeablePlanPrice={chargeablePlanPrice}
      addonSubtotal={addonSubtotal}
      displayTax={displayTax}
      displayTotal={displayTotal}
      showAddon={showAddon}
      changeBillingMode={changeBillingMode}
      changeAddonTenantUsersQty={changeAddonTenantUsersQty}
      cancelSelection={cancelSelection}
      loadingSubscription={loadingSubscription}
      displayedCurrentPlan={displayedCurrentPlan}
      displayedStatus={displayedStatus}
      displayedRenewal={displayedRenewal}
      displayedDevicesUsed={displayedDevicesUsed}
      displayedTenantUsersUsed={displayedTenantUsersUsed}
      cancellationScheduled={cancellationScheduled}
      benefitsExpireDisplay={benefitsExpireDisplay}
      canceledOnDisplay={canceledOnDisplay}
      isAddonSelectionActive={isAddonSelectionActive}
      isPlanSelectionActive={isPlanSelectionActive}
      oneTimePaidPlanMap={oneTimePaidPlanMap}
      paidOneTimePlanKeySet={paidOneTimePlanKeySet}
      paidOneTimePlanIndex={paidOneTimePlanIndex}
      hasOneTimePaidPlan={hasOneTimePaidPlan}
      hasActiveMonthlySubscription={hasActiveMonthlySubscription}
      checkoutBillingMode={checkoutBillingMode}
      hasCheckoutSelection={hasCheckoutSelection}
      shouldShowPlanChargeLine={shouldShowPlanChargeLine}
      bypassAgreementModal={bypassAgreementModal}
      handleSelectPlan={handleSelectPlan}
      handleCancelSubscription={handleCancelSubscription}
      handleReactivateSubscription={handleReactivateSubscription}
      handleProceedToPayment={handleProceedToPayment}
      showMessage={showMessage}
      cancelLoading={cancelLoading}
      reactivateLoading={reactivateLoading}
    />
  );
}