// src/hooks/useAuthController.js
import { useCallback, useEffect, useState } from "react";
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
    if (newUserKey !== currentUserKey) {
      const old = currentUserKey;
      setCurrentUserKey(newUserKey);
      onUserChangedReset?.(newUserKey, old);
    }
  }, [currentUserKey, onNoAuthReset, onUserChangedReset]);

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
    clearAuth(); // clears token
    setCurrentUserKey(null);

    onLogoutReset?.();

    // keep other listeners in sync
    window.dispatchEvent(new Event("coreflex-auth-changed"));

    if (navigate) navigate(logoutRoute);
  }, [navigate, logoutRoute, onLogoutReset]);

  return {
    currentUserKey,
    setCurrentUserKey, // optional escape hatch (rarely needed)
    handleLogout,
    syncUserFromToken, // optional (rarely needed)
  };
}
