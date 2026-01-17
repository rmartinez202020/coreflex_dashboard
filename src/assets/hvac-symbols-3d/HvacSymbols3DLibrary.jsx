import React from "react";
import "../coreflex-iots-library/CoreFlexIOTsLibrary.css";


const images = import.meta.glob(
  "/src/assets/hvac-symbols-3d/*.{png,jpg,jpeg,svg,gif}",
  { eager: true }
);

const imageList = Object.keys(images).map((key) => ({
  src: images[key].default || images[key],
  name: key.split("/").pop(),
}));

export default function HvacSymbols3DLibrary({ onSelect, onDragStart }) {
  return (
    <div className="cf-library-container" onMouseDown={(e) => e.stopPropagation()}>
      <h4 className="cf-library-title">HVAC Symbols 3D</h4>

      <div className="cf-library-grid">
        {imageList.map((img, index) => (
          <div
            key={index}
            className="cf-library-thumb"
            draggable
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(img.src);
            }}
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData("coreflex-image", img.src);
              e.dataTransfer.setData("imageUrl", img.src);
              onDragStart?.(img.src);
            }}
          >
            <img src={img.src} alt={img.name} draggable={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
