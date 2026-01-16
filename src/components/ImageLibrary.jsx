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
  const [selectedIds, setSelectedIds] = useState([]); // selected image ids
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusText, setStatusText] = useState("");

  const token = getToken();
  const fileInputRef = useRef(null);

  // ✅ Load user's images when modal opens
  useEffect(() => {
    if (!visible) return;

    const load = async () => {
      try {
        setLoading(true);
        setStatusText("Loading images...");

        const res = await fetch(`${API_URL}/images`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to load images");
        }

        const data = await res.json();
        const mapped = (data || []).map((r) => ({
          id: r.id,
          src: r.url,
          public_id: r.public_id,
        }));

        setImages(mapped);
        setSelectedIds([]);
        setStatusText("");
      } catch (e) {
        console.error(e);
        setStatusText(`Error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible, token]);

  // ✅ Sequential upload
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setUploading(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusText(`Uploading ${i + 1} / ${files.length}...`);

        const form = new FormData();
        form.append("file", file);

        const res = await fetch(`${API_URL}/images/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Upload failed");
        }

        const saved = await res.json();

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ Click to select (shift-click adds/removes)
  const toggleSelect = (id, shiftKey) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (shiftKey) {
        // multi select toggle
        return exists ? prev.filter((x) => x !== id) : [...prev, id];
      }
      // single select
      return exists ? [] : [id];
    });
  };

  // ✅ Delete selected
  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;

    const ok = window.confirm(
      `Delete ${selectedIds.length} image(s)? This cannot be undone.`
    );
    if (!ok) return;

    try {
      setDeleting(true);
      setStatusText(`Deleting ${selectedIds.length}...`);

      // delete sequentially (simple + reliable)
      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i];
        setStatusText(`Deleting ${i + 1} / ${selectedIds.length}...`);

        const res = await fetch(`${API_URL}/images/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Delete failed");
        }
      }

      // remove locally
      setImages((prev) => prev.filter((img) => !selectedIds.includes(img.id)));
      setSelectedIds([]);

      setStatusText("✅ Deleted");
      setTimeout(() => setStatusText(""), 1200);
    } catch (err) {
      console.error(err);
      setStatusText(`Error: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!visible) return null;

  const busy = loading || uploading || deleting;

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
          {(busy || statusText) && (
            <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.9 }}>
              {statusText ||
                (loading ? "Loading..." : uploading ? "Uploading..." : deleting ? "Deleting..." : "")}
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
        {/* Upload + Delete bar */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={busy}
            style={{ cursor: busy ? "not-allowed" : "pointer" }}
          />

          <button
            onClick={handleDeleteSelected}
            disabled={busy || selectedIds.length === 0}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: selectedIds.length ? "#ef4444" : "#e5e7eb",
              color: selectedIds.length ? "white" : "#6b7280",
              cursor: busy || !selectedIds.length ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            Delete Selected ({selectedIds.length})
          </button>
        </div>

        {/* IMAGE GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, 70px)",
            gap: "12px",
          }}
        >
          {images.map((img) => {
            const selected = selectedIds.includes(img.id);
            return (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => onDragStartImage(e, img)}
                onClick={(e) => toggleSelect(img.id, e.shiftKey)}
                style={{
                  width: 70,
                  height: 70,
                  border: selected ? "2px solid #2563eb" : "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: selected ? "rgba(37,99,235,0.08)" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
                title={img.public_id || ""}
              >
                <img
                  src={img.src}
                  style={{ width: 70, height: 70, objectFit: "contain" }}
                  draggable={false}
                />
              </div>
            );
          })}
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
