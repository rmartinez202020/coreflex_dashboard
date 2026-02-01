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

  // ✅ NEW: if the library is opened as a picker for StateImage modal
  // "off" | "on" (default off)
  pickTarget = "off",

  // ✅ NEW: when opened as a picker, include tankId so App can patch correct object
  pickTankId = null,

  // ✅ optional: close the library after picking
  onRequestClose,

  // ✅ NEW: UI-only preview fit for thumbnails inside the library
  // (does NOT change your canvas imageFit automatically)
  defaultPreviewFit = "contain",
}) {
  const safeWhich = pickTarget === "on" ? "on" : "off";

  // ✅ thumb preview fit (library UI)
  const [previewFit, setPreviewFit] = React.useState(
    defaultPreviewFit || "contain"
  );

  React.useEffect(() => {
    setPreviewFit(defaultPreviewFit || "contain");
  }, [defaultPreviewFit]);

  const FIT_OPTIONS = [
    { id: "contain", label: "Contain" },
    { id: "cover", label: "Cover" },
    { id: "fill", label: "Fill" },
    { id: "none", label: "None" },
    { id: "scale-down", label: "Scale-down" },
  ];

  const handlePick = (url) => {
    // ✅ 1) keep existing behavior (useful for inserting onto canvas)
    onSelect?.(url);

    // ✅ 2) ALSO notify App.jsx / modals (StateImage OFF/ON picker)
    window.dispatchEvent(
      new CustomEvent("coreflex-iots-library-selected", {
        detail: {
          url,
          which: safeWhich,
          tankId: pickTankId, // ✅ IMPORTANT
        },
      })
    );

    // ✅ 3) optional close
    onRequestClose?.();
  };

  const Pill = ({ children }) => (
    <span
      style={{
        fontSize: 12,
        fontWeight: 900,
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(15, 23, 42, 0.08)",
        color: "#0f172a",
        border: "1px solid rgba(15, 23, 42, 0.12)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </span>
  );

  return (
    <div
      className="cf-library-container"
      onMouseDown={(e) => e.stopPropagation()} // ⭐ FIX: prevent canvas interaction
    >
      {/* ✅ Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <h4 className="cf-library-title" style={{ margin: 0 }}>
          IOTs Library
        </h4>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Pill>
            picking: <b>{safeWhich.toUpperCase()}</b>
            {pickTankId ? (
              <span style={{ opacity: 0.7 }}>#{String(pickTankId)}</span>
            ) : null}
          </Pill>
        </div>
      </div>

      {/* ✅ Preview Fit controls (library UI only) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 900, color: "#475569" }}>
          Preview Fit:
        </span>

        {FIT_OPTIONS.map((o) => {
          const sel = previewFit === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setPreviewFit(o.id)}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: sel ? "2px solid #22c55e" : "1px solid #e5e7eb",
                background: sel ? "#ecfdf5" : "white",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 12,
                color: "#0f172a",
              }}
              title={`Preview: ${o.label}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="cf-library-grid">
        {imageList.map((img, index) => (
          <div
            key={index}
            className="cf-library-thumb"
            draggable
            onMouseDown={(e) => e.stopPropagation()} // ⭐ FIX: prevents dragging-window interference
            onClick={(e) => {
              e.stopPropagation(); // ⭐ FIX
              handlePick(img.src);
            }}
            onDragStart={(e) => {
              e.stopPropagation(); // ⭐ FIX: prevents canvas drag hijacking
              e.dataTransfer.setData("coreflex-image", img.src);
              if (onDragStart) onDragStart(img.src);
            }}
            title={`Click to set ${safeWhich.toUpperCase()} image`}
            style={{
              // ✅ keeps your existing CSS layout but lets us control img fit visually
              overflow: "hidden",
            }}
          >
            <img
              src={img.src}
              alt={img.name}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: previewFit, // ✅ preview fit options
                display: "block",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
