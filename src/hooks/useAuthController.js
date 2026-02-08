// src/hooks/useAuthController.js
import { useCallback, useEffect, useRef, useState } from "react";
import { getUserKeyFromToken, getToken, clearAuth } from "../utils/authToken";

/**
 * useAuthController
 * - Owns currentUserKey derived from JWT (sessionStorage per-tab)
 * - Keeps app state in sync when token/user changes
 * - Provides a single logout handler
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

  // ✅ prevent stale closure issues
  const currentUserKeyRef = useRef(currentUserKey);
  useEffect(() => {
    currentUserKeyRef.current = currentUserKey;
  }, [currentUserKey]);

  const syncUserFromToken = useCallback(() => {
    const token = getToken();
    const newUserKey = getUserKeyFromToken();

    // ✅ no token => logged out
    if (!token || !newUserKey) {
      if (currentUserKeyRef.current !== null) {
        setCurrentUserKey(null);
        onNoAuthReset?.();
      }
      return;
    }

    // ✅ user changed => reset tenant state
    if (newUserKey !== currentUserKeyRef.current) {
      const old = currentUserKeyRef.current;
      setCurrentUserKey(newUserKey);
      onUserChangedReset?.(newUserKey, old);
    }
  }, [onNoAuthReset, onUserChangedReset]);

  useEffect(() => {
    // Initial sync
    syncUserFromToken();

    // ✅ Your event bus (same tab)
    window.addEventListener("coreflex-auth-changed", syncUserFromToken);

    // ✅ When user switches tabs / returns to tab, re-check token + identity
    const onVis = () => {
      if (document.visibilityState === "visible") syncUserFromToken();
    };
    const onFocus = () => syncUserFromToken();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("coreflex-auth-changed", syncUserFromToken);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [syncUserFromToken]);

  const handleLogout = useCallback(() => {
    // 1) clear per-tab auth
    clearAuth();
    setCurrentUserKey(null);

    // 2) reset app UI state
    onLogoutReset?.();

    // 3) notify listeners (same tab)
    window.dispatchEvent(new Event("coreflex-auth-changed"));

    // 4) try soft navigation
    try {
      if (navigate) navigate(logoutRoute, { replace: true });
    } catch {
      // ignore
    }

    // 5) hard redirect
    window.location.assign(logoutRoute);
  }, [navigate, logoutRoute, onLogoutReset]);

  return {
    currentUserKey,
    setCurrentUserKey,
    handleLogout,
    syncUserFromToken,
  };
}
