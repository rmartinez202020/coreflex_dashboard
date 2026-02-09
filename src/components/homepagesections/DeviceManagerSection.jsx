// src/components/homepagesections/DeviceManagerSection.jsx
import React from "react";
import { API_URL } from "../../config/api";

// ✅ ✅ IMPORTANT: use per-tab auth token (sessionStorage-first)
import { getToken } from "../../utils/authToken";

// ✅ Model buttons (inside Home)
const DEVICE_MODELS = [
  { key: "zhc1921", label: "Model ZHC1921 (CF-2000)" },
  { key: "zhc1661", label: "Model ZHC1661 (CF-1600)" },
  { key: "tp4000", label: "Model TP-4000" },
];

function modelMeta(modelKey) {
  if (modelKey === "zhc1921") {
    return {
      title: "Device Manager — ZHC1921 (CF-2000)",
      desc: "Add authorized devices and view live I/O status from backend.",
    };
  }
  if (modelKey === "zhc1661") {
    return {
      title: "Device Manager — ZHC1661 (CF-1600)",
      desc: "Add authorized devices and view live AI/AO status from backend.",
    };
  }
  if (modelKey === "tp4000") {
    return {
      title: "Device Manager — TP-4000",
      desc: "Backend table for TP-4000 devices (next).",
    };
  }
  return { title: "Device Manager", desc: "" };
}

// ✅ Single source of truth (matches authToken.js, per-tab)
function getAuthToken() {
  return String(getToken() || "").trim();
}

async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = data?.detail || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

/**
 * ✅ Format to: 01/01/2025-8:15AM
 * Safe:
 * - null/empty => "—"
 * - parses ISO / normal strings / unix timestamps (sec or ms)
 * - if parsing fails => returns original text
 */
function formatDateTime(value) {
  if (value === null || value === undefined) return "—";

  const raw = String(value).trim();
  if (!raw || raw === "—" || raw.toLowerCase() === "null") return "—";

  let dt = null;

  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;
    dt = raw.length <= 10 ? new Date(n * 1000) : new Date(n);
  } else {
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) dt = new Date(t);
  }

  if (!dt || Number.isNaN(dt.getTime())) return raw;

  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = String(dt.getFullYear());

  let hours = dt.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const mins = String(dt.getMinutes()).padStart(2, "0");

  return `${mm}/${dd}/${yyyy}-${hours}:${mins}${ampm}`;
}

/**
 * ✅ Normalize backend row keys -> UI keys
 * ZHC1921 likely returns snake_case like:
 * device_id, authorized_at, claimed_by_email, last_seen, di1..di4, do1..do4, ai1..ai4
 */
function normalizeZhc1921Row(r) {
  const row = r || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };

  return {
    deviceId: pick("deviceId", "device_id", "deviceID"),
    addedAt: pick("addedAt", "authorized_at", "authorizedAt", "added_at"),
    ownedBy: pick(
      "ownedBy",
      "claimed_by_email",
      "claimedByEmail",
      "user_email",
      "email"
    ),
    status: pick("status") ?? "offline",
    lastSeen: pick("lastSeen", "last_seen", "lastSeenAt"),

    in1: pick("in1", "di1", "di_1") ?? 0,
    in2: pick("in2", "di2", "di_2") ?? 0,
    in3: pick("in3", "di3", "di_3") ?? 0,
    in4: pick("in4", "di4", "di_4") ?? 0,

    do1: pick("do1") ?? 0,
    do2: pick("do2") ?? 0,
    do3: pick("do3") ?? 0,
    do4: pick("do4") ?? 0,

    ai1: pick("ai1") ?? "",
    ai2: pick("ai2") ?? "",
    ai3: pick("ai3") ?? "",
    ai4: pick("ai4") ?? "",
  };
}

