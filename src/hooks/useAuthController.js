// src/hooks/useAuthController.js
import { useCallback, useEffect, useRef, useState } from "react";
import { getUserKeyFromToken, getToken, clearAuth } from "../utils/authToken";

/**
 * useAuthController
 * - Owns currentUserKey derived from JWT
 * - Keeps app state in sync when token/user changes
 * - Provides a single logout handler
 *
 * Key fixes:
 * ✅ Sync on tab focus / visibility change (multi-tab stability)
 * ✅ Listen to storage changes (other tabs touching localStorage)
 */
export default function useAuthController({
  onNoAuthReset,
  onUserChangedReset,
  onLogoutReset,
  navigate,
  logoutRoute = "/",
} = {}) {
  const [currentUserKey, setCurrentUserKey] = useState(() =>
    getUserKeyFromToken()
  );

  // ✅ prevent stale closure issues in event listeners
  const currentUserKeyRef = useRef(currentUserKey);
  useEffect(() => {
    currentUserKeyRef.current = currentUserKey;
  }, [currentUserKey]);

  // ✅ prevent duplicate resets spam
  const lastResetRef = useRef({ reason: "", at: 0 });

  const safeResetNoAuth = useCallback(() => {
    // avoid hammering resets if multiple events fire at once
    const now = Date.now();
    const last = lastResetRef.current;
    if (last.reason === "noauth" && now - last.at < 250) return;
    lastResetRef.current = { reason: "noauth", at: now };

    setCurrentUserKey(null);
    onNoAuthReset?.();
  }, [onNoAuthReset]);

  const syncUserFromToken = useCallback(() => {
    const token = getToken();
    const newUserKey = getUserKeyFromToken(token); // ✅ decode the SAME token we use

    // No token/user -> become logged out + reset app state
    if (!token || !newUserKey) {
      // only reset if we currently think we’re logged in
      if (currentUserKeyRef.current) safeResetNoAuth();
      return;
    }

    // User changed -> reset app state for new tenant
    if (newUserKey !== currentUserKeyRef.current) {
      const old = currentUserKeyRef.current;
      setCurrentUserKey(newUserKey);
      onUserChangedReset?.(newUserKey, old);
      return;
    }

    // If same user, still ensure state is set (edge cases)
    if (!currentUserKeyRef.current) {
      setCurrentUserKey(newUserKey);
    }
  }, [onUserChangedReset, safeResetNoAuth]);

  useEffect(() => {
    // Initial sync
    syncUserFromToken();

    // 1) Existing internal event bus
    window.addEventListener("coreflex-auth-changed", syncUserFromToken);

    // 2) ✅ Multi-tab: other tab writes to localStorage -> this tab can react
    // NOTE: 'storage' does NOT fire for sessionStorage; it fires for localStorage changes from other tabs.
    const onStorage = (e) => {
      const k = e?.key || "";
      // react only to auth-ish keys (avoid noisy refreshes)
      const looksAuthy =
        k.includes("token") ||
        k.includes("jwt") ||
        k.includes("coreflex_access_token") ||
        k.includes("coreflex_logged_in") ||
        k.includes("coreflex_user_email");

      if (!k || looksAuthy) {
        syncUserFromToken();
      }
    };
    window.addEventListener("storage", onStorage);

    // 3) ✅ When user comes back to this tab, re-sync from THIS tab’s token
    const onFocus = () => syncUserFromToken();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncUserFromToken();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("coreflex-auth-changed", syncUserFromToken);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncUserFromToken]);

  const handleLogout = useCallback(() => {
    // 1) clear token
    clearAuth();
    setCurrentUserKey(null);

    // 2) reset app UI state
    onLogoutReset?.();

    // 3) notify listeners
    window.dispatchEvent(new Event("coreflex-auth-changed"));

    // 4) try soft navigation
    try {
      if (navigate) navigate(logoutRoute, { replace: true });
    } catch {
      // ignore
    }

    // 5) ✅ HARD redirect
    window.location.assign(logoutRoute);
  }, [navigate, logoutRoute, onLogoutReset]);

  return {
    currentUserKey,
    setCurrentUserKey, // optional escape hatch (rarely needed)
    handleLogout,
    syncUserFromToken, // optional (rarely needed)
  };
}
