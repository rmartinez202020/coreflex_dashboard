import React from "react";

const PLANS = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: "$0",
    oneTimeLicense: "N/A",
    deviceLimit: "1 device",
    dashboards: "1",
    dataHistory: "7 days",
    features: "Basic telemetry, basic widgets, device testing",
    annualSupport: "N/A",
  },
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: "$20 / month",
    oneTimeLicense: "$399",
    deviceLimit: "5 devices",
    dashboards: "Unlimited",
    dataHistory: "30 days",
    features: "Alarms, dashboards, telemetry monitoring",
    annualSupport: "$79 / year",
  },
  {
    key: "professional",
    name: "Professional",
    monthlyPrice: "$80 / month",
    oneTimeLicense: "$1,200",
    deviceLimit: "50 devices",
    dashboards: "Unlimited",
    dataHistory: "1 year",
    features: "Automation rules, data export, advanced dashboards",
    annualSupport: "$199 / year",
  },
  {
    key: "industrial",
    name: "Industrial",
    monthlyPrice: "$350 / month",
    oneTimeLicense: "$3,500",
    deviceLimit: "200 devices",
    dashboards: "Unlimited",
    dataHistory: "Unlimited*",
    features: "Multi-site dashboards, analytics, advanced monitoring",
    annualSupport: "$599 / year",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: "$900+ / month",
    oneTimeLicense: "$8,000+",
    deviceLimit: "Unlimited devices",
    dashboards: "Unlimited",
    dataHistory: "Unlimited",
    features: "Custom integrations, dedicated server, priority support",
    annualSupport: "$1,500 / year",
  },
];

// ✅ Demo current subscription state for now
const CURRENT_PLAN_KEY = "professional";
const CURRENT_PLAN_STATUS = "Active";
const CURRENT_PLAN_RENEWAL = "Apr 30, 2026";
const CURRENT_PLAN_DEVICES_USED = "12 / 50";

