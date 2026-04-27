// src/components/controls/ToggleSwitchPropertiesModal.jsx
import React from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import { fetchUsedDOs, bindControlDO } from "./controlBindings";
import ToggleSwitchPropertiesModalInterlock from "./ToggleSwitchPropertiesModalInterlock";
import ToggleSwitchpropertiesmodalTelemetric, {
  to01,
  readDoFromRow,
} from "./ToggleSwitchpropertiesmodalTelemetric";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const MODEL_META = {
  zhc1921: { label: "ZHC1921 (CF-2000)", base: "zhc1921" },
};

const DO_OPTIONS = [
  { key: "do1", label: "DO-1" },
  { key: "do2", label: "DO-2" },
  { key: "do3", label: "DO-3" },
  { key: "do4", label: "DO-4" },
];

function nextTick() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export default function ToggleSwitchPropertiesModal({
  open = false,
  toggleSwitch,
  onSave,
  onClose,
  isLaunched = false,
  dashboardId: dashboardIdProp,
  dashboardName: dashboardNameProp,
  onSaveProject = null,
}) {
  const p = toggleSwitch?.properties || {};

  const MODAL_W = Math.min(1500, window.innerWidth - 80);
  const MODAL_H = Math.min(window.innerHeight - 40, 900);

  const forcedModel = "zhc1921";

  const initialDeviceId = String(p.bindDeviceId || p?.tag?.deviceId || "");
  const initialField = String(p.bindField || p?.tag?.field || "do1");

  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(
    /^do[1-4]$/.test(String(initialField || "").toLowerCase())
      ? initialField
      : "do1"
  );

  const [deviceSearch, setDeviceSearch] = React.useState("");

  const initialTitle = String(p.title ?? toggleSwitch?.title ?? "").trim();
  const [title, setTitle] = React.useState(initialTitle);

  const initialInterlock = p.interlock || {};

  const [interlockEnabled, setInterlockEnabled] = React.useState(
    Boolean(initialInterlock.enabled)
  );

  const [interlockDeviceId, setInterlockDeviceId] = React.useState(
    String(initialInterlock.deviceId || initialDeviceId || "")
  );

  const [interlockField, setInterlockField] = React.useState(
    /^di[1-6]$/.test(String(initialInterlock.field || "").toLowerCase())
      ? String(initialInterlock.field || "").toLowerCase()
      : "di1"
  );

  const [interlockType, setInterlockType] = React.useState(
    String(initialInterlock.type || "NO").toUpperCase() === "NC" ? "NC" : "NO"
  );

  React.useEffect(() => {
    if (isLaunched && open) onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLaunched, open]);

  React.useEffect(() => {
    if (!open || !toggleSwitch || isLaunched) return;

    const pp = toggleSwitch?.properties || {};
    const f = String(pp.bindField || pp?.tag?.field || "do1");
    const il = pp.interlock || {};

    const nextDeviceId = String(pp.bindDeviceId || pp?.tag?.deviceId || "");

    setDeviceId(nextDeviceId);
    setField(/^do[1-4]$/.test(f.toLowerCase()) ? f : "do1");
    setDeviceSearch("");
    setTitle(String(pp.title ?? toggleSwitch?.title ?? "").trim());

    setInterlockEnabled(Boolean(il.enabled));
    setInterlockDeviceId(String(il.deviceId || nextDeviceId || ""));
    setInterlockField(
      /^di[1-6]$/.test(String(il.field || "").toLowerCase())
        ? String(il.field || "").toLowerCase()
        : "di1"
    );
    setInterlockType(
      String(il.type || "NO").toUpperCase() === "NC" ? "NC" : "NO"
    );
  }, [open, toggleSwitch?.id, isLaunched]);

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
    if (!open || isLaunched) return;
    const left = Math.max(20, Math.round((window.innerWidth - MODAL_W) / 2));
    const top = Math.max(20, Math.round((window.innerHeight - MODAL_H) / 2));
    setPos({ left, top });
  }, [open, MODAL_W, MODAL_H, isLaunched]);

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

      const clampedLeft = Math.min(
        window.innerWidth - 20,
        Math.max(20 - (mw - 60), nextLeft)
      );
      const clampedTop = Math.min(window.innerHeight - 20, Math.max(20, nextTop));

      setPos({ left: clampedLeft, top: clampedTop });
    };

    const onUp = (e) => {
      if (!dragRef.current.dragging) return;
      e.preventDefault();

      dragRef.current.dragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, { passive: false });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [MODAL_W, isLaunched]);

  const startDrag = (e) => {
    const t = e.target;
    if (
      t?.closest?.("button, input, select, textarea, a, [data-no-drag='true']")
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const pt = "touches" in e && e.touches?.[0] ? e.touches[0] : e;

    dragRef.current.dragging = true;
    dragRef.current.startX = pt.clientX;
    dragRef.current.startY = pt.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    try {
      e.currentTarget?.setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");

  React.useEffect(() => {
    if (!open || isLaunched) return;

    let alive = true;

    async function loadDevices() {
      setDevicesErr("");
      try {
        const token = String(getToken() || "").trim();
        if (!token)
          throw new Error("Missing auth token. Please logout and login again.");

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

  const widgetId = String(toggleSwitch?.id || "").trim();

  const dashboardId = String(
    dashboardIdProp ?? p.dashboardId ?? toggleSwitch?.dashboardId ?? ""
  ).trim();

  const dashboardName = String(
    dashboardNameProp ??
      p.dashboardName ??
      p.dashboardTitle ??
      toggleSwitch?.dashboardName ??
      toggleSwitch?.dashboardTitle ??
      ""
  ).trim();

  const [usedMap, setUsedMap] = React.useState({});
  const [usedErr, setUsedErr] = React.useState("");
  const usedAbortRef = React.useRef(null);

  const loadUsed = React.useCallback(async () => {
    const dev = String(deviceId || "").trim();

    if (!open || isLaunched) return;
    if (!dev) {
      setUsedMap({});
      setUsedErr("");
      return;
    }

    try {
      setUsedErr("");
      if (usedAbortRef.current) usedAbortRef.current.abort();
      const ac = new AbortController();
      usedAbortRef.current = ac;

      const rows = await fetchUsedDOs({
        deviceId: dev,
        signal: ac.signal,
      });

      const m = {};
      (Array.isArray(rows) ? rows : []).forEach((r) => {
        const f = String(r.field || "").trim().toLowerCase();
        if (!/^do[1-4]$/.test(f)) return;

        m[f] = {
          field: f,
          widgetId: String(r.widgetId || "").trim(),
          title: String(r.title || "").trim(),
          widgetType: String(r.widgetType || "").trim(),
          dashboardId: String(r.dashboardId || "").trim(),
          dashboardName: String(r.dashboardName || "").trim(),
        };
      });

      setUsedMap(m);
    } catch (e) {
      if (String(e?.name || "") === "AbortError") return;
      setUsedMap({});
      setUsedErr(e?.message || "Failed to load used DOs");
    }
  }, [open, isLaunched, deviceId]);

  React.useEffect(() => {
    if (!open || isLaunched) return;
    loadUsed();
    return () => {
      if (usedAbortRef.current) usedAbortRef.current.abort();
    };
  }, [open, isLaunched, loadUsed]);

  const effectiveField = String(field || "").trim().toLowerCase();

  const usedByOther = React.useMemo(() => {
    const info = usedMap?.[effectiveField];
    if (!info) return null;
    if (!info.widgetId) return null;
    if (!widgetId) return info;
    return info.widgetId !== widgetId ? info : null;
  }, [usedMap, effectiveField, widgetId]);

  const isOptionDisabled = React.useCallback(
    (f) => {
      const info = usedMap?.[String(f || "").toLowerCase().trim()];
      if (!info?.widgetId) return false;
      if (!widgetId) return true;
      return info.widgetId !== widgetId;
    },
    [usedMap, widgetId]
  );

  const { telemetryRow, backendDeviceStatus } =
    ToggleSwitchpropertiesmodalTelemetric({
      open,
      isLaunched,
      deviceId,
      pollMs: 3000,
    });

  const deviceIsOnline = backendDeviceStatus === "online";

  const rawValue = React.useMemo(() => {
    if (!telemetryRow || !effectiveField) return undefined;
    return readDoFromRow(telemetryRow, effectiveField);
  }, [telemetryRow, effectiveField]);

  const hasSelection = !!deviceId && !!effectiveField;
  const hasData = rawValue !== undefined && rawValue !== null;
  const isOnlineWithData = deviceIsOnline && hasData && hasSelection;

  const as01 = React.useMemo(
    () => (isOnlineWithData ? to01(rawValue) : null),
    [isOnlineWithData, rawValue]
  );

  const statusText = !deviceId
    ? "Select a device and DO"
    : !effectiveField
    ? "Select a DO tag"
    : usedByOther
    ? "DO already used"
    : isOnlineWithData
    ? "Online"
    : deviceId && deviceIsOnline
    ? "No data for DO"
    : "Offline";

  const valueText = isOnlineWithData ? String(as01 ?? 0) : "—";

  const canApplyLocal =
    !!String(deviceId || "").trim() && /^do[1-4]$/.test(effectiveField);

  const interlockValid =
    !interlockEnabled ||
    (!!String(interlockDeviceId || "").trim() &&
      /^di[1-6]$/.test(String(interlockField || "").toLowerCase()) &&
      ["NO", "NC"].includes(String(interlockType || "").toUpperCase()));

  const [saving, setSaving] = React.useState(false);
  const [saveErr, setSaveErr] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setSaving(false);
      setSaveErr("");
    }
  }, [open]);

  const canApply =
    canApplyLocal &&
    interlockValid &&
    !!String(dashboardId || "").trim() &&
    !!String(widgetId || "").trim() &&
    !usedByOther &&
    !saving;

  const apply = async () => {
    if (!toggleSwitch) return;

    setSaveErr("");

    const dash = String(dashboardId || "").trim();
    const dashName = String(dashboardName || "").trim();
    const wid = String(widgetId || "").trim();
    const dev = String(deviceId || "").trim();
    const f = String(effectiveField || "").trim().toLowerCase();

    const safeTitle = String(title || "").trim().slice(0, 40);

    const safeInterlockDeviceId = String(interlockDeviceId || "").trim();
    const safeInterlockField = String(interlockField || "").trim().toLowerCase();
    const safeInterlockType =
      String(interlockType || "NO").toUpperCase() === "NC" ? "NC" : "NO";

    if (!dash || !wid) {
      setSaveErr(
        "Missing dashboardId / widgetId. Pass dashboardId into the modal from the dashboard page."
      );
      return;
    }

    if (!dev || !/^do[1-4]$/.test(f)) return;

    if (
      interlockEnabled &&
      (!safeInterlockDeviceId || !/^di[1-6]$/.test(safeInterlockField))
    ) {
      setSaveErr("Interlock is enabled. Select a CF-2000 device and DI tag.");
      return;
    }

    setSaving(true);

    try {
      const nextProps = {
        ...(toggleSwitch?.properties || {}),

        dashboardId: dash,
        dashboardName: dashName,

        title: safeTitle,

        bindModel: forcedModel,
        bindDeviceId: dev,
        bindField: f,

        tag: {
          model: forcedModel,
          deviceId: dev,
          field: f,
        },

        interlock: {
          enabled: Boolean(interlockEnabled),
          model: forcedModel,
          deviceId: interlockEnabled ? safeInterlockDeviceId : "",
          field: interlockEnabled ? safeInterlockField : "",
          type: safeInterlockType,
          mode: "block_when_active",
        },
      };

      const next = { ...toggleSwitch, properties: nextProps };

      console.log("[ToggleSwitchPropertiesModal] APPLY", {
        widgetId: wid,
        dashboardIdProp,
        dashboardNameProp,
        resolvedDashboardId: dash,
        resolvedDashboardName: dashName,
        bindDeviceId: dev,
        bindField: f,
        interlock: nextProps.interlock,
      });

      onSave?.(next);

      await nextTick();

      if (typeof onSaveProject === "function") {
        await onSaveProject();
      }

      await bindControlDO({
        dashboardId: dash,
        dashboardName: dashName,
        widgetId: wid,
        widgetType: "toggle",
        title: String(safeTitle || "Toggle").trim().slice(0, 120),
        deviceId: dev,
        field: f,
      });

      await loadUsed();

      onClose?.();
    } catch (e) {
      console.error("[ToggleSwitchPropertiesModal] APPLY FAILED", e);

      if (e?.code === 409) {
        const d = e?.detail || {};
        setSaveErr(d?.error || "This DO is already used.");
        loadUsed();
      } else {
        setSaveErr(e?.message || "Failed to bind DO");
      }
    } finally {
      setSaving(false);
    }
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
      {children}
    </div>
  );

  const SectionCard = ({ children }) => (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 14,
        background: "#fff",
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );

  if (!open || !toggleSwitch || isLaunched) return null;

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
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
          maxHeight: "calc(100vh - 40px)",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          onPointerDown={startDrag}
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
          }}
          title="Drag to move"
        >
          <span>Toggle Switch (CF-2000)</span>

          <button
            data-no-drag="true"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose?.();
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
              padding: 2,
            }}
            title="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: 16,
            overflowY: "auto",
            overflowX: "hidden",
            flex: "1 1 auto",
            background: "#f8fafc",
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            Bind this toggle to a <b>CF-2000 Digital Output (DO)</b>.
          </div>

          {!dashboardId && (
            <div
              style={{
                marginBottom: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #fecaca",
                background: "#fff1f2",
                color: "#991b1b",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Missing <code>dashboardId</code>. Pass it to this modal so the
              widget can be saved correctly.
            </div>
          )}

          {devicesErr && (
            <div style={{ marginBottom: 10, color: "#dc2626", fontSize: 12 }}>
              {devicesErr}
            </div>
          )}

          {usedErr && (
            <div style={{ marginBottom: 10, color: "#dc2626", fontSize: 12 }}>
              {usedErr}
            </div>
          )}

          {saveErr && (
            <div
              style={{
                marginBottom: 10,
                color: "#dc2626",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {saveErr}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "360px 1fr 390px",
              gap: 14,
              alignItems: "start",
            }}
          >
            <ToggleSwitchPropertiesModalInterlock
              open={open}
              isLaunched={isLaunched}
              forcedModel={forcedModel}
              devices={devices}
              enabled={interlockEnabled}
              setEnabled={setInterlockEnabled}
              deviceId={interlockDeviceId}
              setDeviceId={setInterlockDeviceId}
              field={interlockField}
              setField={setInterlockField}
              type={interlockType}
              setType={setInterlockType}
            />

            <SectionCard>
              <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
                Display Settings
              </div>

              <Label>Title</Label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 40))}
                placeholder="Example: Main Pump"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  marginBottom: 8,
                }}
              />

              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
                Leave blank to hide the title. Max 40 characters.
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 8 }}>
                  Toggle Preview
                </div>

                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                  This preview shows how the title will appear above the toggle.
                </div>

                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 12,
                    padding: 14,
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {String(title || "").trim() ? (
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 1000,
                        color: "#0f172a",
                        textAlign: "center",
                      }}
                    >
                      {String(title || "").trim()}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        textAlign: "center",
                      }}
                    >
                      No title
                    </div>
                  )}

                  <div
                    style={{
                      width: 80,
                      height: 36,
                      borderRadius: 999,
                      background: "#111827",
                      border: "3px solid #020617",
                      position: "relative",
                      boxShadow: "inset 0 0 10px rgba(0,0,0,0.45)",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: "#22c55e",
                        position: "absolute",
                        left: 4,
                        top: 1,
                        boxShadow: "0 0 14px rgba(34,197,94,0.8)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
                Output that this toggle controls (DO)
              </div>

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

              <Label>Device</Label>
              <select
                value={deviceId || ""}
                onChange={(e) => {
                  const next = String(e.target.value || "");
                  setDeviceId(next);

                  if (!interlockDeviceId) {
                    setInterlockDeviceId(next);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  background: "white",
                  marginBottom: 12,
                }}
              >
                <option value="">— Select device —</option>
                {filteredDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id}
                  </option>
                ))}
              </select>

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
                  marginBottom: 12,
                }}
              >
                <option value="">— Select DO —</option>
                {DO_OPTIONS.map((t) => {
                  const f = String(t.key).toLowerCase();
                  const info = usedMap?.[f];
                  const disabled = deviceId ? isOptionDisabled(f) : true;

                  const usedLabel =
                    info?.widgetId && info.widgetId !== widgetId
                      ? ` (Used${info.title ? `: ${info.title}` : ""}${
                          info.dashboardName || info.dashboardId
                            ? ` / Dashboard: ${
                                info.dashboardName || info.dashboardId
                              }`
                            : ""
                        })`
                      : "";

                  return (
                    <option key={t.key} value={t.key} disabled={disabled}>
                      {t.label}
                      {usedLabel}
                    </option>
                  );
                })}
              </select>

              {usedByOther && (
                <div
                  style={{
                    marginBottom: 12,
                    fontSize: 12,
                    color: "#dc2626",
                    fontWeight: 900,
                  }}
                >
                  {effectiveField.toUpperCase()} is already used
                  {usedByOther.title ? ` by "${usedByOther.title}"` : ""}
                  {usedByOther.dashboardName || usedByOther.dashboardId
                    ? ` on dashboard "${
                        usedByOther.dashboardName || usedByOther.dashboardId
                      }"`
                    : ""}
                  . Choose another DO.
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}
                  >
                    Status
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      fontWeight: 1000,
                      color: usedByOther
                        ? "#dc2626"
                        : isOnlineWithData
                        ? "#16a34a"
                        : "#dc2626",
                    }}
                  >
                    {statusText}
                  </div>
                </div>

                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}
                  >
                    Value
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 18,
                      fontWeight: 1000,
                      color: isOnlineWithData ? "#0f172a" : "#94a3b8",
                      fontFamily: "monospace",
                    }}
                  >
                    {valueText}
                  </div>
                </div>

                <div
                  style={{
                    gridColumn: "1 / -1",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  Bound:{" "}
                  <b>
                    {deviceId || "—"} / {effectiveField || "—"}
                  </b>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
                Tip: Value preview is best-effort from{" "}
                <code>/zhc1921/my-devices</code>.
              </div>
            </SectionCard>
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
            onClick={(e) => {
              e.preventDefault();
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
              e.preventDefault();
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
              opacity: saving ? 0.8 : 1,
            }}
            type="button"
            title={
              !dashboardId
                ? "Missing dashboardId"
                : usedByOther
                ? "This DO is already used"
                : !interlockValid
                ? "Complete interlock setup or disable it"
                : "Apply"
            }
          >
            {saving ? "Saving..." : "Apply"}
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
}