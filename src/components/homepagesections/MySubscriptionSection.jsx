import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import ProceedToPayment from "./ProceedToPayment";

const DEFAULT_PLANS = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    oneTimeLicense: null,
    deviceLimit: 1,
    tenantsUsers: 1,
    dataHistory: "7 days",
    features: "Basic telemetry, basic widgets, device testing",
    annualSupport: null,
    shortFeature: "Basic telemetry and device testing",
  },
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: 30,
    oneTimeLicense: 1200,
    deviceLimit: 5,
    tenantsUsers: 2,
    dataHistory: "30 days",
    features: "Alarms, dashboards, telemetry monitoring",
    annualSupport: 79,
    shortFeature: "Alarms and telemetry monitoring",
  },
  {
    key: "professional",
    name: "Professional",
    monthlyPrice: 240,
    oneTimeLicense: 4500,
    deviceLimit: 50,
    tenantsUsers: 3,
    dataHistory: "1 year",
    features: "Automation rules, data export, advanced dashboards",
    annualSupport: 199,
    shortFeature: "Automation, export, advanced dashboards",
    badge: "Most Popular",
  },
  {
    key: "industrial",
    name: "Industrial",
    monthlyPrice: 400,
    oneTimeLicense: 9000,
    deviceLimit: 200,
    tenantsUsers: 4,
    dataHistory: "Unlimited*",
    features: "Multi-site dashboards, analytics, advanced monitoring",
    annualSupport: 599,
    shortFeature: "Multi-site dashboards and analytics",
    badge: "Best for Multi-Site",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    oneTimeLicense: null,
    deviceLimit: "Unlimited",
    tenantsUsers: 5,
    dataHistory: "Unlimited",
    features: "Custom integrations, dedicated server, priority support",
    annualSupport: 1500,
    shortFeature: "Custom integrations and priority support",
  },
];

const PLAN_ORDER = ["free", "starter", "professional", "industrial", "enterprise"];
const DEFAULT_TENANT_USER_ADDON_PRICE = 310;

function formatMoney(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "Custom";
  const num = Number(value);
  if (!Number.isFinite(num)) return "Custom";
  return `$${num.toLocaleString("en-US")}${suffix}`;
}

function getDisplayPrice(plan, billingMode) {
  if (!plan) return "—";
  if (plan.key === "enterprise") {
    return billingMode === "monthly" ? "$900+ / month" : "Custom Quote";
  }
  if (billingMode === "monthly") {
    return formatMoney(plan.monthlyPrice, " / month");
  }
  if (plan.oneTimeLicense === null) return "N/A";
  return formatMoney(plan.oneTimeLicense);
}

function getNumericPlanPrice(plan, billingMode) {
  if (!plan || plan.key === "enterprise") return null;
  return billingMode === "monthly"
    ? Number(plan.monthlyPrice || 0)
    : plan.oneTimeLicense === null
    ? null
    : Number(plan.oneTimeLicense || 0);
}

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

function mergePlanCatalog(defaultPlans, dbPlans) {
  const grouped = new Map();

  (Array.isArray(dbPlans) ? dbPlans : []).forEach((row) => {
    const key = String(row?.plan_key || "").trim().toLowerCase();
    if (!key) return;

    if (!grouped.has(key)) {
      grouped.set(key, {});
    }

    const bucket = grouped.get(key);
    const billingType = String(row?.billing_type || "").trim().toLowerCase();

    if (billingType === "monthly") {
      bucket.monthlyPrice = row?.price_usd;
    } else if (billingType === "one_time") {
      bucket.oneTimeLicense = row?.price_usd;
    }

    if (row?.device_limit !== null && row?.device_limit !== undefined) {
      bucket.deviceLimit = row.device_limit;
    }
    if (
      row?.tenant_user_limit !== null &&
      row?.tenant_user_limit !== undefined
    ) {
      bucket.tenantsUsers = row.tenant_user_limit;
    }
    if (
      row?.data_history_days !== null &&
      row?.data_history_days !== undefined
    ) {
      if (Number(row.data_history_days) >= 9999) {
        bucket.dataHistory = "Unlimited";
      } else if (Number(row.data_history_days) === 365) {
        bucket.dataHistory = "1 year";
      } else {
        bucket.dataHistory = `${row.data_history_days} days`;
      }
    }
    if (row?.plan_name) {
      bucket.name = row.plan_name;
    }
  });

  return defaultPlans.map((plan) => {
    const db = grouped.get(plan.key) || {};
    return {
      ...plan,
      ...db,
      monthlyPrice:
        db.monthlyPrice !== undefined ? db.monthlyPrice : plan.monthlyPrice,
      oneTimeLicense:
        db.oneTimeLicense !== undefined
          ? db.oneTimeLicense
          : plan.oneTimeLicense,
      deviceLimit:
        db.deviceLimit !== undefined ? db.deviceLimit : plan.deviceLimit,
      tenantsUsers:
        db.tenantsUsers !== undefined ? db.tenantsUsers : plan.tenantsUsers,
      dataHistory:
        db.dataHistory !== undefined ? db.dataHistory : plan.dataHistory,
      name: db.name || plan.name,
    };
  });
}

