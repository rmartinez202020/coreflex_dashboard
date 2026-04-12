// src/components/display/useDisplayOutputSettingModal.js
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import {
  bindControlDO,
  deleteControlBinding,
} from "../controls/controlBindings";
import {
  resolveDeviceId,
  readRowStatus,
  isRowOnline,
  getLastSeen,
  readAOValue,
  computeMathOutput,
} from "./displayOutputModalTelemetry";

const FIXED_MODEL = "zhc1661"; // CF-1600
const POLL_MS = 2000;
const PANEL_W = 1040;

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function resolveWidgetId(widget) {
  return String(
    widget?.id ??
      widget?.widgetId ??
      widget?.widget_id ??
      widget?._id ??
      widget?.uuid ??
      widget?.properties?.widgetId ??
      widget?.properties?.widget_id ??
      ""
  ).trim();
}

function resolveDashboardId({ dashboardId, widget }) {
  return String(
    dashboardId ??
      widget?.dashboardId ??
      widget?.dashboard_id ??
      widget?.properties?.dashboardId ??
      widget?.properties?.dashboard_id ??
      ""
  ).trim();
}

function resolveDashboardName({ dashboardName, widget }) {
  return String(
    dashboardName ??
      widget?.dashboardName ??
      widget?.dashboard_name ??
      widget?.properties?.dashboardName ??
      widget?.properties?.dashboard_name ??
      ""
  ).trim();
}

function parseMaybeNumber(v, fallback = "") {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeDecimalInput(v) {
  const s = String(v ?? "");
  let out = "";
  let seenDot = false;
  let seenMinus = false;

  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];

    if (ch >= "0" && ch <= "9") {
      out += ch;
      continue;
    }

    if (ch === "." && !seenDot) {
      out += ch;
      seenDot = true;
      continue;
    }

    if (ch === "-" && i === 0 && !seenMinus) {
      out += ch;
      seenMinus = true;
    }
  }

  return out;
}

