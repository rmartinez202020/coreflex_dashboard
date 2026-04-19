import React from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../../config/stripe";
import useProceedToPaymentForm, {
  roundMoney,
} from "./useProceedToPaymentForm";

function formatMoney(value, suffix = "") {
  const num = roundMoney(value);
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${suffix}`;
}

const STRIPE_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: "13px",
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
  setPaymentError,
  showPaymentElement,
  setCardNumberComplete,
  setCardExpiryComplete,
  setCardCvcComplete,
  setCardNumberError,
  setCardExpiryError,
  setCardCvcError,
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-[12px] font-semibold text-slate-900">
          Payment Method
        </div>
      </div>

      <div
        autoComplete="off"
        className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5"
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

        <div className="mb-2.5">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border-2 border-emerald-600 bg-white px-3 py-2.5 text-left shadow-sm"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs">
              💳
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Card</div>
            </div>
          </button>
        </div>

        {showPaymentElement ? (
          <>
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="text-[11px] font-medium text-slate-700">
                Card number
              </div>

              <div className="hidden sm:flex items-center gap-1.5">
                <div className="flex h-6 w-9 items-center justify-center rounded-md bg-[#1A1F71] text-[9px] font-bold text-white shadow-sm">
                  VISA
                </div>
                <div className="relative flex h-6 w-9 items-center justify-center rounded-md bg-black shadow-sm">
                  <span className="absolute left-[7px] h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
                  <span className="absolute left-[14px] h-3.5 w-3.5 rounded-full bg-[#F79E1B]" />
                </div>
                <div className="flex h-6 w-10 items-center justify-center rounded-md bg-[#2E77BC] text-[7px] font-bold leading-none text-white shadow-sm">
                  <span className="text-center">
                    AMERICAN
                    <br />
                    EXPRESS
                  </span>
                </div>
                <div className="flex h-6 w-9 items-center justify-center rounded-md bg-[#C8102E] text-[9px] font-bold text-white shadow-sm">
                  JCB
                </div>
                <div className="flex h-6 w-9 items-center justify-center rounded-md bg-[#009FDA] text-[8px] font-bold text-white shadow-sm">
                  D-Pay
                </div>
                <div className="flex h-6 w-9 items-center justify-center rounded-md bg-[#FF6000] text-[7px] font-bold text-white shadow-sm">
                  DISCOVER
                </div>
              </div>
            </div>

            <div
              autoComplete="off"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 mb-2.5"
            >
              <CardNumberElement
                options={{
                  ...STRIPE_ELEMENT_STYLE,
                  showIcon: false,
                  placeholder: "1234 1234 1234 1234",
                  disabled: false,
                }}
                onChange={(event) => {
                  setCardNumberComplete(!!event?.complete);
                  const msg = event?.error?.message || "";
                  setCardNumberError(msg);
                  setPaymentError(msg);
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <div className="mb-1 text-[11px] font-medium text-slate-700">
                  Expiration
                </div>
                <div
                  autoComplete="off"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <CardExpiryElement
                    options={{
                      ...STRIPE_ELEMENT_STYLE,
                      placeholder: "MM / YY",
                    }}
                    onChange={(event) => {
                      setCardExpiryComplete(!!event?.complete);
                      const msg = event?.error?.message || "";
                      setCardExpiryError(msg);
                      setPaymentError(msg);
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 text-[11px] font-medium text-slate-700">
                  CVC
                </div>
                <div
                  autoComplete="off"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <CardCvcElement
                    options={{
                      ...STRIPE_ELEMENT_STYLE,
                      placeholder: "CVC",
                    }}
                    onChange={(event) => {
                      setCardCvcComplete(!!event?.complete);
                      const msg = event?.error?.message || "";
                      setCardCvcError(msg);
                      setPaymentError(msg);
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs text-slate-500">
              Secure payment form is loading...
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              The card fields will appear as soon as Stripe is ready.
            </div>
          </>
        )}

        <div className="mt-2.5 text-[10px] text-slate-500">
          For PCI compliance, card data is collected securely by Stripe.
        </div>
      </div>
    </div>
  );
}

function PaymentSuccessSection({
  selectedPlan,
  total,
  billingLabel,
  onClose,
}) {
  return (
    <div className="flex min-h-[480px] items-center justify-center p-6">
      <div className="w-full max-w-[520px] rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✅
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">
            Payment Successful
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Your payment was processed successfully and your subscription has
            been updated.
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-sm text-slate-500">Plan</span>
            <span className="text-sm font-semibold text-slate-900">
              {selectedPlan?.name || "Selected Plan"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-sm text-slate-500">Billing</span>
            <span className="text-sm font-semibold text-slate-900">
              {billingLabel}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-sm text-slate-500">Amount Paid</span>
            <span className="text-lg font-bold text-emerald-700">
              {formatMoney(total)}
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Thank you. Your CoreFlex subscription payment has been completed.
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Close
          </button>
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
  isCurrentPlanSelection = false,
  paymentSubtotal = 0,
  paymentTax = 0,
  paymentTaxRate = 0,
  paymentTaxRatePercent = 0,
  paymentTaxLabel = "Tax",
  paymentTotal = 0,
  paymentPlanAmount = 0,
  paymentAddonAmount = 0,
  onPaymentApplied,
}) {
  const {
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
  } = useProceedToPaymentForm({
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
    isCurrentPlanSelection,
    paymentSubtotal,
    paymentTax,
    paymentTaxRate,
    paymentTaxRatePercent,
    paymentTaxLabel,
    paymentPlanAmount,
    paymentAddonAmount,
    onPaymentApplied,
    onClose,
  });

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/55 px-4 py-4">
      <div className="w-full max-w-[760px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 text-white">
          <div>
            <div className="text-sm font-semibold">Proceed to Payment</div>
            <div className="text-[10px] text-slate-300">
              Secure checkout for your selected CoreFlex plan.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-3 py-1 text-[11px] font-semibold hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {paymentSuccess ? (
          <PaymentSuccessSection
            selectedPlan={selectedPlan}
            total={total}
            billingLabel={billingLabel}
            onClose={onClose}
          />
        ) : (
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

            <div className="xl:col-span-2 border-r border-slate-200 p-3">
              <div className="mb-3">
                <div className="text-[12px] font-semibold text-slate-900">
                  Contact Information
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-600">
                      Email
                    </label>
                    <input
                      type="email"
                      name="billing_email"
                      autoComplete="off"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched("email")}
                      className={inputClassName("email")}
                      placeholder="you@example.com"
                    />
                    {showFieldError("email") ? (
                      <div className="mt-1 text-[10px] font-medium text-red-600">
                        {validationErrors.email}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-600">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="billing_full_name"
                      autoComplete="off"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => markTouched("fullName")}
                      className={inputClassName("fullName")}
                      placeholder="Full name"
                    />
                    {showFieldError("fullName") ? (
                      <div className="mt-1 text-[10px] font-medium text-red-600">
                        {validationErrors.fullName}
                      </div>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[10px] font-medium text-slate-600">
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

              <div className="mb-3">
                <div className="text-[12px] font-semibold text-slate-900">
                  Billing Address
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[10px] font-medium text-slate-600">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      name="billing_address_1"
                      autoComplete="off"
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      onBlur={() => markTouched("address1")}
                      className={inputClassName("address1")}
                      placeholder="Street address"
                    />
                    {showFieldError("address1") ? (
                      <div className="mt-1 text-[10px] font-medium text-red-600">
                        {validationErrors.address1}
                      </div>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[10px] font-medium text-slate-600">
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
                    <label className="mb-1 block text-[10px] font-medium text-slate-600">
                      City
                    </label>
                    <input
                      type="text"
                      name="billing_city"
                      autoComplete="off"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onBlur={() => markTouched("city")}
                      className={inputClassName("city")}
                      placeholder="City"
                    />
                    {showFieldError("city") ? (
                      <div className="mt-1 text-[10px] font-medium text-red-600">
                        {validationErrors.city}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-600">
                      State / Region
                    </label>
                    <input
                      type="text"
                      name="billing_state_region"
                      autoComplete="off"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      onBlur={() => markTouched("stateRegion")}
                      className={inputClassName("stateRegion")}
                      placeholder="State / Region"
                    />
                    {showFieldError("stateRegion") ? (
                      <div className="mt-1 text-[10px] font-medium text-red-600">
                        {validationErrors.stateRegion}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-600">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      name="billing_zip_code"
                      autoComplete="off"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      onBlur={() => markTouched("zipCode")}
                      className={inputClassName("zipCode")}
                      placeholder="ZIP / Postal code"
                    />
                    {showFieldError("zipCode") ? (
                      <div className="mt-1 text-[10px] font-medium text-red-600">
                        {validationErrors.zipCode}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-600">
                      Country
                    </label>
                    <input
                      type="text"
                      name="billing_country"
                      autoComplete="off"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      onBlur={() => markTouched("country")}
                      className={inputClassName("country")}
                      placeholder="US"
                    />
                    {showFieldError("country") ? (
                      <div className="mt-1 text-[10px] font-medium text-red-600">
                        {validationErrors.country}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <PaymentMethodSection
                setPaymentError={setPaymentError}
                showPaymentElement={showPaymentElement}
                setCardNumberComplete={setCardNumberComplete}
                setCardExpiryComplete={setCardExpiryComplete}
                setCardCvcComplete={setCardCvcComplete}
                setCardNumberError={setCardNumberError}
                setCardExpiryError={setCardExpiryError}
                setCardCvcError={setCardCvcError}
              />
            </div>

            <div className="bg-slate-50 p-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[12px] font-semibold text-slate-900">
                  Order Summary
                </div>

                <div className="mt-2.5 space-y-2 text-sm">
                  <div>
                    <div className="text-[10px] text-slate-500">
                      Selected Plan
                    </div>
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
                    <span className="text-slate-500">
                      Plan Price
                      {isCurrentPlanSelection ? " (Current Plan)" : ""}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {selectedPlan?.key === "enterprise"
                        ? "Custom"
                        : formatMoney(summaryPlanAmount)}
                    </span>
                  </div>

                  {addonTenantUsersQty > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">
                        Additional Tenant-User × {addonTenantUsersQty}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(summaryAddonAmount)}
                      </span>
                    </div>
                  )}

                  {summaryTax > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">{taxDisplayLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(summaryTax)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-900 font-semibold">Total</span>
                    <span className="text-xl font-bold text-slate-900">
                      {selectedPlan?.key === "enterprise"
                        ? "Custom Quote"
                        : formatMoney(total)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isPayNowDisabled}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                      isPayNowDisabled
                        ? "bg-slate-400 text-white cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {checkoutLoading ? "Processing payment..." : "Pay Now"}
                  </button>

                  {displayError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                      {displayError}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </form>
        )}
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
  isCurrentPlanSelection = false,
  paymentSubtotal = 0,
  paymentTax = 0,
  paymentTaxRate = 0,
  paymentTaxRatePercent = 0,
  paymentTaxLabel = "Tax",
  paymentTotal = 0,
  paymentPlanAmount = 0,
  paymentAddonAmount = 0,
  onPaymentApplied,
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
        isCurrentPlanSelection={isCurrentPlanSelection}
        paymentSubtotal={paymentSubtotal}
        paymentTax={paymentTax}
        paymentTaxRate={paymentTaxRate}
        paymentTaxRatePercent={paymentTaxRatePercent}
        paymentTaxLabel={paymentTaxLabel}
        paymentTotal={paymentTotal}
        paymentPlanAmount={paymentPlanAmount}
        paymentAddonAmount={paymentAddonAmount}
        onPaymentApplied={onPaymentApplied}
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
        isCurrentPlanSelection={isCurrentPlanSelection}
        paymentSubtotal={paymentSubtotal}
        paymentTax={paymentTax}
        paymentTaxRate={paymentTaxRate}
        paymentTaxRatePercent={paymentTaxRatePercent}
        paymentTaxLabel={paymentTaxLabel}
        paymentTotal={paymentTotal}
        paymentPlanAmount={paymentPlanAmount}
        paymentAddonAmount={paymentAddonAmount}
        onPaymentApplied={onPaymentApplied}
      />
    </Elements>
  );
}