function resolveAddonPrice(addons) {
  const rows = Array.isArray(addons) ? addons : [];
  const monthlyTenantUser = rows.find(
    (row) =>
      String(row?.addon_key || "").trim().toLowerCase() === "tenant_user" &&
      String(row?.billing_type || "").trim().toLowerCase() === "monthly"
  );

  if (
    monthlyTenantUser &&
    monthlyTenantUser.price_usd !== null &&
    monthlyTenantUser.price_usd !== undefined
  ) {
    return Number(monthlyTenantUser.price_usd || 0);
  }

  return DEFAULT_TENANT_USER_ADDON_PRICE;
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
  const [showComparePlans, setShowComparePlans] = useState(false);
  const [billingMode, setBillingMode] = useState("monthly");
  const [selectedPlanKey, setSelectedPlanKey] = useState(null);
  const [addonTenantUsersQty, setAddonTenantUsersQty] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [showProceedToPayment, setShowProceedToPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");

  const [dbPlans, setDbPlans] = useState([]);
  const [dbAddons, setDbAddons] = useState([]);

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

  useEffect(() => {
    let isMounted = true;

    async function loadBillingCatalog() {
      try {
        const token = String(getToken() || "").trim();
        if (!token) return;

        const [plansRes, addonsRes] = await Promise.all([
          fetch(`${API_URL}/admin/billing/plans`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_URL}/admin/billing/addons`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        const plansData = await plansRes.json().catch(() => []);
        const addonsData = await addonsRes.json().catch(() => []);

        if (!isMounted) return;

        if (plansRes.ok && Array.isArray(plansData)) {
          setDbPlans(plansData);
        }

        if (addonsRes.ok && Array.isArray(addonsData)) {
          setDbAddons(addonsData);
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn("Billing catalog fallback to defaults:", err);
      }
    }

    loadBillingCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const plans = useMemo(() => {
    return mergePlanCatalog(DEFAULT_PLANS, dbPlans);
  }, [dbPlans]);

  const tenantUserAddonPrice = useMemo(() => {
    return resolveAddonPrice(dbAddons);
  }, [dbAddons]);

  const currentPlanKey = String(subscription?.plan_key || "free").toLowerCase();

  const currentPlan = useMemo(() => {
    return plans.find((plan) => plan.key === currentPlanKey) || plans[0];
  }, [currentPlanKey, plans]);

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.key === selectedPlanKey) || null;
  }, [selectedPlanKey, plans]);

  const effectivePlan = selectedPlan || currentPlan;
  const effectivePlanPrice = getNumericPlanPrice(effectivePlan, billingMode);
  const addonSubtotal = addonTenantUsersQty * tenantUserAddonPrice;
  const totalAmount =
    (Number.isFinite(effectivePlanPrice) ? effectivePlanPrice : 0) + addonSubtotal;

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

  const showAddon = true;

  function openProceedToPayment() {
    if (!effectivePlan) return;

    setCheckoutMessage("");
    setClientSecret("");

    if (effectivePlan.key === "enterprise") {
      setCheckoutMessage(
        "Enterprise plans use a custom quote flow. Connect this button to your sales/contact workflow."
      );
      return;
    }

    setShowProceedToPayment(true);
  }

  useEffect(() => {
    let isMounted = true;

    async function initializePaymentIntent() {
      if (!showProceedToPayment) return;
      if (!effectivePlan) return;
      if (effectivePlan.key === "enterprise") return;
      if (clientSecret) return;

      try {
        setCheckoutLoading(true);
        setCheckoutMessage("");

        const token = String(getToken() || "").trim();
        if (!token) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch(`${API_URL}/billing/create-payment-intent`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planKey: effectivePlan.key,
            billingType: billingMode,
            extraTenantUsers: addonTenantUsersQty,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.detail || "Failed to initialize payment.");
        }

        if (!data?.clientSecret) {
          throw new Error("clientSecret not returned from backend.");
        }

        if (!isMounted) return;
        setClientSecret(data.clientSecret);
      } catch (err) {
        if (!isMounted) return;
        console.error("Payment init failed:", err);
        setCheckoutMessage(err?.message || "Unable to start payment.");
      } finally {
        if (isMounted) {
          setCheckoutLoading(false);
        }
      }
    }

    initializePaymentIntent();

    return () => {
      isMounted = false;
    };
  }, [
    showProceedToPayment,
    clientSecret,
    effectivePlan,
    billingMode,
    addonTenantUsersQty,
  ]);

  async function handleProceedToPaymentSubmit(payload) {
    try {
      setCheckoutLoading(true);
      setCheckoutMessage("");

      const stripe = payload?.stripe;
      const elements = payload?.elements;

      if (!stripe || !elements) {
        throw new Error("Stripe payment form is not ready.");
      }

      const billingDetails = payload?.billingDetails || {};

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: billingDetails.fullName || "",
              email: billingDetails.email || "",
              address: {
                line1: billingDetails.address1 || "",
                line2: billingDetails.address2 || "",
                city: billingDetails.city || "",
                state: billingDetails.stateRegion || "",
                postal_code: billingDetails.zipCode || "",
                country:
                  String(billingDetails.country || "US")
                    .trim()
                    .toUpperCase()
                    .slice(0, 2) || "US",
              },
            },
          },
        },
        redirect: "if_required",
      });

      if (result?.error) {
        throw new Error(result.error.message || "Payment confirmation failed.");
      }

      if (
        result?.paymentIntent?.status === "succeeded" ||
        result?.paymentIntent?.status === "processing" ||
        result?.paymentIntent?.status === "requires_capture"
      ) {
        setCheckoutMessage("Payment submitted successfully.");
        setShowProceedToPayment(false);
        setClientSecret("");
        return;
      }

      setCheckoutMessage("Payment submitted. Waiting for final confirmation.");
      setShowProceedToPayment(false);
      setClientSecret("");
    } catch (err) {
      console.error("Proceed to payment failed:", err);
      setCheckoutMessage(
        err?.message || "Unable to continue to payment right now."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  function handleCloseProceedToPayment() {
    setShowProceedToPayment(false);
    setClientSecret("");
    setCheckoutLoading(false);
  }

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
                    Select a plan and billing type to continue to payment.
                  </div>
                </div>

                <div className="inline-flex rounded-md border border-slate-300 bg-white p-[2px] self-start">
                  <button
                    onClick={() => setBillingMode("monthly")}
                    className={`rounded-sm px-2 py-1 text-[10px] font-semibold leading-none transition ${
                      billingMode === "monthly"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingMode("one_time")}
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
                  onSelect={(pickedPlan) => {
                    setSelectedPlanKey(pickedPlan.key);
                    setCheckoutMessage("");
                  }}
                  isSelected={selectedPlanKey === plan.key}
                  currentPlanKey={currentPlanKey}
                />
              ))}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-3 py-3">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <div className="xl:col-span-2 rounded-xl border border-emerald-200 bg-white p-3">
                  <div className="text-[13px] font-semibold text-slate-900">
                    {selectedPlan ? "Selected Plan" : "Current Plan + Add-ons"}
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
                          {getDisplayPrice(effectivePlan, billingMode)}
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
                              setAddonTenantUsersQty(Number(e.target.value || 0))
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
                        </span>
                        <span className="font-semibold text-slate-900">
                          {effectivePlan.key === "enterprise"
                            ? "Custom"
                            : formatMoney(effectivePlanPrice || 0)}
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

                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between gap-3">
                      <span className="text-slate-900 font-semibold">Total</span>
                      <span className="text-[16px] font-bold text-slate-900">
                        {effectivePlan?.key === "enterprise"
                          ? "Custom Quote"
                          : formatMoney(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-3 py-2 text-[12px] font-semibold"
                      onClick={() => {
                        setSelectedPlanKey(null);
                        setAddonTenantUsersQty(0);
                        setCheckoutMessage("");
                        setClientSecret("");
                        setShowProceedToPayment(false);
                      }}
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
                        : "Click Proceed to Payment to open the checkout modal."}
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

      <ProceedToPayment
        open={showProceedToPayment}
        onClose={handleCloseProceedToPayment}
        selectedPlan={effectivePlan}
        billingMode={billingMode}
        addonTenantUsersQty={addonTenantUsersQty}
        tenantUserAddonPrice={tenantUserAddonPrice}
        userEmail={subscription?.email || ""}
        checkoutLoading={checkoutLoading}
        checkoutError={checkoutMessage}
        onSubmit={handleProceedToPaymentSubmit}
        clientSecret={clientSecret}
      />
    </>
  );
}