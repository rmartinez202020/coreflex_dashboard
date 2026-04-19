import React, { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

export default function BillingSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Finalizing your subscription...");

  useEffect(() => {
    let isMounted = true;

    async function refreshSubscription() {
      try {
        const token = String(getToken() || "").trim();

        if (!token) {
          throw new Error("Missing authentication.");
        }

        // 👇 This just refreshes UI after webhook applied
        const res = await fetch(`${API_URL}/subscription/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to refresh subscription.");
        }

        if (!isMounted) return;

        setMessage("Payment successful. Your subscription has been updated.");
      } catch (err) {
        console.error(err);
        if (!isMounted) return;

        setMessage(
          "Payment received. Subscription will update shortly."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    refreshSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6 text-center">
        <div className="text-2xl font-bold text-emerald-600 mb-2">
          Payment Successful
        </div>

        <div className="text-sm text-slate-600 mb-4">
          {loading ? "Processing..." : message}
        </div>

        <button
          onClick={() => (window.location.href = "/")}
          className="mt-4 w-full rounded-lg bg-emerald-600 text-white py-2 font-semibold hover:bg-emerald-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}