export default function useDisplayOutputSettingModal({
  open = true,
  tank,
  dashboardId,
  dashboardName,
  onClose,
  onSave,
  onSaveProject = null,
}) {
  const props = tank?.properties || {};

  const [label, setLabel] = useState(props.label ?? "");
  const [formula, setFormula] = useState(props.formula ?? "");
  const [bindModel, setBindModel] = useState(props.bindModel || FIXED_MODEL);
  const [bindDeviceId, setBindDeviceId] = useState(props.bindDeviceId || "");
  const [bindField, setBindField] = useState(props.bindField || "ao1");
  const [isApplying, setIsApplying] = useState(false);

  const [scaleMin, setScaleMin] = useState(
    props.scaleMin ??
      props.setValue4000 ??
      props.value4000 ??
      tank?.scaleMin ??
      tank?.setValue4000 ??
      tank?.value4000 ??
      0
  );

  const [scaleMax, setScaleMax] = useState(
    props.scaleMax ??
      props.setValue20000 ??
      props.value20000 ??
      tank?.scaleMax ??
      tank?.setValue20000 ??
      tank?.value20000 ??
      100
  );

  const [aoScaleMin, setAoScaleMin] = useState(
    props.aoScaleMin ??
      props.scaleMin ??
      props.setValue4000 ??
      props.value4000 ??
      tank?.aoScaleMin ??
      tank?.scaleMin ??
      tank?.setValue4000 ??
      tank?.value4000 ??
      4000
  );

  const [aoScaleMax, setAoScaleMax] = useState(
    props.aoScaleMax ??
      props.scaleMax ??
      props.setValue20000 ??
      props.value20000 ??
      tank?.aoScaleMax ??
      tank?.scaleMax ??
      tank?.setValue20000 ??
      tank?.value20000 ??
      20000
  );

  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [pollError, setPollError] = useState("");

  useEffect(() => {
    if (!tank) return;
    const p = tank?.properties || {};

    setLabel(p.label ?? tank?.label ?? "");
    setFormula(p.formula ?? tank?.formula ?? "");
    setBindModel(FIXED_MODEL);
    setBindDeviceId(p.bindDeviceId ?? tank?.bindDeviceId ?? "");
    setBindField((p.bindField ?? tank?.bindField) === "ao2" ? "ao2" : "ao1");

    setScaleMin(
      p.scaleMin ??
        p.setValue4000 ??
        p.value4000 ??
        tank?.scaleMin ??
        tank?.setValue4000 ??
        tank?.value4000 ??
        0
    );

    setScaleMax(
      p.scaleMax ??
        p.setValue20000 ??
        p.value20000 ??
        tank?.scaleMax ??
        tank?.setValue20000 ??
        tank?.value20000 ??
        100
    );

    setAoScaleMin(
      p.aoScaleMin ??
        p.scaleMin ??
        p.setValue4000 ??
        p.value4000 ??
        tank?.aoScaleMin ??
        tank?.scaleMin ??
        tank?.setValue4000 ??
        tank?.value4000 ??
        4000
    );

    setAoScaleMax(
      p.aoScaleMax ??
        p.scaleMax ??
        p.setValue20000 ??
        p.value20000 ??
        tank?.aoScaleMax ??
        tank?.scaleMax ??
        tank?.setValue20000 ??
        tank?.value20000 ??
        20000
    );
  }, [tank]);

  useEffect(() => {
    setBindModel(FIXED_MODEL);
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let timer = null;

    async function loadDevices(isFirst = false) {
      try {
        if (isFirst) setDevicesLoading(true);

        const res = await fetch(`${API_URL}/zhc1661/my-devices`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });

        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          throw new Error(
            data?.detail || `Failed to load CF-1600 devices (${res.status})`
          );
        }

        const rows = Array.isArray(data) ? data : [];

        if (!cancelled) {
          setDevices(rows);
          setPollError("");
        }
      } catch (err) {
        if (!cancelled) {
          setPollError(err?.message || "Failed to load device data");
        }
      } finally {
        if (!cancelled) setDevicesLoading(false);
      }
    }

    loadDevices(true);
    timer = window.setInterval(() => loadDevices(false), POLL_MS);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [open]);

  const selectedDevice = useMemo(() => {
    const wanted = String(bindDeviceId || "").trim();
    if (!wanted) return null;
    return devices.find((d) => resolveDeviceId(d) === wanted) || null;
  }, [devices, bindDeviceId]);

  const hasSelectedDevice = !!String(bindDeviceId || "").trim();
  const selectedDeviceStatus = readRowStatus(selectedDevice);
  const selectedDeviceIsOnline =
    hasSelectedDevice && isRowOnline(selectedDevice);

  const rawLiveValue = useMemo(() => {
    return readAOValue(selectedDevice, bindField);
  }, [selectedDevice, bindField]);

  const effectiveLiveValue = selectedDeviceIsOnline ? rawLiveValue : null;

  const numericScaleMin = useMemo(
    () => parseMaybeNumber(scaleMin, ""),
    [scaleMin]
  );

  const numericScaleMax = useMemo(
    () => parseMaybeNumber(scaleMax, ""),
    [scaleMax]
  );

  const numericAoScaleMin = useMemo(
    () => parseMaybeNumber(aoScaleMin, ""),
    [aoScaleMin]
  );

  const numericAoScaleMax = useMemo(
    () => parseMaybeNumber(aoScaleMax, ""),
    [aoScaleMax]
  );

  const scaleError = useMemo(() => {
    if (
      numericScaleMin === "" ||
      numericScaleMax === "" ||
      numericAoScaleMin === "" ||
      numericAoScaleMax === ""
    ) {
      return "All scaling values are required.";
    }

    if (
      !Number.isFinite(Number(numericScaleMin)) ||
      !Number.isFinite(Number(numericScaleMax)) ||
      !Number.isFinite(Number(numericAoScaleMin)) ||
      !Number.isFinite(Number(numericAoScaleMax))
    ) {
      return "Scaling values must be valid numbers.";
    }

    if (Number(numericScaleMin) >= Number(numericScaleMax)) {
      return "Scale Min must be lower than Scale Max.";
    }

    if (Number(numericAoScaleMin) >= Number(numericAoScaleMax)) {
      return "AO Scale Min must be lower than AO Scale Max.";
    }

    return "";
  }, [
    numericScaleMin,
    numericScaleMax,
    numericAoScaleMin,
    numericAoScaleMax,
  ]);

  const effectiveOutputValue = useMemo(() => {
    if (!selectedDeviceIsOnline) return null;
    return computeMathOutput(
      rawLiveValue,
      formula,
      Number(numericScaleMin),
      Number(numericScaleMax)
    );
  }, [
    selectedDeviceIsOnline,
    rawLiveValue,
    formula,
    numericScaleMin,
    numericScaleMax,
  ]);

  const liveErr = pollError;

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [didInitPos, setDidInitPos] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDidInitPos(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (didInitPos) return;

    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const width = Math.min(PANEL_W, Math.floor(w * 0.98));
    const estHeight = 640;

    const left = Math.max(12, Math.floor((w - width) / 2));
    const top = Math.max(12, Math.floor((h - estHeight) / 2));

    setPos({ left, top });
    setDidInitPos(true);
  }, [open, didInitPos]);

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const nextLeft = dragRef.current.startLeft + dx;
    const nextTop = dragRef.current.startTop + dy;

    const margin = 8;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const maxLeft = Math.max(margin, w - margin - 260);
    const maxTop = Math.max(margin, h - margin - 140);

    setPos({
      left: Math.min(Math.max(margin, nextLeft), maxLeft),
      top: Math.min(Math.max(margin, nextTop), maxTop),
    });
  };

  const endDrag = () => {
    dragRef.current.dragging = false;
    setIsDragging(false);
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", endDrag);
  };

  const startDrag = (e) => {
    if (e.button !== 0) return;

    const t = e.target;
    if (
      t?.closest?.("button, input, select, textarea, a, [data-no-drag='true']")
    ) {
      return;
    }

    e.preventDefault();

    dragRef.current.dragging = true;
    setIsDragging(true);
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", endDrag);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", endDrag);
    };
  }, []);

  const canApply = useMemo(() => {
    return (
      !!bindDeviceId &&
      (bindField === "ao1" || bindField === "ao2") &&
      !scaleError
    );
  }, [bindDeviceId, bindField, scaleError]);

  async function handleApply() {
    if (!canApply || isApplying) {
      return;
    }

    const cleanLabel = String(label || "").trim();
    const cleanFormula = String(formula || "").trim();

    const resolvedScaleMin = Number(numericScaleMin);
    const resolvedScaleMax = Number(numericScaleMax);
    const resolvedAoScaleMin = Number(numericAoScaleMin);
    const resolvedAoScaleMax = Number(numericAoScaleMax);

    const nextProps = {
      ...(tank?.properties || {}),
      label: cleanLabel,
      bindModel: FIXED_MODEL,
      bindDeviceId,
      bindField,
      formula: cleanFormula,

      scaleMin: resolvedScaleMin,
      scaleMax: resolvedScaleMax,
      aoScaleMin: resolvedAoScaleMin,
      aoScaleMax: resolvedAoScaleMax,

      setValue4000: resolvedScaleMin,
      setValue20000: resolvedScaleMax,
      value4000: resolvedScaleMin,
      value20000: resolvedScaleMax,

      scalingEnabled: true,
      scalingMode: "ao_reference",
      scalingReferenceMinMilliAmp: resolvedAoScaleMin * 1000,
      scalingReferenceMaxMilliAmp: resolvedAoScaleMax * 1000,

      // ✅ clear persisted setpoint so widget comes back blank after refresh
      value: "",
      lastSetValue: "",
    };

    delete nextProps.title;
    delete nextProps.displayTitle;

    const nextTank = {
      ...tank,
      // ✅ clear persisted setpoint so widget comes back blank after refresh
      value: "",
      lastSetValue: "",

      label: cleanLabel,
      bindModel: FIXED_MODEL,
      bindDeviceId,
      bindField,
      formula: cleanFormula,

      scaleMin: resolvedScaleMin,
      scaleMax: resolvedScaleMax,
      aoScaleMin: resolvedAoScaleMin,
      aoScaleMax: resolvedAoScaleMax,

      setValue4000: resolvedScaleMin,
      setValue20000: resolvedScaleMax,
      value4000: resolvedScaleMin,
      value20000: resolvedScaleMax,

      scalingEnabled: true,
      scalingMode: "ao_reference",
      scalingReferenceMinMilliAmp: resolvedAoScaleMin * 1000,
      scalingReferenceMaxMilliAmp: resolvedAoScaleMax * 1000,

      properties: nextProps,
    };

    delete nextTank.title;
    delete nextTank.displayTitle;

    try {
      setIsApplying(true);

      const resolvedDashboardId = resolveDashboardId({
        dashboardId,
        widget: tank,
      });

      const resolvedDashboardName = resolveDashboardName({
        dashboardName,
        widget: tank,
      });

      const widgetId = resolveWidgetId(tank);
      const deviceId = String(bindDeviceId || "").trim();
      const field = String(bindField || "").trim().toLowerCase();

      if (
        resolvedDashboardId &&
        widgetId &&
        deviceId &&
        /^ao[1-2]$/.test(field)
      ) {
        await bindControlDO({
          dashboardId: resolvedDashboardId,
          dashboardName: resolvedDashboardName,
          widgetId,
          widgetType: "display_output",
          title: "Display Output",
          deviceId,
          field,
          scaleMin: resolvedScaleMin,
          scaleMax: resolvedScaleMax,
          aoScaleMin: resolvedAoScaleMin,
          aoScaleMax: resolvedAoScaleMax,
        });
      } else if (resolvedDashboardId && widgetId) {
        await deleteControlBinding({
          dashboardId: resolvedDashboardId,
          widgetId,
        });
      } else {
        alert("Missing dashboardId or widgetId for Display Output binding");
        return;
      }

      await Promise.resolve(onSave?.(nextTank));
      onClose?.();
    } catch (err) {
      alert(err?.message || "Display Output apply failed");
    } finally {
      setIsApplying(false);
    }
  }

  return {
    FIXED_MODEL,
    PANEL_W,

    label,
    setLabel,
    formula,
    setFormula,
    bindModel,
    setBindModel,
    bindDeviceId,
    setBindDeviceId,
    bindField,
    setBindField,
    isApplying,

    scaleMin,
    setScaleMin,
    scaleMax,
    setScaleMax,
    aoScaleMin,
    setAoScaleMin,
    aoScaleMax,
    setAoScaleMax,

    devices,
    devicesLoading,
    pollError,

    selectedDevice,
    hasSelectedDevice,
    selectedDeviceStatus,
    selectedDeviceIsOnline,
    rawLiveValue,
    effectiveLiveValue,

    numericScaleMin,
    numericScaleMax,
    numericAoScaleMin,
    numericAoScaleMax,
    scaleError,
    effectiveOutputValue,
    liveErr,

    pos,
    isDragging,
    startDrag,

    canApply,
    handleApply,

    sanitizeDecimalInput,
    getLastSeen,
    resolveDeviceId,
  };
}