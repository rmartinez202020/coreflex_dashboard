// StateImageSettingsModal.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Same device system as BlinkingAlarmSettingsModal / StatusTextSettingsModal
const MODEL_META = {
  zhc1921: { label: "ZHC1921 (CF-2000)", base: "zhc1921" },
  zhc1661: { label: "ZHC1661 (CF-1600)", base: "zhc1661" },
  tp4000: { label: "TP-4000", base: "tp4000" },
};

// ✅ Same DI/DO list (simple + consistent)
const TAG_OPTIONS = [
  { key: "di1", label: "DI-1" },
  { key: "di2", label: "DI-2" },
  { key: "di3", label: "DI-3" },
  { key: "di4", label: "DI-4" },
  { key: "di5", label: "DI-5" },
  { key: "di6", label: "DI-6" },
  { key: "do1", label: "DO-1" },
  { key: "do2", label: "DO-2" },
  { key: "do3", label: "DO-3" },
  { key: "do4", label: "DO-4" },
];

// ✅ Convert anything to 0/1
function to01(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
    if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
    const n = Number(s);
    if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
  }
  return v ? 1 : 0;
}

// ✅ Read tag from backend row (same mapping used elsewhere)
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  if (row[field] !== undefined) return row[field];

  const up = String(field).toUpperCase();
  if (row[up] !== undefined) return row[up];

  // di1..di6 -> in1..in6
  if (/^di[1-6]$/.test(field)) {
    const n = field.replace("di", "");
    const alt = `in${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = `IN${n}`;
    if (row[altUp] !== undefined) return row[altUp];
  }

  // do1..do4 -> out1..out4
  if (/^do[1-4]$/.test(field)) {
    const n = field.replace("do", "");
    const alt = `out${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = `OUT${n}`;
    if (row[altUp] !== undefined) return row[altUp];
  }

  return undefined;
}

