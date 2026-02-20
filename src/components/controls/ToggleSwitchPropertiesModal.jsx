// src/components/controls/ToggleSwitchPropertiesModal.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ ONLY CF-2000 (ZHC1921)
const MODEL_META = {
  zhc1921: { label: "ZHC1921 (CF-2000)", base: "zhc1921" },
};

// ✅ ONLY 4 DO outputs
const DO_OPTIONS = [
  { key: "do1", label: "DO-1" },
  { key: "do2", label: "DO-2" },
  { key: "do3", label: "DO-3" },
  { key: "do4", label: "DO-4" },
];

// ✅ Convert anything to 0/1 (for live preview)
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

// ✅ Read DO value from backend device row (supports do/out variants)
// ✅ clamp to do1..do4 only
function readDoFromRow(row, field) {
  if (!row || !field) return undefined;

  const f = String(field).toLowerCase().trim();
  if (!/^do[1-4]$/.test(f)) return undefined;

  if (row[f] !== undefined) return row[f];

  const up = f.toUpperCase();
  if (row[up] !== undefined) return row[up];

  // do1..do4 -> out1..out4
  const n = f.replace("do", "");
  const alt = `out${n}`;
  if (row[alt] !== undefined) return row[alt];
  const altUp = `OUT${n}`;
  if (row[altUp] !== undefined) return row[altUp];

  return undefined;
}

