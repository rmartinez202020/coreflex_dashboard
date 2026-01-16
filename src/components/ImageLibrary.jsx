import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

export default function ImageLibrary({
  visible,
  position,
  size,
  onClose,
  onDragStartImage,
  onStartDragWindow,
  onStartResizeWindow,
}) {
  const [images, setImages] = useState([]); // { id, src, public_id }
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const fileInputRef = useRef(null);

  // ✅ Load user's images when modal opens
  useEffect(() => {
    if (!visible) return;

    const load = async () => {
      const token = getToken();

      try {
        if (!token) {
          throw new Error("No auth token. Please login again.");
        }

        setLoading(true);
        setStatusText("Loading images...");

        const res = await fetch(`${API_URL}/images`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to load images");
        }

        const data = await res.json();

        // backend returns [{id,url,public_id,...}]
        const mapped = (data || []).map((r) => ({
          id: r.id,
          src: r.url,
          public_id: r.public_id,
        }));

        setImages(mapped);
        setStatusText("");
      } catch (e) {
        console.error(e);
        setStatusText(`Error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible]);

  // ✅ Sequential upload: prevents “only some saved”
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const token = getToken();

    try {
      if (!token) {
        throw new Error("No auth token. Please login again.");
      }

      setUploading(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusText(`Uploading ${i + 1} / ${files.length}...`);

        const form = new FormData();
        form.append("file", file);

        const res = await fetch(`${API_URL}/images/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Upload failed");
        }

        const saved = await res.json();
        // saved: {id,url,public_id,...}

        setImages((prev) => [
          { id: saved.id, src: saved.url, public_id: saved.public_id },
          ...prev,
        ]);
      }

      setStatusText("✅ Upload complete");
      setTimeout(() => setStatusText(""), 1200);
    } catch (err) {
      console.error(err);
      setStatusText(`Error: ${err.message}`);
    } finally {
      setUploading(false);
      // Reset file input so selecting same file again triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>Image Library</span>
          {(loading || uploading || statusText) && (
            <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.9 }}>
              {statusText ||
                (loading ? "Loading..." : uploading ? "Uploading..." : "")}
            </span>
          )}
        </div>

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
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading || loading}
          style={{
            marginBottom: 12,
            cursor: uploading || loading ? "not-allowed" : "pointer",
          }}
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
              title={img.public_id || ""}
            >
              <img
                src={img.src}
                style={{
                  width: 70,
                  height: 70,
                  objectFit: "contain",
                }}
                draggable={false}
                alt=""
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
