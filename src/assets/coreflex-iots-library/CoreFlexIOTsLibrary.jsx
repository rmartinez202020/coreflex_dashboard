import React from "react";
import "./CoreFlexIOTsLibrary.css";

// Auto-import ALL files inside your folder
const images = import.meta.glob(
  "/src/assets/coreflex-iots-library/*.{png,jpg,jpeg,svg,gif}",
  { eager: true }
);

// Convert Vite glob result into clean array of image URLs
const imageList = Object.keys(images).map((key) => ({
  src: images[key].default || images[key],
  name: key.split("/").pop(),
}));

export default function CoreFlexIOTsLibrary({
  onSelect,
  onDragStart,

  // 🔒 INTERNAL ONLY (no UI)
  pickTarget = "off", // "off" | "on"
  pickTankId = null,

  // Parent may or may not provide this:
  onRequestClose,
}) {
  const safeWhich = pickTarget === "on" ? "on" : "off";

  const requestGlobalClose = React.useCallback(() => {
    // ✅ This is the important part:
    // The window that renders the Library should listen to this and close itself.
    window.dispatchEvent(
      new CustomEvent("coreflex-close-iots-library", {
        detail: {
          tankId: pickTankId,
          which: safeWhich,
          reason: "picked",
        },
      })
    );

    // (Extra compatibility: if you had older listener names)
    window.dispatchEvent(
      new CustomEvent("coreflex-iots-library-request-close", {
        detail: {
          tankId: pickTankId,
          which: safeWhich,
          reason: "picked",
        },
      })
    );
  }, [pickTankId, safeWhich]);

  const handlePick = (url) => {
    // Optional: legacy usage
    onSelect?.(url);

    // 🔥 Dispatch selected image
    window.dispatchEvent(
      new CustomEvent("coreflex-iots-library-selected", {
        detail: {
          url,
          which: safeWhich,
          tankId: pickTankId,
        },
      })
    );

    // ✅ CLOSE RIGHT AFTER PICK
    requestGlobalClose();

    // ✅ ALSO call direct close callback if parent wired it
    // (Run next tick so selection handlers finish first)
    setTimeout(() => {
      onRequestClose?.();
    }, 0);
  };

  return (
    <div
      className="cf-library-container"
      onMouseDown={(e) => e.stopPropagation()} // prevent canvas interaction
    >
      <h4 className="cf-library-title">CoreFlex IOTs Library</h4>

      <div className="cf-library-grid">
        {imageList.map((img, index) => (
          <div
            key={index}
            className="cf-library-thumb"
            draggable
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handlePick(img.src);
            }}
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData("coreflex-image", img.src);
              onDragStart?.(img.src);
            }}
            title="Click to select image"
          >
            <img src={img.src} alt={img.name} draggable={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
