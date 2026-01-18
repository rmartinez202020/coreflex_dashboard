import React from "react";
import "../assets/coreflex-iots-library/CoreFlexIOTsLibrary.css";

const images = import.meta.glob(
  "../assets/hmi-symbols/*.{png,jpg,jpeg,svg,gif}",
  { eager: true }
);

const imageList = Object.keys(images).map((key) => ({
  src: images[key].default || images[key],
  name: key.split("/").pop(),
}));

export default function HmiSymbolsLibraryGrid({ onSelect, onDragStart }) {
  return (
    <div className="cf-library-container" onMouseDown={(e) => e.stopPropagation()}>
      <h4 className="cf-library-title">HMI Symbols</h4>

      {imageList.length === 0 ? (
        <div className="text-gray-500 text-sm p-3">
          No HMI images found. Check: <b>src/assets/hmi-symbols</b>
        </div>
      ) : (
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
      )}
    </div>
  );
}
