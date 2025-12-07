// src/hooks/useAlignmentGuides.js
import { useState } from "react";

export default function useAlignmentGuides() {
  const [guides, setGuides] = useState([]);

  const checkAlignment = (activeObj, allObjects) => {
    const tolerance = 10;
    const newGuides = [];

    const aBottom = activeObj.y + (activeObj.height || 0);

    allObjects.forEach((obj) => {
      if (obj.id === activeObj.id) return;

      const bBottom = obj.y + (obj.height || 0);

      // Show guide ONLY when very close
      if (Math.abs(aBottom - bBottom) <= tolerance) {
        newGuides.push({
          type: "horizontal",
          y: bBottom,
        });
      }
    });

    setGuides(newGuides);

    // ⭐ No snapping at all — ALWAYS return null
    return { x: null, y: null };
  };

  const clearGuides = () => setGuides([]);

  return { guides, checkAlignment, clearGuides };
}
