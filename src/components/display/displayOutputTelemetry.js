// src/components/display/displayOutputTelemetry.js

function normalizeField(field) {
  return String(field || "").trim().toLowerCase();
}

function getFieldAliases(f) {
  if (/^ai\d+$/.test(f)) {
    const n = f.replace("ai", "");
    return [
      `a${n}`,
      `A${n}`,
      `analog${n}`,
      `ANALOG${n}`,
      `ai_${n}`,
      `AI_${n}`,
      `ai-${n}`,
      `AI-${n}`,
      `analog_${n}`,
      `ANALOG_${n}`,
      `analog-${n}`,
      `ANALOG-${n}`,
    ];
  }

  if (/^ao\d+$/.test(f)) {
    const n = f.replace("ao", "");
    return [
      `ao_${n}`,
      `AO_${n}`,
      `ao-${n}`,
      `AO-${n}`,
      `analogout${n}`,
      `ANALOGOUT${n}`,
      `analog_out_${n}`,
      `ANALOG_OUT_${n}`,
      `analog-out-${n}`,
      `ANALOG-OUT-${n}`,
      `output${n}`,
      `OUTPUT${n}`,
      `ao${n}`,
      `AO${n}`,
    ];
  }

  return [];
}

function getTelemetryRow(telemetryMap, model, deviceId) {
  if (!telemetryMap || !deviceId) return null;

  const m = String(model || "").trim().toLowerCase();
  const id = String(deviceId || "").trim();
  if (!id) return null;

  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];
  if (telemetryMap?.[id]) return telemetryMap[id];

  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

function getTelemetryStatus(row) {
  if (!row || typeof row !== "object") return "offline";

  const raw =
    row?.status ??
    row?.deviceStatus ??
    row?.telemetryStatus ??
    row?.onlineStatus ??
    row?.connectionStatus ??
    row?.state ??
    row?.online ??
    row?.is_online ??
    row?.connected ??
    "";

  const s = String(raw || "").trim().toLowerCase();

  if (
    s === "offline" ||
    s === "false" ||
    s === "0" ||
    s === "down" ||
    s === "disconnected" ||
    s === "not_running" ||
    s === "not running"
  ) {
    return "offline";
  }

  if (
    s === "online" ||
    s === "true" ||
    s === "1" ||
    s === "up" ||
    s === "connected"
  ) {
    return "online";
  }

  if (row?.online === true) return "online";
  if (row?.online === false) return "offline";
  if (row?.is_online === true) return "online";
  if (row?.is_online === false) return "offline";
  if (row?.connected === true) return "online";
  if (row?.connected === false) return "offline";

  return s || "offline";
}

function getTelemetryValue(row, field) {
  if (!row || !field) return null;

  const f = normalizeField(field);
  if (!f) return null;

  const direct = [
    f,
    f.toLowerCase(),
    f.toUpperCase(),
    f.replace(/(\D+)(\d+)/, "$1_$2"),
    f.replace(/(\D+)(\d+)/, "$1-$2"),
  ];

  for (const key of direct) {
    if (row[key] !== undefined) return row[key];
  }

  const extra = getFieldAliases(f);
  for (const key of extra) {
    if (row[key] !== undefined) return row[key];
  }

  const nestedContainers = [
    row.data,
    row.row,
    row.device,
    row.telemetry,
    row.values,
    row.payload,
    row.latest,
    row.readings,
    row.tags,
  ].filter(Boolean);

  for (const obj of nestedContainers) {
    for (const key of direct) {
      if (obj?.[key] !== undefined) return obj[key];
    }

    const nestedExtra = getFieldAliases(f);
    for (const key of nestedExtra) {
      if (obj?.[key] !== undefined) return obj[key];
    }
  }

  const tagArrays = [row.tags, row.points, row.values, row.readings].filter(
    Array.isArray
  );

  for (const arr of tagArrays) {
    const hit = arr.find((item) => {
      const name = String(
        item?.name ?? item?.tag ?? item?.field ?? item?.key ?? item?.id ?? ""
      )
        .trim()
        .toLowerCase();

      const alt1 = f.replace(/(\D+)(\d+)/, "$1_$2");
      const alt2 = f.replace(/(\D+)(\d+)/, "$1-$2");
      const extraNames = getFieldAliases(f).map((x) => String(x).toLowerCase());

      return (
        name === f ||
        name === alt1 ||
        name === alt2 ||
        extraNames.includes(name)
      );
    });

    if (hit) {
      const v = hit.value ?? hit.val ?? hit.reading ?? hit.data;
      if (v !== undefined) return v;
    }
  }

  return null;
}

export {
  normalizeField,
  getFieldAliases,
  getTelemetryRow,
  getTelemetryStatus,
  getTelemetryValue,
};