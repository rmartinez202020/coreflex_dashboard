import React, { useEffect, useMemo, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../../config/stripe";

function formatMoney(value, suffix = "") {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "$0";
  return `$${num.toLocaleString("en-US")}${suffix}`;
}

function buildPlanPrice(selectedPlan, billingMode) {
  if (!selectedPlan) return 0;
  if (selectedPlan.key === "enterprise") return 0;

  if (billingMode === "monthly") {
    return Number(selectedPlan.monthlyPrice || 0);
  }

  if (
    selectedPlan.oneTimeLicense === null ||
    selectedPlan.oneTimeLicense === undefined
  ) {
    return 0;
  }

  return Number(selectedPlan.oneTimeLicense || 0);
}

const STRIPE_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      color: "#0f172a",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      "::placeholder": {
        color: "#94a3b8",
      },
    },
    invalid: {
      color: "#dc2626",
      iconColor: "#dc2626",
    },
  },
};

function PaymentMethodSection({
  paymentError,
  setPaymentError,
  showPaymentElement,
  mountCardFields,
  enableCardFields,
  onEnableCardFields,
}) {
  const canRenderStripeFields =
    showPaymentElement && mountCardFields && enableCardFields;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold text-slate-900">
          Billing Entry
        </div>

        {paymentError ? (
          <div className="text-[11px] font-medium text-red-600 text-right">
            {paymentError}
          </div>
        ) : null}
      </div>

      <div
        autoComplete="off"
        className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
      >
        <input
          type="text"
          name="fake-card-holder"
          autoComplete="off"
          tabIndex={-1}
          className="hidden"
          aria-hidden="true"
        />
        <input
          type="password"
          name="fake-card-password"
          autoComplete="new-password"
          tabIndex={-1}
          className="hidden"
          aria-hidden="true"
        />

        <div className="mb-3">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border-2 border-emerald-600 bg-white px-4 py-3 text-left shadow-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm">
              💳
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">Card</div>
            </div>
          </button>
        </div>

        {!showPaymentElement ? (
          <>
            <div className="text-xs text-slate-500">
              Secure payment form is loading...
            </div>
            <div className="mt-1.5 text-[11px] text-slate-400">
              The card fields will appear as soon as Stripe is ready.
            </div>
          </>
        ) : !mountCardFields ? (
          <>
            <div className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
              Preparing secure billing fields...
            </div>
            <div className="mt-1.5 text-[11px] text-slate-400">
              Please wait a moment.
            </div>
          </>
        ) : !enableCardFields ? (
          <div className="space-y-3">
            <input
              type="text"
              name="contact_reference_code"
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="text"
              name="secure_reference_value"
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="password"
              name="secure_reference_password"
              autoComplete="new-password"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={onEnableCardFields}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-4 text-left transition hover:border-emerald-500 hover:bg-emerald-50"
            >
              <div className="text-[12px] font-medium text-slate-700">
                Number
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Click here to enter card details securely.
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#1A1F71] text-[10px] font-bold text-white shadow-sm">
                VISA
              </div>
              <div className="relative flex h-7 w-11 items-center justify-center rounded-md bg-black shadow-sm">
                <span className="absolute left-[10px] h-4 w-4 rounded-full bg-[#EB001B]" />
                <span className="absolute left-[18px] h-4 w-4 rounded-full bg-[#F79E1B]" />
              </div>
              <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#2E77BC] text-[8px] font-bold leading-none text-white shadow-sm">
                <span className="text-center">
                  AMERICAN
                  <br />
                  EXPRESS
                </span>
              </div>
              <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#C8102E] text-[10px] font-bold text-white shadow-sm">
                JCB
              </div>
              <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#009FDA] text-[9px] font-bold text-white shadow-sm">
                D-Pay
              </div>
              <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#FF6000] text-[8px] font-bold text-white shadow-sm">
                DISCOVER
              </div>
            </div>
          </div>
        ) : canRenderStripeFields ? (
          <>
            <input
              type="text"
              name="contact_reference_code"
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="text"
              name="secure_reference_value"
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="password"
              name="secure_reference_password"
              autoComplete="new-password"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />

            <div className="mb-1.5 flex items-center justify-between gap-3">
              <div className="text-[12px] font-medium text-slate-700">
                Number
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#1A1F71] text-[10px] font-bold text-white shadow-sm">
                  VISA
                </div>
                <div className="relative flex h-7 w-11 items-center justify-center rounded-md bg-black shadow-sm">
                  <span className="absolute left-[10px] h-4 w-4 rounded-full bg-[#EB001B]" />
                  <span className="absolute left-[18px] h-4 w-4 rounded-full bg-[#F79E1B]" />
                </div>
                <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#2E77BC] text-[8px] font-bold leading-none text-white shadow-sm">
                  <span className="text-center">
                    AMERICAN
                    <br />
                    EXPRESS
                  </span>
                </div>
                <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#C8102E] text-[10px] font-bold text-white shadow-sm">
                  JCB
                </div>
                <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#009FDA] text-[9px] font-bold text-white shadow-sm">
                  D-Pay
                </div>
                <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#FF6000] text-[8px] font-bold text-white shadow-sm">
                  DISCOVER
                </div>
              </div>
            </div>

            <div
              autoComplete="off"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 mb-3"
            >
              <CardNumberElement
                options={{
                  ...STRIPE_ELEMENT_STYLE,
                  showIcon: false,
                  placeholder: "1234 1234 1234 1234",
                  disabled: false,
                }}
                onChange={(event) => {
                  if (event?.error?.message) {
                    setPaymentError(event.error.message);
                  } else {
                    setPaymentError("");
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 text-[12px] font-medium text-slate-700">
                  Expiry
                </div>
                <div
                  autoComplete="off"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                >
                  <CardExpiryElement
                    options={{
                      ...STRIPE_ELEMENT_STYLE,
                      placeholder: "MM / YY",
                    }}
                    onChange={(event) => {
                      if (event?.error?.message) {
                        setPaymentError(event.error.message);
                      } else {
                        setPaymentError("");
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-[12px] font-medium text-slate-700">
                  Security Code
                </div>
                <div
                  autoComplete="off"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                >
                  <CardCvcElement
                    options={{
                      ...STRIPE_ELEMENT_STYLE,
                      placeholder: "CVC",
                    }}
                    onChange={(event) => {
                      if (event?.error?.message) {
                        setPaymentError(event.error.message);
                      } else {
                        setPaymentError("");
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="mt-3 text-[11px] text-slate-500">
          For PCI compliance, card data is collected securely by Stripe.
        </div>
      </div>
    </div>
  );
}

function ProceedToPaymentLayout({
  onClose,
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
  showPaymentElement,
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
  const [mountCardFields, setMountCardFields] = useState(false);
  const [enableCardFields, setEnableCardFields] = useState(false);

  useEffect(() => {
    setEmail(userEmail || "");
  }, [userEmail]);

  useEffect(() => {
    if (!showPaymentElement) {
      setMountCardFields(false);
      setEnableCardFields(false);
      return;
    }

    const t = setTimeout(() => setMountCardFields(true), 350);
    return () => clearTimeout(t);
  }, [showPaymentElement]);

  const planPrice = useMemo(() => {
    return buildPlanPrice(selectedPlan, billingMode);
  }, [selectedPlan, billingMode]);

  const addonSubtotal = useMemo(() => {
    return Number(addonTenantUsersQty || 0) * Number(tenantUserAddonPrice || 0);
  }, [addonTenantUsersQty, tenantUserAddonPrice]);

  const total = useMemo(() => {
    return planPrice + addonSubtotal;
  }, [planPrice, addonSubtotal]);

  const billingLabel =
    billingMode === "monthly" ? "Monthly" : "One-Time License";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!selectedPlan) {
      setLocalError("Please select a plan first.");
      return;
    }

    if (!email.trim()) {
      setLocalError("Email is required.");
      return;
    }

    if (!fullName.trim()) {
      setLocalError("Full name is required.");
      return;
    }

    if (!address1.trim()) {
      setLocalError("Billing address is required.");
      return;
    }

    if (!city.trim()) {
      setLocalError("City is required.");
      return;
    }

    if (!stateRegion.trim()) {
      setLocalError("State / Region is required.");
      return;
    }

    if (!zipCode.trim()) {
      setLocalError("ZIP / Postal code is required.");
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

    if (!enableCardFields) {
      setLocalError("Please click the billing entry box and enter card details.");
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
      });
      return;
    }

    try {
      const { error } = await stripe.confirmCardPayment(clientSecret, {
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

      if (error) {
        setLocalError(error.message || "Payment failed.");
        return;
      }
    } catch (err) {
      setLocalError(String(err?.message || err || "Payment failed."));
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/55 px-4 py-6">
      <div className="w-full max-w-[930px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
          <div>
            <div className="text-base font-semibold">Proceed to Payment</div>
            <div className="text-[11px] text-slate-300">
              Secure checkout for your selected CoreFlex plan.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="grid grid-cols-1 xl:grid-cols-3 gap-0"
        >
          <input
            type="text"
            name="fake-username"
            autoComplete="username"
            tabIndex={-1}
            className="hidden"
            aria-hidden="true"
          />
          <input
            type="password"
            name="fake-password"
            autoComplete="new-password"
            tabIndex={-1}
            className="hidden"
            aria-hidden="true"
          />

          <div className="xl:col-span-2 border-r border-slate-200 p-4">
            {(localError || checkoutError) && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {localError || checkoutError}
              </div>
            )}

            <div className="mb-4">
              <div className="text-[13px] font-semibold text-slate-900">
                Contact Information
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Email
                  </label>
                  <input
                    type="email"
                    name="billing_email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="billing_full_name"
                    autoComplete="off"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="Full name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Company
                  </label>
                  <input
                    type="text"
                    name="billing_company"
                    autoComplete="off"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="Company name"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[13px] font-semibold text-slate-900">
                Billing Address
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="billing_address_1"
                    autoComplete="off"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="Street address"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="billing_address_2"
                    autoComplete="off"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="Apartment, suite, unit, etc. (optional)"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    City
                  </label>
                  <input
                    type="text"
                    name="billing_city"
                    autoComplete="off"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    State / Region
                  </label>
                  <input
                    type="text"
                    name="billing_state_region"
                    autoComplete="off"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="State / Region"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    ZIP / Postal Code
                  </label>
                  <input
                    type="text"
                    name="billing_zip_code"
                    autoComplete="off"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="ZIP / Postal code"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Country
                  </label>
                  <input
                    type="text"
                    name="billing_country"
                    autoComplete="off"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="US"
                  />
                </div>
              </div>
            </div>

            <PaymentMethodSection
              paymentError={paymentError}
              setPaymentError={setPaymentError}
              showPaymentElement={showPaymentElement}
              mountCardFields={mountCardFields}
              enableCardFields={enableCardFields}
              onEnableCardFields={() => setEnableCardFields(true)}
            />
          </div>

          <div className="bg-slate-50 p-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[13px] font-semibold text-slate-900">
                Order Summary
              </div>

              <div className="mt-3 space-y-2.5 text-sm">
                <div>
                  <div className="text-[11px] text-slate-500">Selected Plan</div>
                  <div className="font-semibold text-slate-900">
                    {selectedPlan?.name || "No plan selected"}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Billing</span>
                  <span className="font-semibold text-slate-900">
                    {billingLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Plan Price</span>
                  <span className="font-semibold text-slate-900">
                    {selectedPlan?.key === "enterprise"
                      ? "Custom"
                      : formatMoney(planPrice)}
                  </span>
                </div>

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

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between gap-3">
                  <span className="text-slate-900 font-semibold">Total</span>
                  <span className="text-xl font-bold text-slate-900">
                    {selectedPlan?.key === "enterprise"
                      ? "Custom Quote"
                      : formatMoney(total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={
                    checkoutLoading ||
                    !selectedPlan ||
                    !clientSecret ||
                    !stripe ||
                    !elements
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                    checkoutLoading ||
                    !selectedPlan ||
                    !clientSecret ||
                    !stripe ||
                    !elements
                      ? "bg-emerald-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {checkoutLoading ? "Processing..." : "Pay Now"}
                </button>
              </div>

              <div className="mt-3 text-[11px] leading-snug text-slate-500">
                Taxes, discounts, and final Stripe confirmation can be applied
                in the backend payment-intent flow.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProceedToPaymentStripeInner(props) {
  const stripe = useStripe();
  const elements = useElements();
  const isReady = !!stripe && !!elements;

  return (
    <ProceedToPaymentLayout
      {...props}
      stripe={stripe}
      elements={elements}
      showPaymentElement={isReady}
    />
  );
}

export default function ProceedToPayment({
  open = false,
  onClose,
  selectedPlan = null,
  billingMode = "monthly",
  addonTenantUsersQty = 0,
  tenantUserAddonPrice = 310,
  userEmail = "",
  checkoutLoading = false,
  checkoutError = "",
  onSubmit,
  clientSecret = "",
}) {
  if (!open) return null;

  const stripeOptions = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#059669",
            borderRadius: "10px",
          },
        },
      }
    : null;

  if (!stripeOptions) {
    return (
      <ProceedToPaymentLayout
        onClose={onClose}
        selectedPlan={selectedPlan}
        billingMode={billingMode}
        addonTenantUsersQty={addonTenantUsersQty}
        tenantUserAddonPrice={tenantUserAddonPrice}
        userEmail={userEmail}
        checkoutLoading={checkoutLoading}
        checkoutError={checkoutError}
        onSubmit={onSubmit}
        clientSecret={clientSecret}
        stripe={null}
        elements={null}
        showPaymentElement={false}
      />
    );
  }

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <ProceedToPaymentStripeInner
        onClose={onClose}
        selectedPlan={selectedPlan}
        billingMode={billingMode}
        addonTenantUsersQty={addonTenantUsersQty}
        tenantUserAddonPrice={tenantUserAddonPrice}
        userEmail={userEmail}
        checkoutLoading={checkoutLoading}
        checkoutError={checkoutError}
        onSubmit={onSubmit}
        clientSecret={clientSecret}
      />
    </Elements>
  );
}