function PlanCard({ plan, isCurrent }) {
  return (
    <div
      className={`rounded-xl border bg-white shadow-sm overflow-hidden transition ${
        isCurrent
          ? "border-emerald-500 ring-2 ring-emerald-200"
          : "border-slate-200"
      }`}
    >
      <div
        className={`px-4 py-3 ${
          isCurrent ? "bg-emerald-700 text-white" : "bg-emerald-600 text-white"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <div>
              <div className="text-lg font-semibold">{plan.name}</div>
              <div className="text-xs text-emerald-100">
                Subscription plan details
              </div>
            </div>
          </div>

          {isCurrent && (
            <span className="rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-semibold text-white">
              Current Plan
            </span>
          )}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-800">
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <div className="text-xs text-slate-500">Monthly Price</div>
          <div className="font-semibold">{plan.monthlyPrice}</div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <div className="text-xs text-slate-500">One-Time License</div>
          <div className="font-semibold">{plan.oneTimeLicense}</div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <div className="text-xs text-slate-500">Device Limit</div>
          <div className="font-semibold">{plan.deviceLimit}</div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <div className="text-xs text-slate-500">Dashboards</div>
          <div className="font-semibold">{plan.dashboards}</div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <div className="text-xs text-slate-500">Data History</div>
          <div className="font-semibold">{plan.dataHistory}</div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <div className="text-xs text-slate-500">Annual Updates & Support</div>
          <div className="font-semibold">{plan.annualSupport}</div>
        </div>

        <div className="md:col-span-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3">
          <div className="text-xs text-slate-500 mb-1">Features</div>
          <div className="font-medium">{plan.features}</div>
        </div>

        <div className="md:col-span-2 pt-1">
          <button
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              isCurrent
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
                : "bg-slate-900 text-white hover:opacity-90"
            }`}
            disabled={isCurrent}
          >
            {isCurrent ? "Current Plan" : "Choose Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailablePlanCard({ plan, isCurrent }) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 shadow-sm bg-white transition ${
        isCurrent
          ? "border-emerald-500 ring-2 ring-emerald-200"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
          <div className="mt-1 text-sm text-slate-600">{plan.monthlyPrice}</div>
        </div>

        {isCurrent && (
          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-semibold">
            Current
          </span>
        )}
      </div>

      <div className="mt-3 text-sm text-slate-700 space-y-1">
        <div>
          <span className="text-slate-500">Devices:</span> {plan.deviceLimit}
        </div>
        <div>
          <span className="text-slate-500">Dashboards:</span> {plan.dashboards}
        </div>
        <div>
          <span className="text-slate-500">History:</span> {plan.dataHistory}
        </div>
      </div>

      <div className="mt-4">
        <button
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            isCurrent
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
          disabled={isCurrent}
        >
          {isCurrent ? "Current Plan" : "Choose Plan"}
        </button>
      </div>
    </div>
  );
}

export default function MySubscriptionSection({ onBack }) {
  const currentPlan =
    PLANS.find((plan) => plan.key === CURRENT_PLAN_KEY) || PLANS[0];

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
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

      <div className="p-5">
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="text-sm font-semibold text-emerald-900">
            Subscription Details
          </div>
          <div className="mt-1 text-sm text-emerald-800">
            Review available CoreFlex subscription plans below. Users can view
            their current plan, choose a different plan, manage payment methods,
            or cancel at any time.
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              isCurrent={plan.key === CURRENT_PLAN_KEY}
            />
          ))}
        </div>

        {/* ✅ CURRENT SUBSCRIPTION */}
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
          <div className="bg-emerald-700 text-white px-4 py-3">
            <div className="text-lg font-semibold">Your Current Subscription</div>
            <div className="text-xs text-emerald-100 mt-1">
              Manage your active plan, renewal date, device usage, and billing
              actions.
            </div>
          </div>

          <div className="p-4 md:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white border border-emerald-200 px-4 py-3">
                <div className="text-xs text-slate-500">Plan</div>
                <div className="mt-1 font-semibold text-slate-900">
                  {currentPlan.name}
                </div>
              </div>

              <div className="rounded-lg bg-white border border-emerald-200 px-4 py-3">
                <div className="text-xs text-slate-500">Status</div>
                <div className="mt-1 font-semibold text-emerald-700">
                  {CURRENT_PLAN_STATUS}
                </div>
              </div>

              <div className="rounded-lg bg-white border border-emerald-200 px-4 py-3">
                <div className="text-xs text-slate-500">Renewal</div>
                <div className="mt-1 font-semibold text-slate-900">
                  {CURRENT_PLAN_RENEWAL}
                </div>
              </div>

              <div className="rounded-lg bg-white border border-emerald-200 px-4 py-3">
                <div className="text-xs text-slate-500">Devices Used</div>
                <div className="mt-1 font-semibold text-slate-900">
                  {CURRENT_PLAN_DEVICES_USED}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col md:flex-row gap-3">
              <button className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold transition">
                Change Plan
              </button>

              <button className="rounded-lg bg-slate-900 hover:opacity-90 text-white px-4 py-2.5 text-sm font-semibold transition">
                Manage Payment
              </button>

              <button className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-sm font-semibold transition">
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>

        {/* ✅ AVAILABLE PLANS */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3">
            <div className="text-lg font-semibold">Available Plans</div>
            <div className="text-xs text-slate-300 mt-1">
              Choose the plan that best fits your device count, dashboards, and
              support needs.
            </div>
          </div>

          <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {PLANS.map((plan) => (
              <AvailablePlanCard
                key={`available-${plan.key}`}
                plan={plan}
                isCurrent={plan.key === CURRENT_PLAN_KEY}
              />
            ))}
          </div>
        </div>

        {/* ✅ CANCEL ANYTIME */}
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 overflow-hidden">
          <div className="bg-red-600 text-white px-4 py-3">
            <div className="text-lg font-semibold">Cancel Anytime</div>
            <div className="text-xs text-red-100 mt-1">
              Subscription flexibility and cancellation details.
            </div>
          </div>

          <div className="p-4 md:p-5">
            <div className="text-sm text-red-900">
              You may cancel your subscription at any time. Your service will
              remain active until the end of the current billing period.
            </div>

            <div className="mt-4">
              <button className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-sm font-semibold transition">
                Cancel My Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}