import React from "react";

const PLANS = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: "$0",
    oneTimeLicense: "N/A",
    deviceLimit: "1 device",
    dashboards: "5",
    dataHistory: "7 days",
    features: "Basic telemetry, basic widgets, device testing",
    annualSupport: "N/A",
  },
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: "$30 / month",
    oneTimeLicense: "$1,200",
    deviceLimit: "5 devices",
    dashboards: "20",
    dataHistory: "30 days",
    features: "Alarms, dashboards, telemetry monitoring",
    annualSupport: "$79 / year",
  },
  {
    key: "professional",
    name: "Professional",
    monthlyPrice: "N/A",
    oneTimeLicense: "$3,500",
    deviceLimit: "50 devices",
    dashboards: "Unlimited",
    dataHistory: "1 year",
    features: "Automation rules, data export, advanced dashboards",
    annualSupport: "$199 / year",
  },
  {
    key: "industrial",
    name: "Industrial",
    monthlyPrice: "N/A",
    oneTimeLicense: "$5,200",
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
        <div>
          <span className="text-slate-500">License:</span> {plan.oneTimeLicense}
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
        {/* ✅ TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-100 text-slate-800">
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
                  Dashboards
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Data History
                </th>
                <th className="px-4 py-3 text-left font-semibold">Features</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Annual Updates & Support
                </th>
              </tr>
            </thead>
            <tbody>
              {PLANS.map((plan, idx) => (
                <tr
                  key={plan.key}
                  className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  <td className="px-4 py-4 align-top font-semibold text-slate-900">
                    {plan.name}
                  </td>
                  <td className="px-4 py-4 align-top">{plan.monthlyPrice}</td>
                  <td className="px-4 py-4 align-top">{plan.oneTimeLicense}</td>
                  <td className="px-4 py-4 align-top font-semibold">
                    {plan.deviceLimit}
                  </td>
                  <td className="px-4 py-4 align-top">{plan.dashboards}</td>
                  <td className="px-4 py-4 align-top">{plan.dataHistory}</td>
                  <td className="px-4 py-4 align-top">{plan.features}</td>
                  <td className="px-4 py-4 align-top">{plan.annualSupport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ YOUR CURRENT SUBSCRIPTION */}
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
                key={plan.key}
                plan={plan}
                isCurrent={plan.key === CURRENT_PLAN_KEY}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}