import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

const PLANS = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: "$0",
    oneTimeLicense: "N/A",
    deviceLimit: "1 device",
    tenantsUsers: "1",
    dataHistory: "7 days",
    features: "Basic telemetry, basic widgets, device testing",
    annualSupport: "N/A",
    shortFeature: "Basic telemetry and device testing",
  },
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: "$30 / month",
    oneTimeLicense: "$1,200",
    deviceLimit: "5 devices",
    tenantsUsers: "2",
    dataHistory: "30 days",
    features: "Alarms, dashboards, telemetry monitoring",
    annualSupport: "$79 / year",
    shortFeature: "Alarms and telemetry monitoring",
  },
  {
    key: "professional",
    name: "Professional",
    monthlyPrice: "$240 / month",
    oneTimeLicense: "$4,500",
    deviceLimit: "50 devices",
    tenantsUsers: "3",
    dataHistory: "1 year",
    features: "Automation rules, data export, advanced dashboards",
    annualSupport: "$199 / year",
    shortFeature: "Automation, export, advanced dashboards",
    badge: "Most Popular",
  },
  {
    key: "industrial",
    name: "Industrial",
    monthlyPrice: "$400 / month",
    oneTimeLicense: "$5,200",
    deviceLimit: "200 devices",
    tenantsUsers: "4",
    dataHistory: "Unlimited*",
    features: "Multi-site dashboards, analytics, advanced monitoring",
    annualSupport: "$599 / year",
    shortFeature: "Multi-site dashboards and analytics",
    badge: "Best for Multi-Site",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: "$900+ / month",
    oneTimeLicense: "$8,000+",
    deviceLimit: "Unlimited devices",
    tenantsUsers: "5",
    dataHistory: "Unlimited",
    features: "Custom integrations, dedicated server, priority support",
    annualSupport: "$1,500 / year",
    shortFeature: "Custom integrations and priority support",
  },
];

const PLAN_ORDER = ["free", "starter", "professional", "industrial", "enterprise"];

function getPlanActionLabel(planKey, currentPlanKey) {
  if (planKey === currentPlanKey) return "Current Plan";
  if (planKey === "enterprise") return "Contact Sales";

  const currentIndex = PLAN_ORDER.indexOf(currentPlanKey);
  const targetIndex = PLAN_ORDER.indexOf(planKey);

  if (targetIndex > currentIndex) return "Upgrade";
  if (targetIndex < currentIndex) return "Downgrade";
  return "Choose Plan";
}

function formatRenewalDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildDevicesUsedText(used, limit) {
  const safeUsed = Number.isFinite(Number(used)) ? Number(used) : 0;

  if (
    limit === null ||
    limit === undefined ||
    String(limit).trim() === "" ||
    Number(limit) <= 0
  ) {
    return `${safeUsed}`;
  }

  return `${safeUsed} / ${Number(limit)}`;
}

function buildTenantUsersUsedText(used, limit) {
  const safeUsed = Number.isFinite(Number(used)) ? Number(used) : 0;

  if (
    limit === null ||
    limit === undefined ||
    String(limit).trim() === "" ||
    Number(limit) <= 0
  ) {
    return `${safeUsed}`;
  }

  return `${safeUsed} / ${Number(limit)}`;
}

