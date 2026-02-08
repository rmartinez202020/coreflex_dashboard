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

export default function DeviceManagerSection({
  ownerEmail,
  activeModel,
  setActiveModel,

  // ✅ render mode
  // "inline" = inside Home with border-top spacing
  // "page"   = full-page section (no border-top spacing)
  mode = "inline",

  // rows
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
      addedAt, // ✅ maps to "Date"
      ownedBy: "—", // ✅ maps to "User"
      status: "offline",
      lastSeen: "—",

      // ✅ DI (0/1)
      in1: 0,
      in2: 0,
      in3: 0,
      in4: 0,

      // ✅ DO (0/1)
      do1: 0,
      do2: 0,
      do3: 0,
      do4: 0,

      // ✅ AI values
      ai1: "",
      ai2: "",
      ai3: "",
      ai4: "",
    };

    setZhc1921Rows?.((prev) => [newRow, ...(prev || [])]);
    setNewDeviceId("");
  }

  function refreshZhc1921() {
    setZhc1921Rows?.((prev) => [...(prev || [])]);
  }

  // ✅ Spreadsheet-style EXACT headers:
  // Row 1 (blue): DEVICE ID | Date | User | Status | last seen | DI-1..DI-4 | DO1..DO4 | AI-1..AI-4
  // Row 2 (white):         |      |      | online/offline |     | 0/1.. | 0/1.. | value..
  const renderZhc1921Table = () => (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden w-full max-w-full">
      {/* horizontal scroll ONLY inside this box */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-max w-full text-sm">
          <thead className="sticky top-0 z-10">
            {/* ✅ Row 1 (BLUE TITLES) */}
            <tr className="bg-blue-200">
              <th
                className="text-left font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 180 }}
              >
                DEVICE ID
              </th>
              <th
                className="text-left font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 140 }}
              >
                Date
              </th>
              <th
                className="text-left font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 140 }}
              >
                User
              </th>
              <th
                className="text-left font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 150 }}
              >
                Status
              </th>
              <th
                className="text-left font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 140 }}
              >
                last seen
              </th>

              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 90 }}
              >
                DI-1
              </th>
              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 90 }}
              >
                DI-2
              </th>
              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 90 }}
              >
                DI-3
              </th>
              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 90 }}
              >
                DI-4
              </th>

              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 90 }}
              >
                DO 1
              </th>
              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 90 }}
              >
                DO 2
              </th>
              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 90 }}
              >
                DO 3
              </th>
              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 90 }}
              >
                DO 4
              </th>

              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 100 }}
              >
                AI-1
              </th>
              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 100 }}
              >
                AI-2
              </th>
              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 100 }}
              >
                AI-3
              </th>
              <th
                className="text-center font-bold text-slate-900 px-3 py-2 border-b border-blue-300"
                style={{ minWidth: 100 }}
              >
                AI-4
              </th>
            </tr>

            {/* ✅ Row 2 (SUBTITLES) */}
            <tr className="bg-white">
              <th className="px-3 py-1.5 border-b border-slate-200" />
              <th className="px-3 py-1.5 border-b border-slate-200" />
              <th className="px-3 py-1.5 border-b border-slate-200" />
              <th className="px-3 py-1.5 text-left text-xs text-slate-700 border-b border-slate-200">
                online/offline
              </th>
              <th className="px-3 py-1.5 border-b border-slate-200" />

              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                0/1
              </th>

              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                0/1
              </th>

              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-slate-700 border-b border-slate-200">
                value
              </th>
            </tr>
          </thead>

          <tbody>
            {!zhc1921Rows || zhc1921Rows.length === 0 ? (
              <tr>
                <td colSpan={17} className="px-4 py-8 text-center text-slate-500">
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
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800">
                      {r?.deviceId ?? ""}
                    </td>

                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800">
                      {r?.addedAt ?? "—"}
                    </td>

                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800">
                      {r?.ownedBy ?? "—"}
                    </td>

                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${dotClass}`}
                        />
                        <span className="capitalize">
                          {r?.status || "offline"}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800">
                      {r?.lastSeen ?? "—"}
                    </td>

                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in1 ?? "")}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in2 ?? "")}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in3 ?? "")}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in4 ?? "")}
                    </td>

                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do1 ?? "")}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do2 ?? "")}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do3 ?? "")}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do4 ?? "")}
                    </td>

                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {r?.ai1 ?? ""}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {r?.ai2 ?? ""}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {r?.ai3 ?? ""}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-slate-800 text-center">
                      {r?.ai4 ?? ""}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 text-xs text-slate-500">
        Tip: If needed, scroll horizontally inside this table only.
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
  // VIEW B: Full “new section”
  // =========================
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

        {activeModel === "zhc1921" && (
          <button
            onClick={refreshZhc1921}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 w-full max-w-full">
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
