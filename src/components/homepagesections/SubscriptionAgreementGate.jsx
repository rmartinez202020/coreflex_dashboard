import React, { useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import ProceedAgreementModal from "./ProceedAgreementModal";

export default function SubscriptionAgreementGate({
  effectivePlan,
  selectedPlanKey,
  currentPlanKey,
  billingMode,
  checkoutLoading,
  reactivateLoading,
  cancellationScheduled,
  isTenantUsersOnlyCheckout,
  openProceedToPayment,
  showMessage,
}) {
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementSubmitting, setAgreementSubmitting] = useState(false);

  const handleOpenAgreementModal = () => {
    if (cancellationScheduled && effectivePlan?.key !== currentPlanKey) {
      showMessage({
        type: "warning",
        title: "Reactivate Required",
        message:
          "Your subscription is scheduled for cancellation. Please reactivate your current plan before changing to another plan.",
      });
      return;
    }

    if (checkoutLoading || !effectivePlan) return;

    if (isTenantUsersOnlyCheckout) {
      openProceedToPayment();
      return;
    }

    setShowAgreementModal(true);
  };

  const handleCloseAgreementModal = () => {
    if (agreementSubmitting) return;
    setShowAgreementModal(false);
  };

  const handleConfirmAgreement = async () => {
    try {
      setAgreementSubmitting(true);

      const token = String(getToken() || "").trim();
      if (!token) {
        throw new Error("Missing authentication token.");
      }

      const payload = {
        planKey: effectivePlan?.key || selectedPlanKey || currentPlanKey,
        billingType: billingMode,
        agreementVersion: "v1",
        confirmed: true,
      };

      const response = await fetch(`${API_URL}/subscription-agreements/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to save agreement confirmation.");
      }

      setShowAgreementModal(false);
      openProceedToPayment();
    } catch (err) {
      console.error("❌ Agreement confirmation failed:", err);
      showMessage({
        type: "error",
        title: "Agreement Failed",
        message: err?.message || "Failed to save agreement confirmation.",
      });
    } finally {
      setAgreementSubmitting(false);
    }
  };

  return (
    <>
      <ProceedAgreementModal
        open={showAgreementModal}
        onClose={handleCloseAgreementModal}
        onConfirm={handleConfirmAgreement}
        loading={agreementSubmitting}
      />

      <button
        onClick={handleOpenAgreementModal}
        disabled={
          checkoutLoading ||
          !effectivePlan ||
          agreementSubmitting ||
          reactivateLoading
        }
        className={`rounded-lg px-3 py-2 text-[12px] font-semibold text-white ${
          checkoutLoading ||
          !effectivePlan ||
          agreementSubmitting ||
          reactivateLoading
            ? "bg-emerald-400 cursor-wait"
            : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        {agreementSubmitting
          ? "Saving Agreement..."
          : effectivePlan?.key === "enterprise"
            ? "Request Quote"
            : isTenantUsersOnlyCheckout
              ? "Continue to Stripe"
              : "Proceed to Payment"}
      </button>

      <div className="text-[10px] leading-snug text-slate-500">
        {effectivePlan?.key === "enterprise"
          ? "Enterprise plans should be routed to your custom sales workflow."
          : isTenantUsersOnlyCheckout
            ? "Tenant-user add-ons for your current plan go directly to Stripe's secure hosted checkout page."
            : "Click Proceed to Payment to review and accept the agreement before continuing to Stripe's secure hosted checkout page."}
      </div>
    </>
  );
}