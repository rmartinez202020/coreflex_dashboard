// src/components/homepagesections/DeviceManagerSection.jsx
import React from "react";

// ✅ Extracted sections
import DeviceManagerZhc1921Section from "./DeviceManagerZhc1921Section";
import DeviceManagerZhc1661Section from "./DeviceManagerZhc1661Section";
import DeviceManagerTp4000Section from "./DeviceManagerTp4000Section";

// ✅ Model buttons (inside Home)
const DEVICE_MODELS = [
  { key: "zhc1921", label: "Model ZHC1921 (CF-2000)" },
  { key: "zhc1661", label: "Model ZHC1661 (CF-1600)" },
  { key: "tp4000", label: "Model TP-4000" },
];

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
  const wrapperClass =
    mode === "page"
      ? "mt-4 w-full max-w-full"
      : "mt-10 border-t border-gray-200 pt-6 w-full max-w-full";

  // ✅ Normalize model name so ZHC1921 / zhc1921 both work
  const normalizedModel = String(activeModel || "")
    .trim()
    .toLowerCase();

  // =========================
  // VIEW A: Selector (cards)
  // =========================
  if (!normalizedModel) {
    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Device Manager (Owner Only)
          </h2>

          <span className="text-xs text-gray-500">
            Owner: {ownerEmail}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEVICE_MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveModel(m.key)}
              className="w-full rounded-xl px-5 py-4 text-left transition shadow-sm border bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
            >
              <div className="text-lg font-semibold">
                {m.label}
              </div>

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
  // ZHC1921 (CF-2000)
  // =========================
  if (normalizedModel === "zhc1921") {
    return (
      <DeviceManagerZhc1921Section
        ownerEmail={ownerEmail}
        mode={mode}
        zhc1921Rows={zhc1921Rows}
        setZhc1921Rows={setZhc1921Rows}
        onBack={() => setActiveModel(null)}
      />
    );
  }

  // =========================
  // ZHC1661 (CF-1600)
  // =========================
  if (normalizedModel === "zhc1661") {
    return (
      <DeviceManagerZhc1661Section
        ownerEmail={ownerEmail}
        mode={mode}
        zhc1661Rows={zhc1661Rows}
        setZhc1661Rows={setZhc1661Rows}
        onBack={() => setActiveModel(null)}
      />
    );
  }

  // =========================
  // TP-4000
  // =========================
  if (normalizedModel === "tp4000") {
    return (
      <DeviceManagerTp4000Section
        ownerEmail={ownerEmail}
        mode={mode}
        onBack={() => setActiveModel(null)}
      />
    );
  }

  // =========================
  // UNKNOWN MODEL - SAFE FALLBACK
  // =========================
  return (
    <div className={wrapperClass}>
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="font-semibold text-red-800">
          Unknown device model
        </div>

        <div className="mt-1 text-sm text-red-700">
          Model: {String(activeModel || "unknown")}
        </div>

        <button
          type="button"
          onClick={() => setActiveModel(null)}
          className="mt-4 rounded-lg bg-white border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Back to Device Manager
        </button>
      </div>
    </div>
  );
}