import React, { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

export default function BillingSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Finalizing your subscription...");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function refreshSubscription() {
      try {
        const token = String(getToken() || "").trim();

        console.log("SUCCESS PAGE LOADED");
        console.log("Token:", token);

        // 🔴 If no token, still show success (do NOT break page)
        if (!token) {
          console.warn("No token found, skipping refresh");
          if (isMounted) {
            setMessage("Payment successful. Please log in to see updates.");
          }
          return;
        }

        const res = await fetch(`${API_URL}/subscription/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Subscription refresh status:", res.status);

        if (!res.ok) {
          throw new Error("Failed to refresh subscription.");
        }

        const data = await res.json().catch(() => ({}));
        console.log("Subscription data:", data);

        if (!isMounted) return;

        setMessage("Payment successful. Your subscription has been updated.");
      } catch (err) {
        console.error("Success page error:", err);

        if (!isMounted) return;

        setError(err?.message || "Unknown error");
        setMessage("Payment received. Subscription will update shortly.");
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
          ✅ Payment Successful
        </div>

        <div className="text-sm text-slate-600 mb-4">
          {loading ? "Processing..." : message}
        </div>

        {/* 🔍 Debug info (temporary, remove later) */}
        {error && (
          <div className="text-xs text-red-500 mb-2">
            {error}
          </div>
        )}

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