// PushButtonNCPropertiesModal.jsx
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

function Label({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function SectionCard({ children }) {
  return (
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
}

export default function PushButtonNCPropertiesModal({
  open = false,
  pushButton,
  onSave,
  onClose,
  isLaunched = false,
  dashboardId: dashboardIdProp,
  onSaveProject = null,
}) {
  const p = pushButton?.properties || {};

  const MODAL_W = Math.min(1500, window.innerWidth - 80);
  const MODAL_H = Math.min(window.innerHeight - 40, 900);

  const forcedModel = "zhc1921";

  const initialDeviceId = String(p.bindDeviceId || p?.tag?.deviceId || "");
  const initialField = String(p.bindField || p?.tag?.field || "do1");

  const initialInterlock = p.interlock || {};
  const initialInterlockEnabled =
    Boolean(initialInterlock.enabled) || Boolean(p.interlock_enabled);

  const initialInterlockDeviceId = String(
    initialInterlock.deviceId || p.interlock_device_id || initialDeviceId || ""
  );

  const initialInterlockFieldRaw = String(
    initialInterlock.field || p.interlock_field || ""
  ).toLowerCase();

  const initialInterlockTypeRaw = String(
    initialInterlock.type || p.interlock_type || "NO"
  ).toUpperCase();

  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(
    /^do[1-4]$/.test(String(initialField || "").toLowerCase())
      ? initialField
      : "do1"
  );

  const [deviceSearch, setDeviceSearch] = React.useState("");

  const initialTitle = String(p.title ?? pushButton?.title ?? "").trim();
  const [title, setTitle] = React.useState(initialTitle);

  const [interlockEnabled, setInterlockEnabled] = React.useState(
    initialInterlockEnabled
  );

  const [interlockDeviceId, setInterlockDeviceId] = React.useState(
    initialInterlockDeviceId
  );

  const [interlockField, setInterlockField] = React.useState(
    /^di[1-6]$/.test(initialInterlockFieldRaw)
      ? initialInterlockFieldRaw
      : "di1"
  );

  const [interlockType, setInterlockType] = React.useState(
    initialInterlockTypeRaw === "NC" ? "NC" : "NO"
  );

  React.useEffect(() => {
    if (isLaunched && open) onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLaunched, open]);

  React.useEffect(() => {
    if (!open || !pushButton || isLaunched) return;

    const pp = pushButton?.properties || {};
    const f = String(pp.bindField || pp?.tag?.field || "do1");
    const il = pp.interlock || {};
    const nextDeviceId = String(pp.bindDeviceId || pp?.tag?.deviceId || "");

    const nextInterlockEnabled =
      Boolean(il.enabled) || Boolean(pp.interlock_enabled);

    const nextInterlockDeviceId = String(
      il.deviceId || pp.interlock_device_id || nextDeviceId || ""
    );

    const nextInterlockField = String(
      il.field || pp.interlock_field || ""
    ).toLowerCase();

    const nextInterlockType = String(
      il.type || pp.interlock_type || "NO"
    ).toUpperCase();

    setDeviceId(nextDeviceId);
    setField(/^do[1-4]$/.test(f.toLowerCase()) ? f : "do1");
    setDeviceSearch("");
    setTitle(String(pp.title ?? pushButton?.title ?? "").trim());

    setInterlockEnabled(nextInterlockEnabled);
    setInterlockDeviceId(nextInterlockDeviceId);
    setInterlockField(
      /^di[1-6]$/.test(nextInterlockField) ? nextInterlockField : "di1"
    );
    setInterlockType(nextInterlockType === "NC" ? "NC" : "NO");
  }, [open, pushButton?.id, isLaunched]);

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

      const rect = modalRef.current?.getBoundingClientRect();
      const mw = rect?.width ?? MODAL_W;

      const clampedLeft = Math.min(
        window.innerWidth - 20,
        Math.max(20 - (mw - 60), dragRef.current.startLeft + dx)
      );
      const clampedTop = Math.min(
        window.innerHeight - 20,
        Math.max(20, dragRef.current.startTop + dy)
      );

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

    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
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
        if (!token) {
          throw new Error("Missing auth token. Please logout and login again.");
        }

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
    return devices.filter((d) =>
      String(d.id || "").toLowerCase().includes(q)
    );
  }, [devices, deviceSearch]);

  const widgetId = String(pushButton?.id || "").trim();

  const dashboardId = String(
    dashboardIdProp || pushButton?.dashboardId || p.dashboardId || ""
  ).trim();

  const dashboardName = String(
    pushButton?.dashboardName ||
      p.dashboardName ||
      p.dashboardTitle ||
      pushButton?.dashboardTitle ||
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
    if (!pushButton) return;

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
        ...(pushButton?.properties || {}),
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
        interlock_enabled: Boolean(interlockEnabled),
        interlock_device_id: interlockEnabled ? safeInterlockDeviceId : "",
        interlock_field: interlockEnabled ? safeInterlockField : "",
        interlock_type: safeInterlockType,
      };

      const next = { ...pushButton, properties: nextProps };

      onSave?.(next);

      await nextTick();

      if (typeof onSaveProject === "function") {
        await onSaveProject();
      }

      await bindControlDO({
        dashboardId: dash,
        dashboardName: dashName,
        widgetId: wid,
        widgetType: "pushButtonNC",
        title: String(safeTitle || "Push Button NC").trim().slice(0, 120),
        deviceId: dev,
        field: f,
        interlockEnabled: Boolean(interlockEnabled),
        interlockDeviceId: interlockEnabled ? safeInterlockDeviceId : "",
        interlockField: interlockEnabled ? safeInterlockField : "",
        interlockType: safeInterlockType,
        interlockMode: "block_when_active",
      });

      const writeRes = await fetch(`${API_URL}/control-bindings/write`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          dashboardId: dash,
          widgetId: wid,
          value01: 1,
        }),
      });

      if (!writeRes.ok) {
        const errJson = await writeRes.json().catch(() => null);
        const errText = await writeRes.text().catch(() => "");

        throw new Error(
          errJson?.detail?.error ||
            errJson?.detail ||
            errText ||
            "Failed to initialize Push Button NC output to closed state"
        );
      }

      await loadUsed();

      onClose?.();
    } catch (e) {
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

  if (!open || !pushButton || isLaunched) return null;

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
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
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
        {/* KEEP THE REST OF YOUR JSX EXACTLY THE SAME */}
      </div>
    </div>,
    portalTarget
  );
}