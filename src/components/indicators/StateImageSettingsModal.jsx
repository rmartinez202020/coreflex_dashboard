// StateImageSettingsModal.jsx
import React from "react";

export default function StateImageSettingsModal({
  open,
  tank,
  onClose,
  onSave,
  sensorsData,
}) {
  if (!open || !tank) return null;

  const p = tank.properties || {};

  // ✅ Modal sizing (clamped)
  const MODAL_W = Math.min(980, window.innerWidth - 80);
  const MODAL_H = Math.min(640, window.innerHeight - 120);

  // Tag binding (same pattern)
  const initialDeviceId = p?.tag?.deviceId ?? "";
  const initialField = p?.tag?.field ?? "";

  // Images
  const initialOffImage = p?.offImage ?? "";
  const initialOnImage = p?.onImage ?? "";

  // ✅ More fit options
  const initialFit = p?.imageFit ?? "contain"; // contain|cover|fill|none|scale-down

  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(initialField);
  const [tagSearch, setTagSearch] = React.useState("");

  const [offImage, setOffImage] = React.useState(initialOffImage);
  const [onImage, setOnImage] = React.useState(initialOnImage);
  const [imageFit, setImageFit] = React.useState(initialFit);

  // ✅ Track which slot we are choosing ("off" | "on")
  // (NO UI for this — just internal routing)
  const pickSlotRef = React.useRef(null);

  // =========================
  // DRAGGABLE WINDOW
  // =========================
  const modalRef = React.useRef(null);
  const dragRef = React.useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = React.useState(() => {
    const left = Math.max(20, Math.round((window.innerWidth - MODAL_W) / 2));
    const top = Math.max(20, Math.round((window.innerHeight - MODAL_H) / 2));
    return { left, top };
  });

  React.useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      e.preventDefault();

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      const nextLeft = dragRef.current.startLeft + dx;
      const nextTop = dragRef.current.startTop + dy;

      const rect = modalRef.current?.getBoundingClientRect();
      const mw = rect?.width ?? MODAL_W;
      const mh = rect?.height ?? MODAL_H;

      const clampedLeft = Math.min(
        window.innerWidth - 20,
        Math.max(20 - (mw - 60), nextLeft)
      );
      const clampedTop = Math.min(
        window.innerHeight - 20,
        Math.max(20, nextTop)
      );

      setPos({ left: clampedLeft, top: clampedTop });
    };

    const onUp = () => {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [MODAL_W, MODAL_H]);

  const startDrag = (e) => {
    if (e.button !== 0) return;
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  // =========================
  // DEVICES / FIELDS
  // =========================
  const devices = React.useMemo(() => {
    const d = sensorsData?.devices;
    return Array.isArray(d) ? d : [];
  }, [sensorsData]);

  const selectedDevice = React.useMemo(() => {
    return devices.find((d) => String(d.id) === String(deviceId)) || null;
  }, [devices, deviceId]);

  const availableFields = React.useMemo(() => {
    const raw = selectedDevice?.fields;
    if (!raw) return [];

    if (Array.isArray(raw) && typeof raw[0] === "string") {
      return raw.map((k) => ({ key: k, label: k }));
    }
    if (Array.isArray(raw) && typeof raw[0] === "object") {
      return raw
        .map((x) => ({
          key: x.key ?? x.field ?? x.name ?? "",
          label: x.label ?? x.name ?? x.field ?? x.key ?? "",
        }))
        .filter((x) => x.key);
    }
    return [];
  }, [selectedDevice]);

  const filteredFields = React.useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return availableFields;
    return availableFields.filter(
      (f) =>
        f.key.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)
    );
  }, [availableFields, tagSearch]);

  // =========================
  // IMAGE HELPERS
  // =========================
  const readAsDataURL = (file, cb) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const apply = () => {
    onSave?.({
      id: tank.id,
      properties: {
        ...(tank.properties || {}),
        offImage,
        onImage,
        imageFit, // contain|cover|fill|none|scale-down
        tag: { deviceId, field },
      },
    });
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
      {children}
    </div>
  );

  const ImgBox = ({ src, title }) => (
    <div
      style={{
        width: "100%",
        height: 150,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
      title={title}
    >
      {src ? (
        <img
          src={src}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: imageFit,
          }}
        />
      ) : (
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ fontWeight: 900 }}>{title}</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>No image selected</div>
        </div>
      )}
    </div>
  );

  // =========================
  // ✅ IOTs LIBRARY PICKER (EVENT-BASED) — NO UI LABELS
  // =========================
  const openIOTsLibrary = (which) => {
    const safeWhich = which === "on" ? "on" : "off";
    pickSlotRef.current = safeWhich;

    window.dispatchEvent(
      new CustomEvent("coreflex-open-iots-library", {
        detail: {
          mode: "pickImage",
          which: safeWhich, // off | on
          tankId: tank.id,
          from: "StateImageSettingsModal",
        },
      })
    );
  };

  React.useEffect(() => {
    const onSelected = (ev) => {
      const url = ev?.detail?.url;
      if (!url) return;

      // prefer event "which", fallback to last requested slot
      const which =
        ev?.detail?.which === "on" || ev?.detail?.which === "off"
          ? ev.detail.which
          : pickSlotRef.current || "off";

      if (which === "off") setOffImage(url);
      if (which === "on") setOnImage(url);

      pickSlotRef.current = null;
    };

    window.addEventListener("coreflex-iots-library-selected", onSelected);
    return () =>
      window.removeEventListener("coreflex-iots-library-selected", onSelected);
  }, []);

  const fitOptions = [
    { id: "contain", name: "Contain" },
    { id: "cover", name: "Cover" },
    { id: "fill", name: "Fill" },
    { id: "scale-down", name: "Scale Down" },
    { id: "none", name: "None" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
      onMouseDown={onClose}
    >
      <div
        ref={modalRef}
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: MODAL_W,
          maxWidth: "calc(100vw - 80px)",
          height: MODAL_H,
          maxHeight: "calc(100vh - 120px)",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          onMouseDown={startDrag}
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 900,
            fontSize: 16,
            cursor: "grab",
            flex: "0 0 auto",
          }}
          title="Drag to move"
        >
          <span>State Image</span>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
            }}
            title="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, overflow: "auto", flex: "1 1 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: 14,
              alignItems: "start",
            }}
          >
            {/* LEFT: OFF/ON image setup */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
                State Images (OFF / ON)
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {/* OFF */}
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 1000,
                      marginBottom: 8,
                    }}
                  >
                    OFF Image (default)
                  </div>

                  <ImgBox src={offImage} title="OFF" />

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <label
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      Upload OFF
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          readAsDataURL(f, setOffImage);
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => openIOTsLibrary("off")}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 1000,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                      title="Pick OFF image from CoreFlex IOTs Library"
                    >
                      IOTs Library OFF
                    </button>

                    <button
                      type="button"
                      onClick={() => setOffImage("")}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 13,
                      }}
                      title="Clear OFF image"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* ON */}
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 1000,
                      marginBottom: 8,
                    }}
                  >
                    ON Image
                  </div>

                  <ImgBox src={onImage} title="ON" />

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <label
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      Upload ON
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          readAsDataURL(f, setOnImage);
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => openIOTsLibrary("on")}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 1000,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                      title="Pick ON image from CoreFlex IOTs Library"
                    >
                      IOTs Library ON
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnImage("")}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 13,
                      }}
                      title="Clear ON image"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <Label>Image Fit</Label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {fitOptions.map((x) => {
                    const sel = imageFit === x.id;
                    return (
                      <button
                        key={x.id}
                        type="button"
                        onClick={() => setImageFit(x.id)}
                        style={{
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: sel
                            ? "2px solid #22c55e"
                            : "1px solid #e5e7eb",
                          background: sel ? "#ecfdf5" : "white",
                          cursor: "pointer",
                          fontWeight: 900,
                          fontSize: 13,
                        }}
                      >
                        {x.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                Default state is <b>OFF</b>. If your tag becomes ON (truthy / &gt;
                0), the ON image will display.
              </div>
            </div>

            {/* RIGHT: Tag binding */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
                Tag that drives state (ON / OFF)
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Device</Label>
                  <select
                    value={deviceId}
                    onChange={(e) => {
                      setDeviceId(e.target.value);
                      setField("");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "white",
                    }}
                  >
                    <option value="">— Select device —</option>
                    {devices.map((d) => (
                      <option key={String(d.id)} value={String(d.id)}>
                        {d.name || d.label || d.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <Label>Search Tag</Label>
                  <input
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="ex: DI0, run, fault..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <Label>Tag / Field</Label>

                {filteredFields.length > 0 ? (
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "white",
                    }}
                  >
                    <option value="">— Select tag —</option>
                    {filteredFields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    placeholder="Type tag field (ex: di0, run_status, fault)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                )}
              </div>

              <div style={{ fontSize: 12, color: "#64748b" }}>
                Tip: ON means <b>truthy</b> (or numeric <b>&gt; 0</b>). Otherwise
                it displays OFF image.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: 14,
            borderTop: "1px solid #e5e7eb",
            flex: "0 0 auto",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
            }}
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={apply}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #16a34a",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
            }}
            type="button"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
