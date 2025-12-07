export default function ImageLibrary({
  visible,
  position,
  size,
  images,
  onClose,
  onUpload,
  onDragStartImage,
  onStartDragWindow,
  onStartResizeWindow,
}) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        background: "white",
        color: "black",
        border: "2px solid #1e293b",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.55)",
        zIndex: 999999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div
        style={{
          height: 40,
          background: "#0f172a",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          fontWeight: "bold",
          cursor: "grab",
          userSelect: "none",
        }}
        onMouseDown={(e) => onStartDragWindow(e)}
      >
        Image Library
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* CONTENT */}
      <div
        style={{
          flex: 1,
          padding: "10px",
          overflowY: "auto",
          background: "white",
        }}
      >
        {/* Upload Button */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onUpload}
          style={{ marginBottom: 12, cursor: "pointer" }}
        />

        {/* IMAGE GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, 70px)",
            gap: "12px",
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={(e) => onDragStartImage(e, img)}
              style={{
                width: 70,
                height: 70,
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
              }}
            >
              <img
                src={img.src}
                style={{
                  width: 70,
                  height: 70,
                  objectFit: "contain",
                }}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* RESIZE HANDLE */}
      <div
        style={{
          width: 16,
          height: 16,
          position: "absolute",
          right: 0,
          bottom: 0,
          background: "#2563eb",
          cursor: "nwse-resize",
          borderTopLeftRadius: 6,
        }}
        onMouseDown={(e) => onStartResizeWindow(e)}
      />
    </div>
  );
}
