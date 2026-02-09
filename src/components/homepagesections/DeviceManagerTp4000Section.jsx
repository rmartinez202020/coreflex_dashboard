// src/components/homepagesections/DeviceManagerTp4000Section.jsx
import React from "react";

// ✅ TP-4000 columns (match your sheet)
const TP4000_TE_COLUMNS = [
  { key: "te101", label: "TE-101" },
  { key: "te102", label: "TE-102" },
  { key: "te103", label: "TE-103" },
  { key: "te104", label: "TE-104" },
  { key: "te105", label: "TE-105" },
  { key: "te106", label: "TE-106" },
  { key: "te107", label: "TE-107" },
  { key: "te108", label: "TE-108" },
];

export default function DeviceManagerTp4000Section({
  ownerEmail,
  onBack,
  mode = "inline",
}) {
  const [tp4000Loading] = React.useState(false);
  const [tp4000Rows] = React.useState([]); // placeholder until backend exists

  const wrapperClass =
    mode === "page"
      ? "mt-4 w-full max-w-full"
      : "mt-10 border-t border-gray-200 pt-6 w-full max-w-full";

  const renderTp4000Table = () => (
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

              {TP4000_TE_COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[70px]"
                >
                  {c.label}
                </th>
              ))}
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

              {TP4000_TE_COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="px-1 py-1 text-center text-slate-700 border-b border-slate-200"
                >
                  value
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {tp4000Loading ? (
              <tr>
                <td
                  colSpan={5 + TP4000_TE_COLUMNS.length}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : !tp4000Rows || tp4000Rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5 + TP4000_TE_COLUMNS.length}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No devices found.
                </td>
              </tr>
            ) : (
              tp4000Rows.map((r, idx) => {
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
                      {r?.addedAt ?? "—"}
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
                      {r?.lastSeen ?? "—"}
                    </td>

                    {TP4000_TE_COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate"
                      >
                        {r?.[c.key] ?? ""}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={wrapperClass}>
      <div className="rounded-xl bg-slate-700 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBack?.()}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
          >
            ← Back
          </button>

          <div>
            <div className="text-lg font-semibold">Device Manager — TP-4000</div>
            <div className="text-xs text-slate-200">
              Backend table for TP-4000 devices (next).
            </div>
          </div>
        </div>

        {/* ✅ reserved spot for future Refresh button when backend exists */}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 w-full max-w-full">
        {renderTp4000Table()}

        {!!ownerEmail && (
          <div className="mt-3 text-[11px] text-slate-400">Owner: {ownerEmail}</div>
        )}
      </div>
    </div>
  );
}
