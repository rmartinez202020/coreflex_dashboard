import React from "react";
import {
  formatMoney,
  getDisplayPrice,
  getPlanActionLabel,
  useMySubscriptionSection,
} from "./useMySubscriptionSection";

function ActionPlanCard({
  plan,
  isCurrent,
  billingMode,
  onSelect,
  isSelected,
  currentPlanKey,
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
          <span className="font-semibold text-slate-900">{plan.tenantsUsers}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Data History</span>
          <span className="font-semibold text-slate-900 text-right">
            {plan.dataHistory}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => onSelect(plan)}
          disabled={isCurrent}
          className={`w-full rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
            isCurrent
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
              : isSelected
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {actionLabel}
        </button>
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
                <th className="px-4 py-3 text-left font-semibold">Monthly Price</th>
                <th className="px-4 py-3 text-left font-semibold">One-Time License</th>
                <th className="px-4 py-3 text-left font-semibold">Device Limit</th>
                <th className="px-4 py-3 text-left font-semibold">Tenants-Users</th>
                <th className="px-4 py-3 text-left font-semibold">Data History</th>
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
                  <td className="px-4 py-4">{plan.tenantsUsers}</td>
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

  return (
    <>
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
          {subscriptionError && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {subscriptionError}
            </div>
          )}

          {checkoutMessage && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              {checkoutMessage}
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
              <div className="mt-0.5 text-[13px] font-semibold text-emerald-700">
                {loadingSubscription ? "Loading..." : currentPlanStatus}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[10px] text-slate-500">Renewal</div>
              <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : currentPlanRenewal}
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
                  onSelect={selectPlan}
                  isSelected={selectedPlanKey === plan.key}
                  currentPlanKey={currentPlanKey}
                />
              ))}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-3 py-3">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <div className="xl:col-span-2 rounded-xl border border-emerald-200 bg-white p-3">
                  <div className="text-[13px] font-semibold text-slate-900">
                    {selectedPlanKey ? "Selected Plan" : "Current Plan + Add-ons"}
                  </div>

                  {effectivePlan ? (
                    <div className="mt-2 grid grid-cols-2 lg:grid-cols-5 gap-2 text-[12px]">
                      <div>
                        <div className="text-slate-500 text-[10px]">Plan</div>
                        <div className="font-semibold text-slate-900">
                          {effectivePlan.name}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[10px]">Billing</div>
                        <div className="font-semibold text-slate-900">
                          {billingMode === "monthly"
                            ? "Monthly"
                            : "One-Time License"}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[10px]">Base Price</div>
                        <div className="font-semibold text-slate-900">
                          {isCurrentPlanSelection
                            ? formatMoney(
                                0,
                                billingMode === "monthly" ? " / month" : ""
                              )
                            : getDisplayPrice(effectivePlan, billingMode)}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[10px]">Devices</div>
                        <div className="font-semibold text-slate-900">
                          {typeof effectivePlan.deviceLimit === "number"
                            ? `${effectivePlan.deviceLimit} ${
                                effectivePlan.deviceLimit === 1
                                  ? "device"
                                  : "devices"
                              }`
                            : effectivePlan.deviceLimit}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[10px]">Tenants-Users</div>
                        <div className="font-semibold text-slate-900">
                          {effectivePlan.tenantsUsers}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {showAddon && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-[12px] font-semibold text-slate-900">
                            Additional Tenant-User
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            Add more tenant-user slots for this subscription.
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

                    <button
                      onClick={openProceedToPayment}
                      disabled={checkoutLoading || !effectivePlan}
                      className={`rounded-lg px-3 py-2 text-[12px] font-semibold text-white ${
                        checkoutLoading || !effectivePlan
                          ? "bg-emerald-400 cursor-wait"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {effectivePlan?.key === "enterprise"
                        ? "Request Quote"
                        : "Proceed to Payment"}
                    </button>

                    <div className="text-[10px] leading-snug text-slate-500">
                      {effectivePlan?.key === "enterprise"
                        ? "Enterprise plans should be routed to your custom sales workflow."
                        : "Click Proceed to Payment to continue on Stripe's secure hosted checkout page."}
                    </div>
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