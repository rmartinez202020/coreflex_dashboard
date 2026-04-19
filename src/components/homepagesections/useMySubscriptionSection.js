import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

export const DEFAULT_PLANS = [
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

export const PLAN_ORDER = [
  "free",
  "starter",
  "professional",
  "industrial",
  "enterprise",
];

export const DEFAULT_TENANT_USER_ADDON_PRICE = 310;

export function buildJsonHeaders(token) {
  const t = String(token || "").trim();
  const headers = {
    "Content-Type": "application/json",
  };

  if (t) {
    headers.Authorization = `Bearer ${t}`;
  }

  return headers;
}

export function formatMoney(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "Custom";
  const num = Number(value);
  if (!Number.isFinite(num)) return "Custom";
  return `$${num.toLocaleString("en-US")}${suffix}`;
}

export function getDisplayPrice(plan, billingMode) {
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

export function getNumericPlanPrice(plan, billingMode) {
  if (!plan || plan.key === "enterprise") return null;
  return billingMode === "monthly"
    ? Number(plan.monthlyPrice || 0)
    : plan.oneTimeLicense === null
      ? null
      : Number(plan.oneTimeLicense || 0);
}

export function getPlanActionLabel(planKey, currentPlanKey) {
  if (planKey === currentPlanKey) return "Current Plan";
  if (planKey === "enterprise") return "Contact Sales";

  const currentIndex = PLAN_ORDER.indexOf(currentPlanKey);
  const targetIndex = PLAN_ORDER.indexOf(planKey);

  if (targetIndex > currentIndex) return "Upgrade";
  if (targetIndex < currentIndex) return "Downgrade";
  return "Choose Plan";
}

export function formatRenewalDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function buildDevicesUsedText(used, limit) {
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

export function buildTenantUsersUsedText(used, limit) {
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

export function mergePlanCatalog(defaultPlans, dbPlans) {
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

export function resolveAddonPrice(addons) {
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

export function useMySubscriptionSection() {
  const [showComparePlans, setShowComparePlans] = useState(false);
  const [billingMode, setBillingMode] = useState("monthly");
  const [selectedPlanKey, setSelectedPlanKey] = useState(null);
  const [addonTenantUsersQty, setAddonTenantUsersQty] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [showProceedToPayment, setShowProceedToPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [checkoutSessionKey, setCheckoutSessionKey] = useState("");

  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");

  const [dbPlans, setDbPlans] = useState([]);
  const [dbAddons, setDbAddons] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState({
    planAmount: 0,
    addonAmount: 0,
    subtotal: 0,
    tax: 0,
    taxRate: 0,
    taxRatePercent: 0,
    taxLabel: "Tax",
    total: 0,
  });

  const resetPaymentIntentState = useCallback(() => {
    setClientSecret("");
    setPaymentIntentId("");
    setCheckoutSessionKey("");
    setPaymentBreakdown({
      planAmount: 0,
      addonAmount: 0,
      subtotal: 0,
      tax: 0,
      taxRate: 0,
      taxRatePercent: 0,
      taxLabel: "Tax",
      total: 0,
    });
  }, []);

  const loadSubscription = useCallback(async () => {
    setLoadingSubscription(true);
    setSubscriptionError("");

    try {
      const token = String(getToken() || "").trim();

      if (!token) {
        throw new Error("Missing authentication token.");
      }

      const response = await fetch(`${API_URL}/subscription/me`, {
        method: "GET",
        headers: buildJsonHeaders(token),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load subscription.");
      }

      setSubscription(data);
      return data;
    } catch (err) {
      console.error("Failed to load subscription:", err);
      setSubscriptionError(
        err?.message || "Unable to load subscription information."
      );
      throw err;
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function safeLoadSubscription() {
      try {
        const token = String(getToken() || "").trim();

        if (!token) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch(`${API_URL}/subscription/me`, {
          method: "GET",
          headers: buildJsonHeaders(token),
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

    setLoadingSubscription(true);
    setSubscriptionError("");
    safeLoadSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function tryLoadPublicCatalog(token) {
      const response = await fetch(`${API_URL}/billing/catalog`, {
        method: "GET",
        headers: buildJsonHeaders(token),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to load public billing catalog.");
      }

      return {
        plans: Array.isArray(data?.plans) ? data.plans : [],
        addons: Array.isArray(data?.addons) ? data.addons : [],
      };
    }

    async function tryLoadAdminCatalog(token) {
      const [plansRes, addonsRes] = await Promise.all([
        fetch(`${API_URL}/admin/billing/plans`, {
          method: "GET",
          headers: buildJsonHeaders(token),
        }),
        fetch(`${API_URL}/admin/billing/addons`, {
          method: "GET",
          headers: buildJsonHeaders(token),
        }),
      ]);

      const plansData = await plansRes.json().catch(() => []);
      const addonsData = await addonsRes.json().catch(() => []);

      if (!plansRes.ok || !addonsRes.ok) {
        throw new Error("Admin billing catalog is not available for this user.");
      }

      return {
        plans: Array.isArray(plansData) ? plansData : [],
        addons: Array.isArray(addonsData) ? addonsData : [],
      };
    }

    async function loadBillingCatalog() {
      try {
        const token = String(getToken() || "").trim();

        let catalog = null;

        try {
          catalog = await tryLoadPublicCatalog(token);
        } catch (publicErr) {
          console.warn(
            "Public billing catalog unavailable, trying admin fallback.",
            publicErr
          );

          try {
            catalog = await tryLoadAdminCatalog(token);
          } catch (adminErr) {
            console.warn(
              "Admin billing catalog unavailable, using defaults.",
              adminErr
            );
            catalog = { plans: [], addons: [] };
          }
        }

        if (!isMounted) return;

        setDbPlans(Array.isArray(catalog?.plans) ? catalog.plans : []);
        setDbAddons(Array.isArray(catalog?.addons) ? catalog.addons : []);
      } catch (err) {
        if (!isMounted) return;
        console.warn("Billing catalog fallback to defaults:", err);
        setDbPlans([]);
        setDbAddons([]);
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

  const isCurrentPlanSelection =
    !selectedPlan || selectedPlan.key === currentPlanKey;

  const chargeablePlanPrice = isCurrentPlanSelection ? 0 : effectivePlanPrice;

  const addonSubtotal = addonTenantUsersQty * tenantUserAddonPrice;
  const subtotalAmount =
    (Number.isFinite(chargeablePlanPrice) ? chargeablePlanPrice : 0) +
    addonSubtotal;

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

  const displayTax = Number(paymentBreakdown.tax || 0);
  const displayTotal =
    Number(paymentBreakdown.total || 0) > 0
      ? Number(paymentBreakdown.total || 0)
      : subtotalAmount;

  const showAddon = true;

  const currentCheckoutSessionKey = useMemo(() => {
    return JSON.stringify({
      planKey: String(effectivePlan?.key || ""),
      billingMode: String(billingMode || ""),
      addonTenantUsersQty: Number(addonTenantUsersQty || 0),
      isCurrentPlanSelection: Boolean(isCurrentPlanSelection),
    });
  }, [
    effectivePlan?.key,
    billingMode,
    addonTenantUsersQty,
    isCurrentPlanSelection,
  ]);

  const createPaymentIntentForCurrentSelection = useCallback(async () => {
    if (!effectivePlan) {
      throw new Error("Unable to start payment.");
    }

    if (effectivePlan.key === "enterprise") {
      throw new Error("Unable to start payment.");
    }

    if (subtotalAmount <= 0) {
      throw new Error("Unable to start payment.");
    }

    if (
      clientSecret &&
      paymentIntentId &&
      checkoutSessionKey &&
      checkoutSessionKey === currentCheckoutSessionKey
    ) {
      return {
        clientSecret,
        paymentIntentId,
        checkoutSessionKey,
      };
    }

    const token = String(getToken() || "").trim();
    if (!token) {
      throw new Error("Unable to start payment.");
    }

    console.log("PAYMENT INIT REQUEST:", {
      effectivePlanKey: effectivePlan.key,
      billingMode,
      addonTenantUsersQty,
      isCurrentPlanSelection,
      subtotalAmount,
      checkoutSessionKey: currentCheckoutSessionKey,
    });

    const response = await fetch(`${API_URL}/billing/create-payment-intent`, {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({
        planKey: effectivePlan.key,
        billingType: billingMode,
        extraTenantUsers: addonTenantUsersQty,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error("Unable to start payment.");
    }

    if (!data?.clientSecret) {
      throw new Error("Unable to start payment.");
    }

    console.log("PAYMENT INIT RESPONSE:", {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
      paymentPlanAmount: data?.planAmount,
      paymentAddonAmount: data?.addonAmount,
      paymentSubtotal: data?.subtotal,
      paymentTax: data?.tax,
      paymentTotal: data?.total,
      checkoutSessionKey: currentCheckoutSessionKey,
    });

    setClientSecret(String(data.clientSecret || ""));
    setPaymentIntentId(String(data.paymentIntentId || ""));
    setCheckoutSessionKey(currentCheckoutSessionKey);
    setPaymentBreakdown({
      planAmount: Number(data?.planAmount || 0),
      addonAmount: Number(data?.addonAmount || 0),
      subtotal: Number(data?.subtotal || 0),
      tax: Number(data?.tax || 0),
      taxRate: Number(data?.taxRate || 0),
      taxRatePercent: Number(data?.taxRatePercent || 0),
      taxLabel: String(data?.taxLabel || "Tax"),
      total: Number(data?.total || 0),
    });

    return {
      clientSecret: String(data.clientSecret || ""),
      paymentIntentId: String(data.paymentIntentId || ""),
      checkoutSessionKey: currentCheckoutSessionKey,
    };
  }, [
    effectivePlan,
    subtotalAmount,
    clientSecret,
    paymentIntentId,
    checkoutSessionKey,
    currentCheckoutSessionKey,
    billingMode,
    addonTenantUsersQty,
    isCurrentPlanSelection,
  ]);

  const openProceedToPayment = useCallback(async () => {
    if (checkoutLoading) return;
    if (!effectivePlan) return;

    if (effectivePlan.key !== "enterprise" && subtotalAmount <= 0) {
      setCheckoutMessage("");
      return;
    }

    setCheckoutMessage("");

    if (effectivePlan.key === "enterprise") {
      setCheckoutMessage("");
      return;
    }

    try {
      setCheckoutLoading(true);
      await createPaymentIntentForCurrentSelection();
      setShowProceedToPayment(true);
    } catch (err) {
      console.error("Payment init failed:", err);
      setCheckoutMessage("");
      resetPaymentIntentState();
    } finally {
      setCheckoutLoading(false);
    }
  }, [
    checkoutLoading,
    effectivePlan,
    subtotalAmount,
    createPaymentIntentForCurrentSelection,
    resetPaymentIntentState,
  ]);

  const handleProceedToPaymentSubmit = useCallback(
    async (payload) => {
      try {
        if (checkoutLoading) return;

        setCheckoutLoading(true);
        setCheckoutMessage("");

        const stripe = payload?.stripe;
        const elements = payload?.elements;

        if (!stripe || !elements) {
          throw new Error("Payment could not be completed.");
        }

        if (!clientSecret) {
          throw new Error("Payment could not be completed.");
        }

        const billingDetails = payload?.billingDetails || {};

        console.log("PAYMENT CONFIRM REQUEST:", {
          addonTenantUsersQty,
          paymentBreakdown,
          clientSecret,
          paymentIntentId,
          checkoutSessionKey,
        });

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: payload.cardElement,
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
        });

        if (result?.error) {
          throw new Error("Payment could not be completed.");
        }

        const confirmedPaymentIntentId = String(
          result?.paymentIntent?.id || ""
        ).trim();
        if (!confirmedPaymentIntentId) {
          throw new Error("Payment could not be completed.");
        }

        console.log("PAYMENT CONFIRM RESPONSE:", {
          paymentIntentId: confirmedPaymentIntentId,
          expectedPaymentIntentId: paymentIntentId,
          paymentIntentStatus: result?.paymentIntent?.status,
          checkoutSessionKey,
        });

        if (
          paymentIntentId &&
          confirmedPaymentIntentId &&
          paymentIntentId !== confirmedPaymentIntentId
        ) {
          throw new Error("Payment could not be completed.");
        }

        if (typeof payload?.applyPaymentToSubscription === "function") {
          await payload.applyPaymentToSubscription(confirmedPaymentIntentId);
        }

        await loadSubscription();

        if (
          result?.paymentIntent?.status === "succeeded" ||
          result?.paymentIntent?.status === "processing" ||
          result?.paymentIntent?.status === "requires_capture"
        ) {
          setCheckoutMessage("Payment successful.");
          setShowProceedToPayment(false);
          resetPaymentIntentState();
          setSelectedPlanKey(null);
          setAddonTenantUsersQty(0);
          return;
        }

        setCheckoutMessage("Payment successful.");
        setShowProceedToPayment(false);
        resetPaymentIntentState();
        setSelectedPlanKey(null);
        setAddonTenantUsersQty(0);
      } catch (err) {
        console.error("Proceed to payment failed:", err);
        setCheckoutMessage("");
      } finally {
        setCheckoutLoading(false);
      }
    },
    [
      checkoutLoading,
      addonTenantUsersQty,
      paymentBreakdown,
      clientSecret,
      paymentIntentId,
      checkoutSessionKey,
      loadSubscription,
      resetPaymentIntentState,
    ]
  );

  const handleCloseProceedToPayment = useCallback(() => {
    setShowProceedToPayment(false);
    setCheckoutLoading(false);
  }, []);

  const handlePaymentApplied = useCallback(async () => {
    try {
      await loadSubscription();
    } catch (_) {
      // no-op
    }
  }, [loadSubscription]);

  const selectPlan = useCallback(
    (pickedPlan) => {
      setSelectedPlanKey(pickedPlan.key);
      setCheckoutMessage("");
      setShowProceedToPayment(false);
      resetPaymentIntentState();
    },
    [resetPaymentIntentState]
  );

  const changeBillingMode = useCallback(
    (mode) => {
      setBillingMode(mode);
      setCheckoutMessage("");
      setShowProceedToPayment(false);
      resetPaymentIntentState();
    },
    [resetPaymentIntentState]
  );

  const changeAddonTenantUsersQty = useCallback(
    (qty) => {
      setAddonTenantUsersQty(Number(qty || 0));
      setCheckoutMessage("");
      setShowProceedToPayment(false);
      resetPaymentIntentState();
    },
    [resetPaymentIntentState]
  );

  const cancelSelection = useCallback(() => {
    setSelectedPlanKey(null);
    setAddonTenantUsersQty(0);
    setCheckoutMessage("");
    setShowProceedToPayment(false);
    resetPaymentIntentState();
  }, [resetPaymentIntentState]);

  return {
    showComparePlans,
    setShowComparePlans,
    billingMode,
    selectedPlanKey,
    addonTenantUsersQty,
    checkoutLoading,
    checkoutMessage,
    showProceedToPayment,
    clientSecret,
    paymentIntentId,
    subscription,
    loadingSubscription,
    subscriptionError,
    paymentBreakdown,
    plans,
    tenantUserAddonPrice,
    currentPlanKey,
    currentPlan,
    selectedPlan,
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
    handleProceedToPaymentSubmit,
    handleCloseProceedToPayment,
    handlePaymentApplied,
    selectPlan,
    changeBillingMode,
    changeAddonTenantUsersQty,
    cancelSelection,
  };
}