// src/components/Header.jsx
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../config/api";
import { getToken, parseJwt } from "../utils/authToken";

/**
 * Header
 * - Displays active subscription plan badge
 * - Displays welcome message (name + email)
 * - Displays Logout button
 * - Pure UI component (no routing logic)
 *
 * ✅ IMPORTANT:
 * - Must read auth from sessionStorage per-tab via getToken()
 * - Never use localStorage for identity (cross-tab pollution)
 * - Subscription plan comes from backend: GET /subscription/me
 */

const PLAN_LABELS = {
  free: "FREE",
  starter: "STARTER",
  professional: "PROFESSIONAL",
  industrial: "INDUSTRIAL",
  enterprise: "ENTERPRISE",
};

export default function Header({ onLogout }) {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Active subscription plan returned by /subscription/me
  const [subscriptionPlan, setSubscriptionPlan] = useState("");

  const toNiceName = (email) =>
    (email || "")
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const syncFromToken = useCallback(() => {
    const token = getToken(); // ✅ per-tab token (sessionStorage-first)

    if (!token) {
      setUserEmail("");
      setUserName("");
      return;
    }

    const payload = parseJwt(token); // ✅ already base64url-safe in your util

    if (!payload) {
      setUserEmail("");
      setUserName("");
      return;
    }

    // Try several common fields
    const email =
      payload.email ||
      payload.user?.email ||
      (typeof payload.sub === "string" && payload.sub.includes("@")
        ? payload.sub
        : "") ||
      payload.username ||
      "";

    const name =
      payload.name ||
      payload.full_name ||
      payload.user?.name ||
      payload.user?.full_name ||
      toNiceName(email);

    setUserEmail(String(email || "").trim());
    setUserName(String(name || "").trim());
  }, []);

  /**
   * Load the authenticated user's active subscription.
   *
   * IMPORTANT:
   * - Uses the same backend source as My Subscription.
   * - Does NOT guess "free" if the request fails.
   * - Badge remains hidden until a valid plan_key is returned.
   */
  const loadSubscription = useCallback(async () => {
    const token = String(getToken() || "").trim();

    if (!token) {
      setSubscriptionPlan("");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/subscription/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubscriptionPlan("");
        return;
      }

      const planKey = String(data?.plan_key || "")
        .trim()
        .toLowerCase();

      // Only display known subscription plans.
      if (Object.prototype.hasOwnProperty.call(PLAN_LABELS, planKey)) {
        setSubscriptionPlan(planKey);
      } else {
        setSubscriptionPlan("");
      }
    } catch (error) {
      // Do not display an incorrect subscription if backend is unavailable.
      setSubscriptionPlan("");
    }
  }, []);

  useEffect(() => {
    // Initial load
    syncFromToken();
    loadSubscription();

    // Auth event (same tab)
    const onAuthChanged = () => {
      syncFromToken();
      loadSubscription();
    };

    window.addEventListener("coreflex-auth-changed", onAuthChanged);

    // ✅ Resync when returning to tab.
    // This also refreshes the subscription badge in case the user
    // upgraded/downgraded while another page/tab was open.
    const onVis = () => {
      if (document.visibilityState === "visible") {
        syncFromToken();
        loadSubscription();
      }
    };

    const onFocus = () => {
      syncFromToken();
      loadSubscription();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("coreflex-auth-changed", onAuthChanged);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [syncFromToken, loadSubscription]);

  const subscriptionLabel = subscriptionPlan
    ? PLAN_LABELS[subscriptionPlan]
    : "";

  return (
    // ✅ Smaller header block (tighter spacing + smaller fonts + smaller button)
    <header className="absolute top-2 right-3 flex items-center gap-3">

      {/* ============================================= */}
      {/* ACTIVE SUBSCRIPTION BADGE                     */}
      {/* ============================================= */}
      {subscriptionLabel && (
        <div
          title={`Current subscription: ${subscriptionLabel}`}
          className="
            flex
            items-center
            justify-center
            min-w-[92px]
            h-[28px]
            px-3
            rounded-md
            border
            border-emerald-300
            bg-emerald-50
            text-emerald-700
            text-[10.5px]
            font-bold
            tracking-wide
            shadow-sm
            whitespace-nowrap
          "
        >
          {subscriptionLabel}
        </div>
      )}

      {/* ============================================= */}
      {/* USER INFORMATION                              */}
      {/* ============================================= */}
      <div className="text-right leading-tight">
        <div className="text-gray-800 font-medium text-[12.5px]">
          Welcome, {userName || "User"}
        </div>

        <div className="text-gray-500 text-[11px]">
          {userEmail || ""}
        </div>
      </div>

      {/* ============================================= */}
      {/* LOGOUT                                        */}
      {/* ============================================= */}
      <button
        type="button"
        onClick={onLogout}
        className="
          px-2.5
          py-1
          rounded-md
          text-[12px]
          bg-red-600
          text-white
          hover:bg-red-700
          shadow-sm
        "
      >
        Logout
      </button>
    </header>
  );
}