// src/hooks/usePageNavigation.js
import { useEffect, useState } from "react";

/**
 * usePageNavigation
 * - Owns activePage + activeSubPage + subPageColor
 * - Persists activePage in localStorage
 */
export default function usePageNavigation(storageKey = "coreflex_activePage") {
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem(storageKey) || "home";
  });

  const [activeSubPage, setActiveSubPage] = useState(null);
  const [subPageColor, setSubPageColor] = useState("");

  // Persist activePage changes
  useEffect(() => {
    localStorage.setItem(storageKey, activePage);
  }, [activePage, storageKey]);

  return {
    activePage,
    setActivePage,
    activeSubPage,
    setActiveSubPage,
    subPageColor,
    setSubPageColor,
  };
}
