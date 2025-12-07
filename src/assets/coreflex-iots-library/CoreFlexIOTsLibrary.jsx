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

export default function CoreFlexIOTsLibrary({ onSelect, onDragStart }) {
  return (
    <div
      className="cf-library-container"
      onMouseDown={(e) => e.stopPropagation()}  // ⭐ FIX: prevent canvas interaction
    >
      <h4 className="cf-library-title">CoreFlex IOTs Library</h4>

      <div className="cf-library-grid">
        {imageList.map((img, index) => (
          <div
            key={index}
            className="cf-library-thumb"
            draggable
            onMouseDown={(e) => e.stopPropagation()}  // ⭐ FIX: prevents dragging-window interference
            onClick={(e) => {
              e.stopPropagation();                   // ⭐ FIX
              onSelect(img.src);
            }}
            onDragStart={(e) => {
              e.stopPropagation();                   // ⭐ FIX: prevents canvas drag hijacking
              e.dataTransfer.setData("coreflex-image", img.src);
              if (onDragStart) onDragStart(img.src);
            }}
          >
            <img src={img.src} alt={img.name} draggable={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
