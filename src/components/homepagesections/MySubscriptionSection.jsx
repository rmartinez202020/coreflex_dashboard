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

function PlanCard({ plan }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-emerald-600 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💳</span>
          <div>
            <div className="text-lg font-semibold">{plan.name}</div>
            <div className="text-xs text-emerald-100">
              Subscription plan details
            </div>
          </div>
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
      </div>
    </div>
  );
}

export default function MySubscriptionSection({ onBack }) {
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
            Review available CoreFlex subscription plans below. Later we can
            connect this section to live customer billing, active plan status,
            device counts, and payment methods.
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}