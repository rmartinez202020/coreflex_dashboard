// src/hooks/useAuthController.js
import { useCallback, useEffect, useRef, useState } from "react";
import { getUserKeyFromToken, getToken, clearAuth } from "../utils/authToken";

/**
 * useAuthController
 * - Owns currentUserKey derived from JWT
 * - Keeps app state in sync when token/user changes
 * - Provides a single logout handler
 *
 * App provides:
 * - onNoAuthReset(): called when token is missing/invalid (full reset to guest state)
 * - onUserChangedReset(newUserKey, oldUserKey): called when user changes (reset dashboard state)
 * - onLogoutReset(): called after logout (cleanup + state reset)
 * - navigate: react-router navigate fn
 * - logoutRoute: route to go after logout (default "/")
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

  // ✅ prevent stale closure issues in event listener
  const currentUserKeyRef = useRef(currentUserKey);
  useEffect(() => {
    currentUserKeyRef.current = currentUserKey;
  }, [currentUserKey]);

  const syncUserFromToken = useCallback(() => {
    const newUserKey = getUserKeyFromToken();
    const token = getToken();

    // No token/user -> become logged out + reset app state
    if (!token || !newUserKey) {
      setCurrentUserKey(null);
      onNoAuthReset?.();
      return;
    }

    // User changed -> reset app state for new tenant
    if (newUserKey !== currentUserKeyRef.current) {
      const old = currentUserKeyRef.current;
      setCurrentUserKey(newUserKey);
      onUserChangedReset?.(newUserKey, old);
    }
  }, [onNoAuthReset, onUserChangedReset]);

  useEffect(() => {
    // Initial sync
    syncUserFromToken();

    // Listen for auth changes (your existing event bus)
    window.addEventListener("coreflex-auth-changed", syncUserFromToken);
    return () => {
      window.removeEventListener("coreflex-auth-changed", syncUserFromToken);
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

    // 4) try soft navigation (nice)
    try {
      if (navigate) navigate(logoutRoute, { replace: true });
    } catch {
      // ignore
    }

    // 5) ✅ HARD redirect (guaranteed to leave /app and go to login)
    window.location.assign(logoutRoute);
  }, [navigate, logoutRoute, onLogoutReset]);

  return {
    currentUserKey,
    setCurrentUserKey, // optional escape hatch (rarely needed)
    handleLogout,
    syncUserFromToken, // optional (rarely needed)
  };
}
