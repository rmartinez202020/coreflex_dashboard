import React, { useState } from "react";

export default function ProceedAgreementModal({
  open,
  onClose,
  onConfirm,
}) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!checked) return;

    try {
      setLoading(true);
      await onConfirm(); // parent will handle backend + continue to Stripe
    } catch (err) {
      console.error("Agreement confirm failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5">

        {/* HEADER */}
        <div className="text-[18px] font-semibold text-white">
          Subscription Agreement
        </div>

        {/* TERMS */}
        <div className="mt-4 max-h-[260px] overflow-auto rounded-lg bg-black/40 border border-slate-700 p-3 text-[12px] text-slate-300 leading-relaxed">

          By proceeding with this purchase, you agree to the following terms:

          <ul className="list-disc pl-5 mt-2 space-y-1">

            <li>
              You authorize CoreFlex Alliance LLC to charge your selected payment method
              for the chosen subscription plan and any additional tenant-user add-ons.
            </li>

            <li>
              Monthly subscriptions automatically renew at the end of each billing cycle
              unless canceled before the renewal date.
            </li>

            <li>
              One-time license purchases do not renew automatically.
            </li>

            <li>
              All payments are non-refundable once processed.
            </li>

            <li>
              Your access to devices, tenant-users, and platform features is limited
              according to your selected plan.
            </li>

            <li>
              Upgrading a plan will immediately update your limits. Downgrades may reduce
              available limits but will not delete existing data.
            </li>

            <li>
              Additional tenant-user purchases increase your account capacity and are
              applied immediately upon successful payment.
            </li>

            <li>
              CoreFlex reserves the right to modify pricing, plans, and platform features
              at any time.
            </li>

            <li>
              You agree to use the platform in compliance with all applicable laws and
              not misuse system access.
            </li>

          </ul>

          <div className="mt-3 text-[11px] text-slate-400">
            By checking the box below, you confirm that you understand and accept these terms.
          </div>

        </div>

        {/* CHECKBOX */}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          <span className="text-[12px] text-slate-300">
            I agree to the terms and conditions
          </span>
        </div>

        {/* ACTIONS */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-600 text-slate-300 py-2 text-[12px] font-semibold hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={!checked || loading}
            className={`flex-1 rounded-lg py-2 text-[12px] font-semibold text-white ${
              !checked || loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Processing..." : "Agree & Continue"}
          </button>
        </div>

      </div>
    </div>
  );
}