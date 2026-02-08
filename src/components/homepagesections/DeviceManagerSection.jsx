import React from "react";

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
      desc: "Backend table for ZHC1661 devices (next).",
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

// ✅ Helper: split labels into 2 lines to save space
function splitTwoLineLabel(label) {
  const s = String(label || "").trim();

  // "Input 1 (0/1)" -> ["Input 1", "0/1"]
  // "Status (online/offline)" -> ["Status", "online/offline"]
  const m = s.match(/^(.*)\s\((.*)\)\s*$/);
  if (m) return [m[1], m[2]];

  // "AI-1 value" -> ["AI-1", "value"]
  const m2 = s.match(/^(AI-\d)\s+(.*)$/i);
  if (m2) return [m2[1], m2[2]];

  // fallback: keep single line
  return [s, ""];
}

export default function DeviceManagerSection({
  ownerEmail,
  activeModel,
  setActiveModel,

  // ✅ NEW: render mode
  // "inline" = inside Home with border-top spacing
  // "page"   = full-page section (no border-top spacing)
  mode = "inline",

  // ZHC1921 table props
  zhc1921Columns = [],
  zhc1921Rows = [],
  setZhc1921Rows,
}) {
  const [newDeviceId, setNewDeviceId] = React.useState("");
  const [err, setErr] = React.useState("");

  const meta = modelMeta(activeModel);

  function onBack() {
    setNewDeviceId("");
    setErr("");
    setActiveModel(null);
  }

  function addZhc1921Device() {
    const id = String(newDeviceId || "").trim();
    if (!id) {
      setErr("Please enter a DEVICE ID.");
      return;
    }

    // digits-only (you can relax later)
    if (!/^\d+$/.test(id)) {
      setErr("DEVICE ID must be numeric (digits only).");
      return;
    }

    const exists = (zhc1921Rows || []).some((r) => String(r.deviceId) === id);
    if (exists) {
      setErr("That DEVICE ID already exists in the table.");
      return;
    }

    setErr("");

    const now = new Date();
    const addedAt = now.toLocaleString();

    const newRow = {
      deviceId: id,
      addedAt,
      ownedBy: "—",
      status: "offline",
      lastSeen: "—",
      in1: 0,
      in2: 0,
      in3: 0,
      in4: 0,
      do1: 0,
      do2: 0,
      do3: 0,
      do4: 0,
      ai1: "",
      ai2: "",
      ai3: "",
      ai4: "",
    };

    setZhc1921Rows((prev) => [newRow, ...(prev || [])]);
    setNewDeviceId("");
  }

  function refreshZhc1921() {
    // placeholder (later: call backend and update rows)
    setZhc1921Rows((prev) => [...(prev || [])]);
  }

  const renderZhc1921Table = () => (
    // ✅ max-w-full + overflow hidden ensures it never spills outside center panel
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden max-w-full">
      {/* ✅ Only horizontal scroll inside this panel */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              {zhc1921Columns.map((c) => {
                const [l1, l2] = splitTwoLineLabel(c.label);

                return (
                  <th
                    key={c.key}
                    className="text-left font-semibold text-slate-700 px-3 py-2 border-b border-slate-200 align-bottom"
                    style={{
                      minWidth: c.minW,
                      whiteSpace: "normal", // ✅ allow wrap
                    }}
                  >
                    <div className="leading-tight">
                      <div className="text-[12px] md:text-[13px]">{l1}</div>
                      {l2 ? (
                        <div className="text-[11px] md:text-[12px] text-slate-500 font-medium">
                          {l2}
                        </div>
                      ) : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {zhc1921Rows.length === 0 ? (
              <tr>
                <td
                  colSpan={zhc1921Columns.length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No devices found.
                </td>
              </tr>
            ) : (
              zhc1921Rows.map((r, idx) => (
                <tr
                  key={r.deviceId + idx}
                  className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  {zhc1921Columns.map((c) => {
                    const val = r[c.key];

                    if (c.key === "status") {
                      const statusLower = String(val || "").toLowerCase();
                      const dotClass =
                        statusLower === "online"
                          ? "bg-emerald-500"
                          : "bg-slate-400";

                      return (
                        <td
                          key={c.key}
                          className="px-3 py-2 border-b border-slate-100 text-slate-800"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block w-2.5 h-2.5 rounded-full ${dotClass}`}
                            />
                            <span className="capitalize">
                              {val || "offline"}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={c.key}
                        className="px-3 py-2 border-b border-slate-100 text-slate-800"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {val === undefined || val === null ? "" : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 text-xs text-slate-500">
        Tip: Scroll horizontally to see all columns.
      </div>
    </div>
  );

  // wrapper spacing depends on mode
  const wrapperClass =
    mode === "page"
      ? "mt-4 w-full max-w-full min-w-0" // ✅ min-w-0 helps in flex layouts
      : "mt-10 border-t border-gray-200 pt-6 w-full max-w-full min-w-0";

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
  // VIEW B: Full “new section”
  // =========================
  return (
    <div className={wrapperClass}>
      {/* Dark header bar like Admin Dashboard */}
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

        {activeModel === "zhc1921" && (
          <button
            onClick={refreshZhc1921}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Content panel */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 max-w-full min-w-0">
        {activeModel === "zhc1921" && (
          <>
            {/* Add device row */}
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
                  className="md:w-[160px] rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90"
                >
                  + Add Device
                </button>
              </div>

              {err && <div className="mt-2 text-xs text-red-600">{err}</div>}

              <div className="mt-2 text-xs text-slate-500">
                Owner only. This will create a new row in the backend table
                (placeholder now → backend next).
              </div>
            </div>

            {/* Table */}
            {renderZhc1921Table()}
          </>
        )}

        {activeModel === "zhc1661" && (
          <div className="text-sm text-slate-700">
            Next: build the ZHC1661 backend table + add device input.
          </div>
        )}

        {activeModel === "tp4000" && (
          <div className="text-sm text-slate-700">
            Next: build the TP-4000 backend table + add device input.
          </div>
        )}
      </div>
    </div>
  );
}