export default function ToggleSwitchPropertiesModal({
  open = false,
  toggleSwitch,
  onSave,
  onClose,
  // ✅ MUST be true in PLAY mode
  isLaunched = false,
}) {
  // ✅ do NOT early return before hooks
  const p = toggleSwitch?.properties || {};

  // ✅ Modal sizing (same feel as BlinkingAlarm)
  const MODAL_W = Math.min(720, window.innerWidth - 80);
  const MODAL_H = Math.min(520, window.innerHeight - 120);

  // ✅ Force CF-2000 model
  const forcedModel = "zhc1921";

  // ✅ Backward compatible initial binding:
  const initialDeviceId = String(p.bindDeviceId || p?.tag?.deviceId || "");
  const initialField = String(p.bindField || p?.tag?.field || "do1");

  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(
    /^do[1-4]$/.test(String(initialField || "").toLowerCase()) ? initialField : "do1"
  );
  const [deviceSearch, setDeviceSearch] = React.useState("");

  // =========================
  // ✅ HARD GUARANTEE: NEVER IN PLAY MODE
  // =========================
  React.useEffect(() => {
    if (isLaunched && open) onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLaunched, open]);

  // =========================
  // ✅ REHYDRATE ON OPEN (EDIT ONLY)
  // =========================
  React.useEffect(() => {
    if (!open || !toggleSwitch || isLaunched) return;

    const pp = toggleSwitch?.properties || {};
    const f = String(pp.bindField || pp?.tag?.field || "do1");

    setDeviceId(String(pp.bindDeviceId || pp?.tag?.deviceId || ""));
    setField(/^do[1-4]$/.test(f.toLowerCase()) ? f : "do1");
    setDeviceSearch("");
  }, [open, toggleSwitch?.id, isLaunched]);

  // =========================
  // ✅ DRAGGABLE WINDOW (MATCH BlinkingAlarm)
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

  // ✅ CENTER EVERY TIME IT OPENS (EDIT ONLY)
  React.useEffect(() => {
    if (!open || isLaunched) return;
    const left = Math.max(20, Math.round((window.innerWidth - MODAL_W) / 2));
    const top = Math.max(20, Math.round((window.innerHeight - MODAL_H) / 2));
    setPos({ left, top });
  }, [open, isLaunched, MODAL_W, MODAL_H]);

  React.useEffect(() => {
    if (isLaunched) return;

    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      e.preventDefault();

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      const nextLeft = dragRef.current.startLeft + dx;
      const nextTop = dragRef.current.startTop + dy;

      const rect = modalRef.current?.getBoundingClientRect();
      const mw = rect?.width ?? MODAL_W;

      const clampedLeft = Math.min(window.innerWidth - 20, Math.max(20 - (mw - 60), nextLeft));
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
  }, [MODAL_W, MODAL_H, isLaunched]);

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
  // ✅ DEVICES (BACKEND) — EDIT ONLY
  // =========================
  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");

  React.useEffect(() => {
    if (!open || isLaunched) return;

    let alive = true;

    async function loadDevices() {
      setDevicesErr("");
      try {
        const token = String(getToken() || "").trim();
        if (!token) throw new Error("Missing auth token. Please logout and login again.");

        const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to load CF-2000 devices");

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        const out = list
          .map((r) => {
            const id = String(r.deviceId ?? r.device_id ?? "").trim();
            return { id, name: id };
          })
          .filter((x) => x.id)
          .sort((a, b) => String(a.id).localeCompare(String(b.id)));

        if (alive) setDevices(out);
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
  }, [open, isLaunched]);

  const filteredDevices = React.useMemo(() => {
    const q = String(deviceSearch || "").trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => String(d.id || "").toLowerCase().includes(q));
  }, [devices, deviceSearch]);

  // =========================
  // ✅ LIVE STATUS / VALUE (EDIT ONLY)
  // =========================
  const [telemetryRow, setTelemetryRow] = React.useState(null);
  const telemetryRef = React.useRef({ loading: false });

  const fetchTelemetryRow = React.useCallback(async () => {
    const id = String(deviceId || "").trim();
    if (!id) {
      setTelemetryRow(null);
      return;
    }
    if (telemetryRef.current.loading) return;

    telemetryRef.current.loading = true;
    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
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
  }, [deviceId]);

  React.useEffect(() => {
    if (!open || isLaunched) return;

    fetchTelemetryRow();
    const t = setInterval(() => {
      if (document.hidden) return;
      fetchTelemetryRow();
    }, 3000);

    return () => clearInterval(t);
  }, [open, isLaunched, fetchTelemetryRow]);

  const backendDeviceStatus = React.useMemo(() => {
    const s = String(telemetryRow?.status || "").trim().toLowerCase();
    if (!deviceId) return "";
    return s || "";
  }, [telemetryRow, deviceId]);

  const deviceIsOnline = backendDeviceStatus === "online";

  const effectiveField = String(field || "").trim().toLowerCase();
  const rawValue = React.useMemo(() => {
    if (!telemetryRow || !effectiveField) return undefined;
    return readDoFromRow(telemetryRow, effectiveField);
  }, [telemetryRow, effectiveField]);

  const hasSelection = !!deviceId && !!effectiveField;
  const hasData = rawValue !== undefined && rawValue !== null;
  const isOnlineWithData = deviceIsOnline && hasData && hasSelection;
  const as01 = React.useMemo(() => (isOnlineWithData ? to01(rawValue) : null), [
    isOnlineWithData,
    rawValue,
  ]);

  const statusText = !deviceId
    ? "Select a device and DO"
    : !effectiveField
    ? "Select a DO tag"
    : isOnlineWithData
    ? "Online"
    : deviceId && deviceIsOnline
    ? "No data for DO"
    : "Offline";

  const valueText = isOnlineWithData ? String(as01 ?? 0) : "—";

  // =========================
  // ✅ APPLY SAVE
  // =========================
  const canApply = !!String(deviceId || "").trim() && /^do[1-4]$/.test(effectiveField);

  const apply = () => {
    if (!toggleSwitch) return;

    const nextProps = {
      ...(toggleSwitch?.properties || {}),
      bindModel: forcedModel,
      bindDeviceId: String(deviceId || ""),
      bindField: String(effectiveField || "do1"),
      tag: canApply
        ? {
            model: forcedModel,
            deviceId: String(deviceId || ""),
            field: String(effectiveField || "do1"),
          }
        : (toggleSwitch?.properties || {}).tag,
    };

    const next = { ...toggleSwitch, properties: nextProps };
    onSave?.(next);
    onClose?.();
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>{children}</div>
  );

  // ✅ NEVER render in PLAY mode
  if (!open || !toggleSwitch || isLaunched) return null;

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
          onMouseDown={(e) => {
            e.stopPropagation();
            startDrag(e);
          }}
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: 0.2,
            cursor: "grab",
            flex: "0 0 auto",
            userSelect: "none",
          }}
          title="Drag to move"
        >
          <span>Toggle Switch (CF-2000)</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
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
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            Bind this toggle to a <b>CF-2000 Digital Output (DO)</b>.
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
              Output that this toggle controls (DO)
            </div>

            {devicesErr && (
              <div style={{ marginBottom: 10, color: "#dc2626", fontSize: 12 }}>
                {devicesErr}
              </div>
            )}

            {/* Search Device */}
            <div style={{ marginBottom: 10 }}>
              <Label>Search Device (CF-2000)</Label>
              <input
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                placeholder="Type device id..."
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
              {/* Device */}
              <div style={{ flex: 1 }}>
                <Label>Device</Label>
                <select
                  value={deviceId || ""}
                  onChange={(e) => setDeviceId(String(e.target.value || ""))}
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
                    <option key={d.id} value={d.id}>
                      {d.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* DO */}
              <div style={{ flex: 1 }}>
                <Label>Select DO</Label>
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
                  <option value="">— Select DO —</option>
                  {DO_OPTIONS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STATUS BAR */}
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
                    color: isOnlineWithData ? "#0f172a" : "#94a3b8",
                    fontFamily: "monospace",
                    minWidth: 22,
                  }}
                >
                  {valueText}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
              Tip: Value preview is best-effort from <code>/zhc1921/my-devices</code>.
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
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              apply();
            }}
            disabled={!canApply}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #16a34a",
              background: canApply ? "#22c55e" : "#e5e7eb",
              color: canApply ? "white" : "#64748b",
              cursor: canApply ? "pointer" : "not-allowed",
              fontWeight: 900,
              fontSize: 14,
            }}
            type="button"
            title="Apply"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}