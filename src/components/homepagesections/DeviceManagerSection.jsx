import React from "react";

const DEVICE_MODELS = [
  { key: "zhc1921", label: "Model ZHC1921 (CF-2000)" },
  { key: "zhc1661", label: "Model ZHC1661 (CF-1600)" },
  { key: "tp4000", label: "Model TP-4000" },
];

export default function DeviceManagerSection({
  ownerEmail,
  activeModel,
  setActiveModel,
  renderZhc1921Table,
}) {
  return (
    <div className="mt-10 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Device Manager (Owner Only)
        </h2>
        <span className="text-xs text-gray-500">
          Owner: {ownerEmail || "unknown"}
        </span>
      </div>

      {/* 3 model buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEVICE_MODELS.map((m) => {
          const active = activeModel === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setActiveModel(m.key)}
              className={[
                "w-full rounded-xl px-5 py-4 text-left transition shadow-sm border",
                active
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200",
              ].join(" ")}
            >
              <div className="text-lg font-semibold">{m.label}</div>
              <div className={active ? "text-sm opacity-80" : "text-sm text-slate-600"}>
                Manage authorized devices and view live I/O status.
              </div>
            </button>
          );
        })}
      </div>

      {/* Table only for ZHC1921 */}
      {activeModel === "zhc1921" && renderZhc1921Table()}

      {/* Placeholders for the other 2 models */}
      {activeModel === "zhc1661" && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="font-semibold text-slate-900">ZHC1661 (CF-1600)</div>
          <div className="text-sm text-slate-600">
            Next: show the backend table for ZHC1661 devices.
          </div>
        </div>
      )}

      {activeModel === "tp4000" && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="font-semibold text-slate-900">TP-4000</div>
          <div className="text-sm text-slate-600">
            Next: show the backend table for TP-4000 devices.
          </div>
        </div>
      )}
    </div>
  );
}