export default function StateImageSettingsModal({
  open,
  tank,
  onClose,
  onSave,
  sensorsData, // kept for compatibility (not used for binding anymore)
}) {
  // ✅ do NOT early return before hooks
  const p = tank?.properties || {};

  // ✅ Modal sizing (same feel as the other)
  const MODAL_W = Math.min(980, window.innerWidth - 80);
  const MODAL_H = Math.min(680, window.innerHeight - 120);

  // ✅ Tag binding (backward compatible)
  const initialModel = String(p?.tag?.model || "zhc1921").trim() || "zhc1921";
  const initialDeviceId = String(p?.tag?.deviceId ?? "");
  const initialField = String(p?.tag?.field ?? "");

  // ✅ Images
  const initialOffImage = p?.offImage ?? "";
  const initialOnImage = p?.onImage ?? "";

  const [deviceModel, setDeviceModel] = React.useState(
    MODEL_META[initialModel] ? initialModel : "zhc1921"
  );
  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(initialField);

  const [deviceSearch, setDeviceSearch] = React.useState("");

  const [offImage, setOffImage] = React.useState(initialOffImage);
  const [onImage, setOnImage] = React.useState(initialOnImage);

  // ✅ Track last clicked slot ("off" | "on") for IOTs Library
  const pickSlotRef = React.useRef(null);

  // =========================
  // REHYDRATE ON OPEN
  // =========================
  React.useEffect(() => {
    if (!open || !tank) return;

    const pp = tank?.properties || {};
    setOffImage(pp?.offImage ?? "");
    setOnImage(pp?.onImage ?? "");

    const m = String(pp?.tag?.model || "zhc1921").trim() || "zhc1921";
    setDeviceModel(MODEL_META[m] ? m : "zhc1921");
    setDeviceId(String(pp?.tag?.deviceId || ""));
    setField(String(pp?.tag?.field || ""));

    setDeviceSearch("");
  }, [open, tank?.id]);

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

      const clampedLeft = Math.min(
        window.innerWidth - 20,
        Math.max(20 - (mw - 60), nextLeft)
      );
      const clampedTop = Math.min(window.innerHeight - 20, Math.max(20, nextTop));

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
  // DEVICES (BACKEND, SAME AS OTHER MODALS)
  // =========================
  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    let alive = true;

    async function fetchModelDevices(modelKey) {
      const base = MODEL_META[modelKey]?.base;
      if (!base) return [];

      const res = await fetch(`${API_URL}/${base}/my-devices`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      return list
        .map((r) => {
          const id = String(r.deviceId ?? r.device_id ?? "").trim();
          return {
            id,
            name: id, // ✅ ID ONLY (simple)
            model: modelKey,
            modelLabel: MODEL_META[modelKey]?.label || modelKey,
          };
        })
        .filter((x) => x.id);
    }

    async function loadDevices() {
      setDevicesErr("");
      try {
        const token = String(getToken() || "").trim();
        if (!token) throw new Error("Missing auth token. Please logout and login again.");

        const [d1, d2, d3] = await Promise.all([
          fetchModelDevices("zhc1921"),
          fetchModelDevices("zhc1661"),
          fetchModelDevices("tp4000"),
        ]);

        const merged = [...d1, ...d2, ...d3];

        merged.sort((a, b) => {
          const ma = String(a.model || "");
          const mb = String(b.model || "");
          if (ma !== mb) return ma.localeCompare(mb);
          return String(a.id).localeCompare(String(b.id));
        });

        if (alive) setDevices(merged);
      } catch (e) {
        if (alive) {
          setDevices([]);
          setDevicesErr(e.message || "Failed to load devices");
        }
      }
    }

    loadDevices();
    return () => {
      alive = false;
    };
  }, [open]);

  const filteredDevices = React.useMemo(() => {
    const q = String(deviceSearch || "").trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => {
      const id = String(d.id || "").toLowerCase();
      const model = String(d.modelLabel || d.model || "").toLowerCase();
      return id.includes(q) || model.includes(q);
    });
  }, [devices, deviceSearch]);

  // =========================
  // LIVE STATUS / VALUE (POLL BACKEND)
  // =========================
  const [telemetryRow, setTelemetryRow] = React.useState(null);
  const telemetryRef = React.useRef({ loading: false });

  const fetchTelemetryRow = React.useCallback(async () => {
    const id = String(deviceId || "").trim();
    const modelKey = String(deviceModel || "").trim();
    const base = MODEL_META[modelKey]?.base;

    if (!id || !base) {
      setTelemetryRow(null);
      return;
    }
    if (telemetryRef.current.loading) return;

    telemetryRef.current.loading = true;
    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const res = await fetch(`${API_URL}/${base}/my-devices`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setTelemetryRow(null);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const row =
        list.find((r) => String(r.deviceId ?? r.device_id ?? "").trim() === id) || null;

      setTelemetryRow(row);
    } catch {
      setTelemetryRow(null);
    } finally {
      telemetryRef.current.loading = false;
    }
  }, [deviceId, deviceModel]);

  React.useEffect(() => {
    if (!open) return;

    fetchTelemetryRow();
    const t = setInterval(() => {
      if (document.hidden) return;
      fetchTelemetryRow();
    }, 3000);

    return () => clearInterval(t);
  }, [open, fetchTelemetryRow]);

  const backendDeviceStatus = React.useMemo(() => {
    const s = String(telemetryRow?.status || "").trim().toLowerCase();
    if (!deviceId) return "";
    return s || "";
  }, [telemetryRow, deviceId]);

  const deviceIsOnline = backendDeviceStatus === "online";

  const effectiveField = String(field || "").trim();

  const rawValue = React.useMemo(() => {
    if (!telemetryRow || !effectiveField) return undefined;
    return readTagFromRow(telemetryRow, effectiveField);
  }, [telemetryRow, effectiveField]);

  const isOnline =
    !!deviceId && !!effectiveField && deviceIsOnline && rawValue !== undefined && rawValue !== null;

  const as01 = React.useMemo(() => (isOnline ? to01(rawValue) : null), [isOnline, rawValue]);

  // =========================
  // IMAGE HELPERS
  // =========================
  const readAsDataURL = (file, cb) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  // =========================
  // ✅ IOTs LIBRARY PICKER (EVENT-BASED)
  // =========================
  const openIOTsLibrary = (which) => {
    const safeWhich = which === "on" ? "on" : "off";
    pickSlotRef.current = safeWhich;

    window.dispatchEvent(
      new CustomEvent("coreflex-open-iots-library", {
        detail: {
          mode: "pickImage",
          which: safeWhich,
          tankId: tank?.id,
          from: "StateImageSettingsModal",
        },
      })
    );
  };

  // ✅ NEW: hard-close the IOTs Library by clicking its X button (DOM)
  const closeIOTsLibraryByDom = React.useCallback(() => {
    // Delay a tick so the selection UI can finish first
    setTimeout(() => {
      try {
        // Find the library window by its header text
        const allDivs = Array.from(document.querySelectorAll("div"));
        const headerDiv = allDivs.find((d) =>
          String(d.textContent || "").includes("CoreFlex IOTs Library")
        );

        if (!headerDiv) return;

        // Walk up a little to reach the window container
        const container =
          headerDiv.closest("div") ||
          headerDiv.parentElement ||
          headerDiv;

        if (!container) return;

        // Find an X close button inside this window.
        // Your X is a button with "✕" OR "x" in text.
        const btns = Array.from(container.querySelectorAll("button"));
        const closeBtn = btns.find((b) => {
          const t = String(b.textContent || "").trim().toLowerCase();
          return t === "✕" || t === "x" || t.includes("✕");
        });

        if (closeBtn) closeBtn.click();
      } catch {
        // ignore
      }
    }, 0);
  }, []);

  React.useEffect(() => {
    if (!tank?.id) return;

    const onSelected = (ev) => {
      const url = ev?.detail?.url;
      if (!url) return;

      if (ev?.detail?.tankId != null && String(ev.detail.tankId) !== String(tank.id)) {
        return;
      }

      const fromRef =
        pickSlotRef.current === "on" || pickSlotRef.current === "off"
          ? pickSlotRef.current
          : null;

      const fromEvent =
        ev?.detail?.which === "on" || ev?.detail?.which === "off"
          ? ev.detail.which
          : null;

      const which = fromRef || fromEvent;
      if (which !== "on" && which !== "off") return;

      if (which === "off") setOffImage(url);
      if (which === "on") setOnImage(url);

      pickSlotRef.current = null;

      // ✅ CLOSE the Library window immediately after pick
      closeIOTsLibraryByDom();
    };

    window.addEventListener("coreflex-iots-library-selected", onSelected);
    return () => window.removeEventListener("coreflex-iots-library-selected", onSelected);
  }, [tank?.id, closeIOTsLibraryByDom]);

  // =========================
  // APPLY SAVE
  // =========================
  const apply = () => {
    const nextProps = {
      ...(tank?.properties || {}),
      offImage,
      onImage,
    };

    const hasTagSelection = deviceId && effectiveField;
    if (hasTagSelection) {
      nextProps.tag = {
        model: String(deviceModel || "zhc1921"),
        deviceId: String(deviceId),
        field: String(effectiveField),
      };
    }

    onSave?.({
      id: tank.id,
      properties: nextProps,
    });
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>{children}</div>
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
            objectFit: "contain",
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

  const btnNeutral = {
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontWeight: 1000,
    fontSize: 13,
    whiteSpace: "nowrap",
  };

  const statusText = !deviceId
    ? "Select a device and tag"
    : !effectiveField
    ? "Select a DI/DO tag"
    : isOnline
    ? "Online"
    : deviceId && deviceIsOnline
    ? "No data for tag"
    : "Offline";

  const valueText = isOnline ? String(as01 ?? 0) : "—";

  if (!open || !tank) return null;

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
          {/* ✅ TOP: Images section */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
              State Images (OFF / ON)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* OFF */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 8 }}>
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
                    style={btnNeutral}
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
                <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 8 }}>ON Image</div>

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
                    style={btnNeutral}
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

            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Default state is <b>OFF</b>. If your tag becomes ON (truthy / &gt; 0), the ON image
              will display.
            </div>
          </div>

          {/* ✅ BOTTOM: Tag section */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
              Tag that drives state (ON / OFF)
            </div>

            {devicesErr && (
              <div style={{ marginBottom: 10, color: "#dc2626", fontSize: 12 }}>{devicesErr}</div>
            )}

            <div style={{ marginBottom: 10 }}>
              <Label>Search Device</Label>
              <input
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                placeholder="Type device id or model..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                Showing <b>{filteredDevices.length}</b> device(s)
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <Label>Device</Label>
                <select
                  value={deviceId ? `${deviceModel}::${deviceId}` : ""}
                  onChange={(e) => {
                    const v = String(e.target.value || "");
                    if (!v || !v.includes("::")) {
                      setDeviceModel("zhc1921");
                      setDeviceId("");
                      setField("");
                      return;
                    }
                    const [m, id] = v.split("::");
                    setDeviceModel(MODEL_META[m] ? m : "zhc1921");
                    setDeviceId(String(id || ""));
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
                  {filteredDevices.map((d) => (
                    <option key={`${d.model}::${d.id}`} value={`${d.model}::${d.id}`}>
                      {d.id}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <Label>Select Tag</Label>
                <select
                  value={field}
                  onChange={(e) => setField(String(e.target.value || ""))}
                  disabled={!deviceId}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    background: "white",
                    opacity: deviceId ? 1 : 0.6,
                    cursor: deviceId ? "pointer" : "not-allowed",
                  }}
                >
                  <option value="">— Select DI/DO —</option>
                  {TAG_OPTIONS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>Status</div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                  {deviceId && effectiveField ? (
                    <>
                      <span style={{ fontWeight: 900, color: "#0f172a" }}>{statusText}</span>
                      <span style={{ marginLeft: 10, color: "#64748b" }}>
                        Bound: <b>{deviceId}</b> / <b>{effectiveField}</b>
                      </span>
                    </>
                  ) : (
                    statusText
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>Value</div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 18,
                    fontWeight: 1000,
                    color: isOnline ? "#0f172a" : "#94a3b8",
                    fontFamily: "monospace",
                    minWidth: 22,
                  }}
                >
                  {valueText}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
              Tip: ON means <b>truthy</b> (or numeric <b>&gt; 0</b>). OFF means false / 0 / empty.
            </div>
          </div>
        </div>

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
