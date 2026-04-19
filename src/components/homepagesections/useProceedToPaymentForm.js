import { useEffect, useMemo, useState } from "react";
import { CardNumberElement } from "@stripe/react-stripe-js";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function roundMoney(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function buildPlanPrice(selectedPlan, billingMode) {
  if (!selectedPlan) return 0;
  if (selectedPlan.key === "enterprise") return 0;

  if (billingMode === "monthly") {
    return roundMoney(selectedPlan.monthlyPrice || 0);
  }

  if (
    selectedPlan.oneTimeLicense === null ||
    selectedPlan.oneTimeLicense === undefined
  ) {
    return 0;
  }

  return roundMoney(selectedPlan.oneTimeLicense || 0);
}

function isValidEmail(value) {
  const v = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function isReasonableText(value, minLength = 2) {
  const v = String(value || "").trim();
  if (v.length < minLength) return false;
  return /[A-Za-z]/.test(v);
}

function isValidFullName(value) {
  const v = String(value || "").trim().replace(/\s+/g, " ");
  if (v.length < 4) return false;
  const parts = v.split(" ").filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every((part) => /[A-Za-z]/.test(part) && part.length >= 2);
}

function isValidAddressLine1(value) {
  const v = String(value || "").trim();
  if (v.length < 5) return false;
  return /\d/.test(v) && /[A-Za-z]/.test(v);
}

function isValidZipCode(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  return /^[A-Za-z0-9][A-Za-z0-9\s-]{2,11}$/.test(v);
}

function getFieldError(field, value) {
  const v = String(value || "").trim();

  switch (field) {
    case "email":
      if (!v) return "Email is required.";
      if (!isValidEmail(v)) return "Need a valid email address.";
      return "";

    case "fullName":
      if (!v) return "Full name is required.";
      if (!isValidFullName(v))
        return "Enter first and last name using real letters.";
      return "";

    case "company":
      return "";

    case "address1":
      if (!v) return "Billing address is required.";
      if (!isValidAddressLine1(v))
        return "Enter a valid street address with number and street name.";
      return "";

    case "city":
      if (!v) return "City is required.";
      if (!isReasonableText(v, 2)) return "Enter a valid city.";
      return "";

    case "stateRegion":
      if (!v) return "State / Region is required.";
      if (!isReasonableText(v, 2)) return "Enter a valid state / region.";
      return "";

    case "zipCode":
      if (!v) return "ZIP / Postal code is required.";
      if (!isValidZipCode(v)) return "Enter a valid ZIP / Postal code.";
      return "";

    case "country":
      if (!v) return "Country is required.";
      if (!isReasonableText(v, 2)) return "Enter a valid country.";
      return "";

    default:
      return "";
  }
}

export default function useProceedToPaymentForm({
  selectedPlan,
  billingMode,
  addonTenantUsersQty,
  tenantUserAddonPrice,
  userEmail,
  checkoutLoading,
  checkoutError,
  onSubmit,
  clientSecret,
  stripe,
  elements,
  isCurrentPlanSelection = false,
  paymentSubtotal = 0,
  paymentTax = 0,
  paymentTaxRate = 0,
  paymentTaxRatePercent = 0,
  paymentTaxLabel = "Tax",
  paymentPlanAmount = 0,
  paymentAddonAmount = 0,
  onPaymentApplied,
  onClose,
}) {
  const [email, setEmail] = useState(userEmail || "");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("US");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);
  const [cardNumberError, setCardNumberError] = useState("");
  const [cardExpiryError, setCardExpiryError] = useState("");
  const [cardCvcError, setCardCvcError] = useState("");
  const [touched, setTouched] = useState({
    email: false,
    fullName: false,
    company: false,
    address1: false,
    city: false,
    stateRegion: false,
    zipCode: false,
    country: false,
  });

  useEffect(() => {
    setEmail(userEmail || "");
  }, [userEmail]);

  const rawPlanPrice = useMemo(() => {
    return roundMoney(buildPlanPrice(selectedPlan, billingMode));
  }, [selectedPlan, billingMode]);

  const planPrice = useMemo(() => {
    if (selectedPlan?.key === "enterprise") return 0;
    return roundMoney(isCurrentPlanSelection ? 0 : rawPlanPrice);
  }, [selectedPlan, isCurrentPlanSelection, rawPlanPrice]);

  const addonSubtotal = useMemo(() => {
    return roundMoney(
      Number(addonTenantUsersQty || 0) * Number(tenantUserAddonPrice || 0)
    );
  }, [addonTenantUsersQty, tenantUserAddonPrice]);

  const summaryPlanAmount = useMemo(() => {
    if (selectedPlan?.key === "enterprise") return 0;
    if (isCurrentPlanSelection) return 0;
    if (Number(paymentPlanAmount || 0) > 0) {
      return roundMoney(paymentPlanAmount || 0);
    }
    return roundMoney(planPrice);
  }, [selectedPlan, isCurrentPlanSelection, paymentPlanAmount, planPrice]);

  const summaryAddonAmount = useMemo(() => {
    if (Number(paymentAddonAmount || 0) > 0) {
      return roundMoney(paymentAddonAmount || 0);
    }
    return roundMoney(addonSubtotal);
  }, [paymentAddonAmount, addonSubtotal]);

  const summarySubtotal = useMemo(() => {
    if (selectedPlan?.key === "enterprise") return 0;
    return roundMoney(summaryPlanAmount + summaryAddonAmount);
  }, [selectedPlan, summaryPlanAmount, summaryAddonAmount]);

  const effectiveTaxRate = useMemo(() => {
    if (Number(paymentTaxRate || 0) > 0) {
      return Number(paymentTaxRate || 0);
    }

    if (Number(paymentTaxRatePercent || 0) > 0) {
      return Number(paymentTaxRatePercent || 0) / 100;
    }

    const subtotalForInference = Number(paymentSubtotal || 0);
    const taxForInference = Number(paymentTax || 0);

    if (subtotalForInference > 0 && taxForInference > 0) {
      return taxForInference / subtotalForInference;
    }

    return 0;
  }, [paymentTaxRate, paymentTaxRatePercent, paymentSubtotal, paymentTax]);

  const summaryTax = useMemo(() => {
    if (selectedPlan?.key === "enterprise") return 0;
    if (summarySubtotal <= 0) return 0;
    if (effectiveTaxRate <= 0) return roundMoney(paymentTax || 0);
    return roundMoney(summarySubtotal * effectiveTaxRate);
  }, [selectedPlan, summarySubtotal, effectiveTaxRate, paymentTax]);

  const total = useMemo(() => {
    if (selectedPlan?.key === "enterprise") return 0;
    return roundMoney(summarySubtotal + summaryTax);
  }, [selectedPlan, summarySubtotal, summaryTax]);

  const billingLabel =
    billingMode === "monthly" ? "Monthly" : "One-Time License";

  const taxDisplayLabel = useMemo(() => {
    const label = String(paymentTaxLabel || "").trim() || "Tax";
    if (paymentTaxRatePercent) {
      return `${label} (${roundMoney(paymentTaxRatePercent).toFixed(2)}%)`;
    }
    if (paymentTaxRate) {
      return `${label} (${roundMoney(Number(paymentTaxRate) * 100).toFixed(
        2
      )}%)`;
    }
    return label;
  }, [paymentTaxLabel, paymentTaxRatePercent, paymentTaxRate]);

  const validationErrors = useMemo(() => {
    return {
      email: getFieldError("email", email),
      fullName: getFieldError("fullName", fullName),
      company: "",
      address1: getFieldError("address1", address1),
      city: getFieldError("city", city),
      stateRegion: getFieldError("stateRegion", stateRegion),
      zipCode: getFieldError("zipCode", zipCode),
      country: getFieldError("country", country),
    };
  }, [email, fullName, address1, city, stateRegion, zipCode, country]);

  const isContactInfoValid = useMemo(() => {
    return Object.values(validationErrors).every((msg) => !msg);
  }, [validationErrors]);

  const isCardValid = useMemo(() => {
    return (
      cardNumberComplete &&
      cardExpiryComplete &&
      cardCvcComplete &&
      !cardNumberError &&
      !cardExpiryError &&
      !cardCvcError
    );
  }, [
    cardNumberComplete,
    cardExpiryComplete,
    cardCvcComplete,
    cardNumberError,
    cardExpiryError,
    cardCvcError,
  ]);

  const isPayNowDisabled =
    checkoutLoading ||
    paymentSuccess ||
    !selectedPlan ||
    total <= 0 ||
    !clientSecret ||
    !stripe ||
    !elements ||
    !isContactInfoValid ||
    !isCardValid;

  const showFieldError = (name) => touched[name] && validationErrors[name];

  const inputClassName = (name) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none ${
      showFieldError(name)
        ? "border-red-400 bg-red-50 focus:border-red-500"
        : "border-slate-300 focus:border-emerald-500"
    }`;

  const markTouched = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const displayError = checkoutError || localError || paymentError;

  const applyPaymentToSubscription = async (paymentIntentId) => {
    const pid = String(paymentIntentId || "").trim();
    if (!pid) {
      throw new Error("Missing paymentIntentId.");
    }

    const token = String(getToken() || "").trim();

    const res = await fetch(`${API_URL}/billing/apply-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        paymentIntentId: pid,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.detail || data?.message || "Failed to apply payment."
      );
    }

    if (typeof onPaymentApplied === "function") {
      try {
        await onPaymentApplied(data);
      } catch (_) {
        // no-op
      }
    }

    return data;
  };

  const handleSuccessfulPayment = async (paymentIntentId) => {
    await applyPaymentToSubscription(paymentIntentId);
    setPaymentSuccess(true);
    setPaymentError("");
    setLocalError("");

    if (typeof onClose === "function") {
      setTimeout(() => {
        onClose();
      }, 2200);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setPaymentError("");
    setTouched({
      email: true,
      fullName: true,
      company: false,
      address1: true,
      city: true,
      stateRegion: true,
      zipCode: true,
      country: true,
    });

    if (!selectedPlan) {
      setLocalError("Please select a plan first.");
      return;
    }

    if (selectedPlan.key !== "enterprise" && total <= 0) {
      setLocalError(
        "There is no charge to process. Please select a paid upgrade or add-ons."
      );
      return;
    }

    if (validationErrors.email) {
      setLocalError(validationErrors.email);
      return;
    }

    if (validationErrors.fullName) {
      setLocalError(validationErrors.fullName);
      return;
    }

    if (validationErrors.address1) {
      setLocalError(validationErrors.address1);
      return;
    }

    if (validationErrors.city) {
      setLocalError(validationErrors.city);
      return;
    }

    if (validationErrors.stateRegion) {
      setLocalError(validationErrors.stateRegion);
      return;
    }

    if (validationErrors.zipCode) {
      setLocalError(validationErrors.zipCode);
      return;
    }

    if (validationErrors.country) {
      setLocalError(validationErrors.country);
      return;
    }

    if (!isCardValid) {
      setLocalError("Enter a valid card number, expiration date, and CVC.");
      return;
    }

    if (!clientSecret) {
      setLocalError(
        "Secure payment form is still loading. Please wait a moment."
      );
      return;
    }

    if (!stripe || !elements) {
      setLocalError("Stripe is still loading. Please wait a moment.");
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);

    if (!cardNumberElement) {
      setLocalError("Card form is not ready yet. Please wait a moment.");
      return;
    }

    if (typeof onSubmit === "function") {
      onSubmit({
        selectedPlan,
        billingMode,
        addonTenantUsersQty,
        billingDetails: {
          email: email.trim(),
          fullName: fullName.trim(),
          company: company.trim(),
          country: country.trim(),
          address1: address1.trim(),
          address2: address2.trim(),
          city: city.trim(),
          stateRegion: stateRegion.trim(),
          zipCode: zipCode.trim(),
        },
        stripe,
        elements,
        cardElement: cardNumberElement,
        setLocalError,
        setPaymentError,
        applyPaymentToSubscription,
        setPaymentSuccess,
        onClose,
      });
      return;
    }

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            email: email.trim(),
            name: fullName.trim(),
            address: {
              line1: address1.trim(),
              line2: address2.trim() || undefined,
              city: city.trim(),
              state: stateRegion.trim(),
              postal_code: zipCode.trim(),
              country: country.trim() || "US",
            },
          },
        },
      });

      if (result?.error) {
        setPaymentError(result.error.message || "Payment failed.");
        return;
      }

      const paymentIntentId = String(result?.paymentIntent?.id || "").trim();
      if (!paymentIntentId) {
        setPaymentError(
          "Payment succeeded but no payment intent ID was returned."
        );
        return;
      }

      await handleSuccessfulPayment(paymentIntentId);
    } catch (err) {
      setPaymentError(String(err?.message || err || "Payment failed."));
    }
  };

  return {
    email,
    setEmail,
    fullName,
    setFullName,
    company,
    setCompany,
    country,
    setCountry,
    address1,
    setAddress1,
    address2,
    setAddress2,
    city,
    setCity,
    stateRegion,
    setStateRegion,
    zipCode,
    setZipCode,
    setPaymentError,
    setCardNumberComplete,
    setCardExpiryComplete,
    setCardCvcComplete,
    setCardNumberError,
    setCardExpiryError,
    setCardCvcError,
    billingLabel,
    taxDisplayLabel,
    summaryPlanAmount,
    summaryAddonAmount,
    summaryTax,
    total,
    validationErrors,
    isPayNowDisabled,
    displayError,
    paymentSuccess,
    showFieldError,
    inputClassName,
    markTouched,
    handleSubmit,
  };
}

export { roundMoney, buildPlanPrice };