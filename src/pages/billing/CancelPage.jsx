import React from "react";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6 text-center">
        <div className="text-2xl font-bold text-red-600 mb-2">
          Payment Cancelled
        </div>

        <div className="text-sm text-slate-600 mb-4">
          Your checkout was canceled. No charges were made.
        </div>

        <button
          onClick={() => (window.location.href = "/")}
          className="mt-4 w-full rounded-lg bg-slate-800 text-white py-2 font-semibold hover:bg-slate-900"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}