function ActionPlanCard({
  plan,
  isCurrent,
  billingMode,
  onSelect,
  isSelected,
  currentPlanKey,
}) {
  const actionLabel = getPlanActionLabel(plan.key, currentPlanKey);
  const displayPrice =
    billingMode === "monthly" ? plan.monthlyPrice : plan.oneTimeLicense;

  return (
    <div
      className={`rounded-2xl border bg-white px-4 py-4 shadow-sm transition flex flex-col ${
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-200"
          : isCurrent
          ? "border-emerald-300"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-slate-900">{plan.name}</div>
          <div className="mt-1 text-sm text-slate-500">{plan.shortFeature}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {plan.badge && (
            <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap">
              {plan.badge}
            </span>
          )}

          {isCurrent && (
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap">
              Current
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {billingMode === "monthly" ? "Monthly Price" : "One-Time License"}
        </div>
        <div className="mt-1 text-2xl font-bold text-slate-900">{displayPrice}</div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Device Limit</span>
          <span className="font-semibold text-slate-900">{plan.deviceLimit}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Tenants-Users</span>
          <span className="font-semibold text-slate-900">{plan.tenantsUsers}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Data History</span>
          <span className="font-semibold text-slate-900">{plan.dataHistory}</span>
        </div>
      </div>

      <div className="mt-5">
        <button
          onClick={() => onSelect(plan)}
          disabled={isCurrent}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
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

function ComparePlansModal({ open, onClose }) {
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
              {PLANS.map((plan, idx) => (
                <tr
                  key={plan.key}
                  className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  <td className="px-4 py-4 font-semibold">{plan.name}</td>
                  <td className="px-4 py-4">{plan.monthlyPrice}</td>
                  <td className="px-4 py-4">{plan.oneTimeLicense}</td>
                  <td className="px-4 py-4 font-semibold">{plan.deviceLimit}</td>
                  <td className="px-4 py-4">{plan.tenantsUsers}</td>
                  <td className="px-4 py-4">{plan.dataHistory}</td>
                  <td className="px-4 py-4">{plan.features}</td>
                  <td className="px-4 py-4">{plan.annualSupport}</td>
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
  const [showComparePlans, setShowComparePlans] = useState(false);
  const [billingMode, setBillingMode] = useState("monthly");
  const [selectedPlanKey, setSelectedPlanKey] = useState(null);

  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSubscription() {
      setLoadingSubscription(true);
      setSubscriptionError("");

      try {
        const token = String(getToken() || "").trim();

        if (!token) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch(`${API_URL}/subscription/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load subscription.");
        }

        if (!isMounted) return;
        setSubscription(data);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load subscription:", err);
        setSubscriptionError(
          err?.message || "Unable to load subscription information."
        );
      } finally {
        if (isMounted) {
          setLoadingSubscription(false);
        }
      }
    }

    loadSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentPlanKey = String(subscription?.plan_key || "free").toLowerCase();

  const currentPlan = useMemo(() => {
    return PLANS.find((plan) => plan.key === currentPlanKey) || PLANS[0];
  }, [currentPlanKey]);

  const selectedPlan = useMemo(() => {
    return PLANS.find((plan) => plan.key === selectedPlanKey) || null;
  }, [selectedPlanKey]);

  const selectedPrice = selectedPlan
    ? billingMode === "monthly"
      ? selectedPlan.monthlyPrice
      : selectedPlan.oneTimeLicense
    : null;

  const currentPlanStatus = subscription?.status || "Active";
  const currentPlanRenewal = formatRenewalDate(subscription?.renewal_date);
  const currentPlanDevicesUsed = buildDevicesUsedText(
    subscription?.devices_used,
    subscription?.device_limit
  );
  const currentPlanTenantUsersUsed = buildTenantUsersUsedText(
    subscription?.tenant_users_used,
    subscription?.tenants_users_limit
  );

  return (
    <>
      <div
        className="rounded-xl border border-slate-200 bg-white overflow-hidden"
        style={{ marginTop: "-22px" }}
      >
        <div className="bg-emerald-700 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm"
            >
              ← Back
            </button>

            <div>
              <div className="text-lg font-semibold">My Subscription</div>
              <div className="text-xs text-emerald-100">
                View subscription plans, billing details, and platform limits.
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-5 pt-1">
          {subscriptionError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {subscriptionError}
            </div>
          )}

          {/* CURRENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[11px] text-slate-500">Plan</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : currentPlan.name}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[11px] text-slate-500">Status</div>
              <div className="mt-1 text-sm font-semibold text-emerald-700">
                {loadingSubscription ? "Loading..." : currentPlanStatus}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[11px] text-slate-500">Renewal</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : currentPlanRenewal}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[11px] text-slate-500">Devices Used</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : currentPlanDevicesUsed}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <div className="text-[11px] text-slate-500">Tenants-Users</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {loadingSubscription ? "Loading..." : currentPlanTenantUsersUsed}
              </div>
            </div>
          </div>

          {/* ACTION SECTION */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-900 px-4 py-2">
              <div className="flex flex-col gap-1.5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-[15px] font-semibold leading-tight text-white">
                    Choose a Plan
                  </div>
                  <div className="mt-0.5 text-[11px] leading-tight text-slate-300">
                    Select a plan and billing type to continue to payment.
                  </div>
                </div>

                <div className="inline-flex rounded-md border border-slate-300 bg-white p-[2px] self-start">
                  <button
                    onClick={() => setBillingMode("monthly")}
                    className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold leading-none transition ${
                      billingMode === "monthly"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingMode("onetime")}
                    className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold leading-none transition ${
                      billingMode === "onetime"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    One-Time License
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {PLANS.map((plan) => (
                <ActionPlanCard
                  key={plan.key}
                  plan={plan}
                  isCurrent={plan.key === currentPlanKey}
                  billingMode={billingMode}
                  onSelect={(pickedPlan) => setSelectedPlanKey(pickedPlan.key)}
                  isSelected={selectedPlanKey === plan.key}
                  currentPlanKey={currentPlanKey}
                />
              ))}
            </div>

            {/* CHECKOUT SUMMARY */}
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
              {selectedPlan ? (
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Selected Plan
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 text-sm">
                        <div>
                          <div className="text-slate-500">Plan</div>
                          <div className="font-semibold text-slate-900">
                            {selectedPlan.name}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-500">Billing</div>
                          <div className="font-semibold text-slate-900">
                            {billingMode === "monthly"
                              ? "Monthly"
                              : "One-Time License"}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-500">Price</div>
                          <div className="font-semibold text-slate-900">
                            {selectedPrice}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-500">Devices</div>
                          <div className="font-semibold text-slate-900">
                            {selectedPlan.deviceLimit}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-500">Tenants-Users</div>
                          <div className="font-semibold text-slate-900">
                            {selectedPlan.tenantsUsers}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 text-sm font-semibold"
                        onClick={() => setSelectedPlanKey(null)}
                      >
                        Cancel
                      </button>

                      <button className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold">
                        {selectedPlan.key === "enterprise"
                          ? "Request Quote"
                          : "Proceed to Payment"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
                  <div className="text-sm font-semibold text-slate-900">
                    No plan selected yet
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Choose a plan above to review pricing and continue to payment.
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowComparePlans(true)}
                  className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-5 py-2 text-sm font-semibold shadow-sm"
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
      />
    </>
  );
}