/**
 * ✅ ZHC1661 table per your screenshot:
 * DEVICE ID | Date | User | Status | last seen | AI-1 | AI-2 | AO-1 | AO-2
 *
 * Backend might return:
 * device_id, authorized_at, claimed_by_email, last_seen, ai1, ai2, ao1, ao2
 */
function normalizeZhc1661Row(r) {
  const row = r || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };

  return {
    deviceId: pick("deviceId", "device_id", "deviceID"),
    addedAt: pick("addedAt", "authorized_at", "authorizedAt", "added_at"),
    ownedBy: pick(
      "ownedBy",
      "claimed_by_email",
      "claimedByEmail",
      "user_email",
      "email"
    ),
    status: pick("status") ?? "offline",
    lastSeen: pick("lastSeen", "last_seen", "lastSeenAt"),

    ai1: pick("ai1", "ai_1") ?? "",
    ai2: pick("ai2", "ai_2") ?? "",

    ao1: pick("ao1", "ao_1", "analog_out1", "out1") ?? "",
    ao2: pick("ao2", "ao_2", "analog_out2", "out2") ?? "",
  };
}

export default function DeviceManagerSection({
  ownerEmail,
  activeModel,
  setActiveModel,

  // ✅ render mode
  mode = "inline",

  // ✅ rows passed from Home (optional)
  zhc1921Rows = [],
  setZhc1921Rows,

  zhc1661Rows = [],
  setZhc1661Rows,
}) {
  const [newDeviceId, setNewDeviceId] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const meta = modelMeta(activeModel);

  function onBack() {
    setNewDeviceId("");
    setErr("");
    setActiveModel(null);
  }

  // =========================
  // ZHC1921 (CF-2000)
  // =========================
  async function loadZhc1921() {
    setLoading(true);
    setErr("");

    try {
      const token = getAuthToken();
      if (!token) {
        setZhc1921Rows?.([]);
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const rows = await apiFetch("/zhc1921/devices", { method: "GET" });
      const list = Array.isArray(rows) ? rows : [];
      setZhc1921Rows?.(list.map(normalizeZhc1921Row));
    } catch (e) {
      setErr(e.message || "Failed to load devices.");
    } finally {
      setLoading(false);
    }
  }

  async function addZhc1921Device() {
    const id = String(newDeviceId || "").trim();
    if (!id) return setErr("Please enter a DEVICE ID.");
    if (!/^\d+$/.test(id))
      return setErr("DEVICE ID must be numeric (digits only).");

    setLoading(true);
    setErr("");
    try {
      await apiFetch("/zhc1921/devices", {
        method: "POST",
        body: JSON.stringify({ device_id: id }),
      });

      setNewDeviceId("");
      await loadZhc1921();
    } catch (e) {
      setErr(e.message || "Failed to add device.");
    } finally {
      setLoading(false);
    }
  }

  function refreshZhc1921() {
    loadZhc1921();
  }

  // =========================
  // ZHC1661 (CF-1600)
  // =========================
  async function loadZhc1661() {
    setLoading(true);
    setErr("");

    try {
      const token = getAuthToken();
      if (!token) {
        setZhc1661Rows?.([]);
        throw new Error("Missing auth token. Please logout and login again.");
      }

      // ✅ Backend endpoint for CF-1600 manager
      // Create this in backend: GET /zhc1661/devices
      const rows = await apiFetch("/zhc1661/devices", { method: "GET" });

      const list = Array.isArray(rows) ? rows : [];
      setZhc1661Rows?.(list.map(normalizeZhc1661Row));
    } catch (e) {
      setErr(e.message || "Failed to load devices.");
    } finally {
      setLoading(false);
    }
  }

  async function addZhc1661Device() {
    const id = String(newDeviceId || "").trim();
    if (!id) return setErr("Please enter a DEVICE ID.");
    if (!/^\d+$/.test(id))
      return setErr("DEVICE ID must be numeric (digits only).");

    setLoading(true);
    setErr("");
    try {
      // ✅ Backend endpoint: POST /zhc1661/devices { device_id }
      await apiFetch("/zhc1661/devices", {
        method: "POST",
        body: JSON.stringify({ device_id: id }),
      });

      setNewDeviceId("");
      await loadZhc1661();
    } catch (e) {
      setErr(e.message || "Failed to add device.");
    } finally {
      setLoading(false);
    }
  }

  function refreshZhc1661() {
    loadZhc1661();
  }

  // ✅ Load from backend when model opens
  React.useEffect(() => {
    if (activeModel === "zhc1921") loadZhc1921();
    if (activeModel === "zhc1661") loadZhc1661();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModel]);

  // =========================
  // Tables
  // =========================
  const renderZhc1921Table = () => (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden w-full max-w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full table-auto text-[12px]">
          <thead>
            <tr className="bg-blue-200">
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[145px]">
                DEVICE ID
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[110px]">
                Date
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[220px]">
                User
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[95px]">
                Status
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[110px]">
                last seen
              </th>

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-2
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-3
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-4
              </th>

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DO 1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DO 2
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DO 3
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DO 4
              </th>

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-2
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-3
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-4
              </th>
            </tr>

            <tr className="bg-white text-[11px]">
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 text-left text-slate-700 border-b border-slate-200">
                online/offline
              </th>
              <th className="px-1.5 py-1 border-b border-slate-200" />

              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>

              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>

              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={17} className="px-3 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : !zhc1921Rows || zhc1921Rows.length === 0 ? (
              <tr>
                <td colSpan={17} className="px-3 py-6 text-center text-slate-500">
                  No devices found.
                </td>
              </tr>
            ) : (
              zhc1921Rows.map((r, idx) => {
                const statusLower = String(r?.status || "").toLowerCase();
                const dotClass =
                  statusLower === "online" ? "bg-emerald-500" : "bg-slate-400";

                return (
                  <tr
                    key={(r?.deviceId || "row") + idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800 truncate">
                      {r?.deviceId ?? ""}
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800 truncate">
                      {formatDateTime(r?.addedAt)}
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800">
                      <div className="truncate" title={r?.ownedBy ?? ""}>
                        {r?.ownedBy ?? "—"}
                      </div>
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${dotClass}`}
                        />
                        <span className="capitalize">
                          {r?.status || "offline"}
                        </span>
                      </div>
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800 truncate">
                      {formatDateTime(r?.lastSeen)}
                    </td>

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in1 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in2 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in3 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in4 ?? "")}
                    </td>

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do1 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do2 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do3 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do4 ?? "")}
                    </td>

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai1 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai2 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai3 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai4 ?? ""}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderZhc1661Table = () => (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden w-full max-w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full table-auto text-[12px]">
          <thead>
            {/* ✅ Row 1 (BLUE TITLES) */}
            <tr className="bg-blue-200">
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[145px]">
                DEVICE ID
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[110px]">
                Date
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[220px]">
                User
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[95px]">
                Status
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[110px]">
                last seen
              </th>

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-2
              </th>

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AO-1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AO-2
              </th>
            </tr>

            {/* ✅ Row 2 (SUBTITLES) */}
            <tr className="bg-white text-[11px]">
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 text-left text-slate-700 border-b border-slate-200">
                online/offline
              </th>
              <th className="px-1.5 py-1 border-b border-slate-200" />

              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>

              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : !zhc1661Rows || zhc1661Rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                  No devices found.
                </td>
              </tr>
            ) : (
              zhc1661Rows.map((r, idx) => {
                const statusLower = String(r?.status || "").toLowerCase();
                const dotClass =
                  statusLower === "online" ? "bg-emerald-500" : "bg-slate-400";

                return (
                  <tr
                    key={(r?.deviceId || "row") + idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800 truncate">
                      {r?.deviceId ?? ""}
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800 truncate">
                      {formatDateTime(r?.addedAt)}
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800">
                      <div className="truncate" title={r?.ownedBy ?? ""}>
                        {r?.ownedBy ?? "—"}
                      </div>
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${dotClass}`}
                        />
                        <span className="capitalize">
                          {r?.status || "offline"}
                        </span>
                      </div>
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800 truncate">
                      {formatDateTime(r?.lastSeen)}
                    </td>

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai1 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai2 ?? ""}
                    </td>

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ao1 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ao2 ?? ""}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // wrapper spacing depends on mode
  const wrapperClass =
    mode === "page"
      ? "mt-4 w-full max-w-full"
      : "mt-10 border-t border-gray-200 pt-6 w-full max-w-full";

  // =========================
  // VIEW A: Selector (cards)
  // =========================
  if (!activeModel) {
    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Device Manager (Owner Only)
          </h2>
          <span className="text-xs text-gray-500">Owner: {ownerEmail}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEVICE_MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveModel(m.key)}
              className="w-full rounded-xl px-5 py-4 text-left transition shadow-sm border bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
            >
              <div className="text-lg font-semibold">{m.label}</div>
              <div className="text-sm text-slate-600">
                Manage authorized devices and view live I/O status.
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // =========================
  // VIEW B: Full section
  // =========================
  const showRefresh = activeModel === "zhc1921" || activeModel === "zhc1661";

  return (
    <div className={wrapperClass}>
      <div className="rounded-xl bg-slate-700 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
          >
            ← Back
          </button>
          <div>
            <div className="text-lg font-semibold">{meta.title}</div>
            <div className="text-xs text-slate-200">{meta.desc}</div>
          </div>
        </div>

        {showRefresh && (
          <button
            onClick={() => {
              if (activeModel === "zhc1921") refreshZhc1921();
              if (activeModel === "zhc1661") refreshZhc1661();
            }}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 w-full max-w-full">
        {/* =========================
            ZHC1921
            ========================= */}
        {activeModel === "zhc1921" && (
          <>
            <div className="mb-4">
              <div className="text-sm font-semibold text-slate-900 mb-2">
                Add Device ID (authorized backend device)
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  placeholder="Enter DEVICE ID (example: 1921251024070670)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />

                <button
                  onClick={addZhc1921Device}
                  className="md:w-[160px] rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
                  disabled={loading}
                >
                  + Add Device
                </button>
              </div>

              {err && <div className="mt-2 text-xs text-red-600">{err}</div>}

              <div className="mt-2 text-xs text-slate-500">
                Owner only. This will create a new row in the backend table.
              </div>
            </div>

            {renderZhc1921Table()}
          </>
        )}

        {/* =========================
            ZHC1661
            ========================= */}
        {activeModel === "zhc1661" && (
          <>
            <div className="mb-4">
              <div className="text-sm font-semibold text-slate-900 mb-2">
                Add Device ID (authorized backend device)
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  placeholder="Enter DEVICE ID"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />

                <button
                  onClick={addZhc1661Device}
                  className="md:w-[160px] rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
                  disabled={loading}
                >
                  + Add Device
                </button>
              </div>

              {err && <div className="mt-2 text-xs text-red-600">{err}</div>}

              <div className="mt-2 text-xs text-slate-500">
                Owner only. This will create a new row in the backend table.
              </div>

              <div className="mt-2 text-xs text-slate-500">
                Note: backend endpoints expected:{" "}
                <span className="font-semibold">GET /zhc1661/devices</span> and{" "}
                <span className="font-semibold">POST /zhc1661/devices</span>
              </div>
            </div>

            {renderZhc1661Table()}
          </>
        )}

        {/* =========================
            TP-4000 placeholder
            ========================= */}
        {activeModel === "tp4000" && (
          <div className="text-sm text-slate-700">
            Next: build the TP-4000 backend table + add device input.
          </div>
        )}
      </div>
    </div>
  );
}
