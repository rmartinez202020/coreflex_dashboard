/*
  MySubscriptionSectionView.jsx

  This file intentionally contains the large presentation/view layer
  extracted from MySubscriptionSection.jsx.

  Keep this file in the same folder as:
  - MySubscriptionSection.jsx
  - MySubscriptionSectionParts.jsx
  - SubscriptionAgreementGate.jsx
  - useMySubscriptionSection.js

  The parent file still owns:
  - data loading
  - memoized billing rules
  - cancel/reactivate actions
  - checkout session apply logic
  - modal state

  This view file owns:
  - the main subscription panel layout
  - plan cards
  - one-time license visual states
  - tenant-user add-on UI
  - order summary UI
  - compare plans modal rendering

  Do not move backend/API calls here.
  Keep this file focused on rendering.
*/

import React from "react";
import SubscriptionAgreementGate from "./SubscriptionAgreementGate";
import { formatMoney } from "./useMySubscriptionSection";
import {
  ActionPlanCard,
  ComparePlansModal,
  ConfirmPopoutModal,
  LoadingDataModal,
  PaymentSuccessModal,
  SmallMessageModal,
} from "./MySubscriptionSectionParts";

export default function MySubscriptionSectionView({
  onBack,
  showInitialLoadingModal,
  showPaymentSuccessModal,
  handleClosePaymentSuccessModal,
  messageModal,
  closeMessageModal,
  confirmModal,
  handleConfirmAction,
  closeConfirmModal,
  showComparePlans,
  setShowComparePlans,
  billingMode,
  selectedPlanKey,
  addonTenantUsersQty,
  checkoutLoading,
  checkoutMessage,
  paymentBreakdown,
  plans,
  tenantUserAddonPrice,
  currentPlanKey,
  effectivePlan,
  chargeablePlanPrice,
  addonSubtotal,
  displayTax,
  displayTotal,
  showAddon,
  changeBillingMode,
  changeAddonTenantUsersQty,
  cancelSelection,
  loadingSubscription,
  displayedCurrentPlan,
  displayedStatus,
  displayedRenewal,
  displayedDevicesUsed,
  displayedTenantUsersUsed,
  cancellationScheduled,
  benefitsExpireDisplay,
  canceledOnDisplay,
  isAddonSelectionActive,
  isPlanSelectionActive,
  oneTimePaidPlanMap,
  paidOneTimePlanKeySet,
  paidOneTimePlanIndex,
  hasOneTimePaidPlan,
  hasActiveMonthlySubscription,
  checkoutBillingMode,
  hasCheckoutSelection,
  shouldShowPlanChargeLine,
  bypassAgreementModal,
  handleSelectPlan,
  handleCancelSubscription,
  handleReactivateSubscription,
  handleProceedToPayment,
  showMessage,
  cancelLoading,
  reactivateLoading,
}) {
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

            <div
              className={`p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 ${
                isAddonSelectionActive
                  ? "opacity-50 pointer-events-none cursor-not-allowed"
                  : ""
              }`}
            >
              {plans.map((plan, planIndex) => {
                const planKey = String(plan.key || "").toLowerCase();
                const currentKey = String(currentPlanKey || "").toLowerCase();
                const paidDate = oneTimePaidPlanMap[planKey] || null;
                const planIsOneTimePaid = paidOneTimePlanKeySet.has(planKey);

                const isCurrentMonthlyPlan =
                  billingMode === "monthly" &&
                  !hasOneTimePaidPlan &&
                  planKey === currentKey;

                const isCurrentFreeOneTimePlan =
                  billingMode === "one_time" &&
                  !hasOneTimePaidPlan &&
                  planKey === "free" &&
                  currentKey === "free";

                const isCurrentPlanCard =
                  isCurrentMonthlyPlan || isCurrentFreeOneTimePlan;

                const isOneTimeDowngradeBlocked =
                  hasOneTimePaidPlan &&
                  paidOneTimePlanIndex >= 0 &&
                  planIndex >= 0 &&
                  planIndex < paidOneTimePlanIndex;

                const isOneTimeBlockedByActiveMonthly =
                  hasActiveMonthlySubscription &&
                  billingMode === "one_time" &&
                  !["free", "enterprise"].includes(planKey);

                return (
                  <ActionPlanCard
                    key={plan.key}
                    plan={plan}
                    isCurrent={isCurrentPlanCard}
                    isOneTimePaid={planIsOneTimePaid}
                    isOneTimeDowngradeBlocked={isOneTimeDowngradeBlocked}
                    isOneTimeBlockedByActiveMonthly={
                      isOneTimeBlockedByActiveMonthly
                    }
                    oneTimePaidDate={paidDate}
                    billingMode={billingMode}
                    onSelect={handleSelectPlan}
                    isSelected={
                      !isAddonSelectionActive &&
                      selectedPlanKey === plan.key &&
                      !planIsOneTimePaid &&
                      !isCurrentFreeOneTimePlan &&
                      !isOneTimeDowngradeBlocked &&
                      !isOneTimeBlockedByActiveMonthly
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
                    <div
                      className={`mt-3 rounded-xl border px-3 py-3 ${
                        isPlanSelectionActive
                          ? "border-slate-200 bg-slate-100 opacity-60"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
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
                            disabled={isPlanSelectionActive}
                            onChange={(e) =>
                              changeAddonTenantUsersQty(Number(e.target.value || 0))
                            }
                            className={`rounded-lg border px-2 py-1.5 text-[12px] outline-none ${
                              isPlanSelectionActive
                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                : "border-slate-300 bg-white text-slate-900 focus:border-emerald-500"
                            }`}
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
                          {checkoutBillingMode === "monthly"
                            ? "(Monthly)"
                            : "(One-Time)"}
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
                        billingMode={checkoutBillingMode}
                        checkoutLoading={checkoutLoading || !hasCheckoutSelection}
                        reactivateLoading={reactivateLoading}
                        cancellationScheduled={
                          checkoutBillingMode === "one_time"
                            ? false
                            : cancellationScheduled
                        }
                        isTenantUsersOnlyCheckout={bypassAgreementModal}
                        openProceedToPayment={handleProceedToPayment}
                        showMessage={showMessage}
                      />
                    </div>

                    {checkoutMessage && (
                      <div className="text-[10px] leading-snug text-slate-500">
                        {checkoutMessage}
                      </div>
                    )}

                    {/* subscriptionError intentionally hidden from UI. */}
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
