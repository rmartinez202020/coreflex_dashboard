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
  // ZHC1921 (CF-2000) - Extracted
  // =========================
  if (activeModel === "zhc1921") {
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
  // ZHC1661 (CF-1600) - Extracted
  // =========================
  if (activeModel === "zhc1661") {
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
  // TP-4000 - Extracted
  // =========================
  return (
    <DeviceManagerTp4000Section
      ownerEmail={ownerEmail}
      mode={mode}
      onBack={() => setActiveModel(null)}
    />
  );
}
