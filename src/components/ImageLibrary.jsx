import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [deleting, setDeleting] = useState(false);
  const [statusText, setStatusText] = useState("");

  // ✅ Multi-select
  const [selectedIds, setSelectedIds] = useState([]); // array of imageAsset.id
  const lastClickedIndexRef = useRef(null);

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
        setSelectedIds([]); // reset selection on open
        lastClickedIndexRef.current = null;
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

  // ✅ Multi-select click handling (toggle + shift range)
  const handleClickImage = (e, imgId, index) => {
    e.preventDefault();
    e.stopPropagation();

    const isShift = e.shiftKey;
    const isToggleKey = e.ctrlKey || e.metaKey; // ctrl on Windows/Linux, cmd on Mac

    // If shift-click and we have an anchor, select range
    if (isShift && lastClickedIndexRef.current !== null) {
      const start = Math.min(lastClickedIndexRef.current, index);
      const end = Math.max(lastClickedIndexRef.current, index);

      const rangeIds = images.slice(start, end + 1).map((x) => x.id);

      // If toggle key also pressed, we "add range"
      // Otherwise, we replace selection with range (common UX)
      setSelectedIds((prev) => {
        if (isToggleKey) {
          const set = new Set(prev);
          rangeIds.forEach((id) => set.add(id));
          return Array.from(set);
        }
        return rangeIds;
      });

      return;
    }

    // Normal click (or ctrl/cmd click): toggle selection
    setSelectedIds((prev) => {
      const exists = prev.includes(imgId);
      if (exists) return prev.filter((id) => id !== imgId);

      // If user did NOT hold ctrl/cmd, many apps replace selection with single.
      // But you asked for multi selection, so we keep "toggle" as default.
      return [...prev, imgId];
    });

    lastClickedIndexRef.current = index;
  };

  // ✅ Delete selected (calls backend per image)
  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;

    // confirm once
    const ok = window.confirm(
      `Delete ${selectedIds.length} image(s) from your library?`
    );
    if (!ok) return;

    try {
      setDeleting(true);
      setStatusText(`Deleting ${selectedIds.length}...`);

      // delete sequential to be safe with rate limits
      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i];
        setStatusText(`Deleting ${i + 1} / ${selectedIds.length}...`);

        const res = await fetch(`${API_URL}/images/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Delete failed for image ${id}`);
        }
      }

      // update UI
      setImages((prev) => prev.filter((img) => !selectedIds.includes(img.id)));
      setSelectedIds([]);
      lastClickedIndexRef.current = null;

      setStatusText("✅ Deleted");
      setTimeout(() => setStatusText(""), 1200);
    } catch (err) {
      console.error(err);
      setStatusText(`Error: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    lastClickedIndexRef.current = null;
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
                (loading
                  ? "Loading..."
                  : uploading
                  ? "Uploading..."
                  : deleting
                  ? "Deleting..."
                  : "")}
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

      {/* TOOLBAR */}
      <div
        style={{
          padding: "8px 10px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading || deleting}
          style={{
            cursor: uploading || deleting ? "not-allowed" : "pointer",
          }}
        />

        <button
          onClick={handleDeleteSelected}
          disabled={!selectedIds.length || busy}
          style={{
            padding: "7px 12px",
            borderRadius: 8,
            border: "1px solid #ef4444",
            background: selectedIds.length ? "#ef4444" : "#fee2e2",
            color: selectedIds.length ? "white" : "#991b1b",
            cursor: !selectedIds.length || busy ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
          title="Delete selected images"
        >
          Delete Selected ({selectedIds.length})
        </button>

        <button
          onClick={clearSelection}
          disabled={!selectedIds.length || busy}
          style={{
            padding: "7px 12px",
            borderRadius: 8,
            border: "1px solid #64748b",
            background: "white",
            color: "#0f172a",
            cursor: !selectedIds.length || busy ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
          title="Clear selection"
        >
          Clear
        </button>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#334155" }}>
          Tip: click to multi-select, Shift+click for range
        </div>
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
        {/* IMAGE GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, 70px)",
            gap: "12px",
          }}
        >
          {images.map((img, index) => {
            const selected = selectedIds.includes(img.id);

            return (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => onDragStartImage(e, img)}
                onClick={(e) => handleClickImage(e, img.id, index)}
                style={{
                  width: 70,
                  height: 70,
                  border: selected ? "2px solid #2563eb" : "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: selected ? "#eff6ff" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: selected ? "0 0 0 2px rgba(37,99,235,0.25)" : "none",
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
