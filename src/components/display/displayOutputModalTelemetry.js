// src/components/display/displayOutputModalTelemetry.js

function resolveDeviceId(row) {
  return String(row?.deviceId ?? row?.device_id ?? "").trim();
}

function readRowStatus(row) {
  const raw = String(
    row?.status ??
      row?.Status ??
      row?.connection_status ??
      row?.connectionStatus ??
      row?.onlineStatus ??
      (row?.online === true ||
      row?.online === 1 ||
      String(row?.online ?? "")
        .trim()
        .toLowerCase() === "true"
        ? "online"
        : "")
  )
    .trim()
    .toLowerCase();

  return raw;
}

function isRowOnline(row) {
  const s = readRowStatus(row);
  return ["online", "connected", "active"].includes(s);
}

function getLastSeen(row) {
  return (
    row?.lastSeen ??
    row?.last_seen ??
    row?.updated_at ??
    row?.updatedAt ??
    row?.created_at ??
    row?.createdAt ??
    "—"
  );
}

function readAOValue(row, field) {
  const f = String(field || "")
    .trim()
    .toLowerCase();

  if (!row || !/^ao[1-2]$/.test(f)) return null;

  const altUpper = f.toUpperCase();
  const n = f.replace("ao", "");
  const altA = `analog_output_${n}`;
  const altB = `analogOutput${n}`;
  const altC = `out${n}`;
  const altD = `ao_${n}`;

  const raw =
    row?.[f] ??
    row?.[altUpper] ??
    row?.[altA] ??
    row?.[altB] ??
    row?.[altC] ??
    row?.[altD];

  return Number.isFinite(Number(raw)) ? Number(raw) : null;
}

function computeMathOutput(liveValue, formula) {
  const f = String(formula || "").trim();
  if (!f) return liveValue;

  const VALUE = liveValue;

  const upper = f.toUpperCase();
  if (upper.startsWith("CONCAT(") && f.endsWith(")")) {
    const inner = f.slice(7, -1);
    const parts = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === '"' && inner[i - 1] !== "\\") inQ = !inQ;

      if (ch === "," && !inQ) {
        parts.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) parts.push(cur.trim());

    return parts
      .map((p) => {
        if (!p) return "";
        if (p === "VALUE" || p === "value") return VALUE ?? "";
        if (p.startsWith('"') && p.endsWith('"')) return p.slice(1, -1);

        try {
          const expr = p.replace(/\bVALUE\b/gi, "VALUE");
          // eslint-disable-next-line no-new-func
          const fn = new Function("VALUE", `return (${expr});`);
          const r = fn(VALUE);
          return r ?? "";
        } catch {
          return "";
        }
      })
      .join("");
  }

  try {
    const expr = f.replace(/\bVALUE\b/gi, "VALUE");
    // eslint-disable-next-line no-new-func
    const fn = new Function("VALUE", `return (${expr});`);
    return fn(VALUE);
  } catch {
    return liveValue;
  }
}

export {
  resolveDeviceId,
  readRowStatus,
  isRowOnline,
  getLastSeen,
  readAOValue,
  computeMathOutput,
};