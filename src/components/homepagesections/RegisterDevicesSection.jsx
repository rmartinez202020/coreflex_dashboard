// src/components/homepagesections/RegisterDevicesSection.jsx
import React from "react";

// ✅ extracted sections
import RegisterDevicesCf2000Section from "./RegisterDevicesCf2000Section";
import RegisterDevicesCf1600Section from "./RegisterDevicesCf1600Section";
import RegisterDevicesTp4000Section from "./RegisterDevicesTp4000Section";

const MODELS = [
  { key: "cf2000", label: "Model CF-2000", desc: "4-DI // 4-DO // 4-AI" },
  { key: "cf1600", label: "Model CF-1600", desc: "4-AI // 2-AO" },
  { key: "tp400", label: "Model TP-400", desc: "8-Thermocouple channels" },
];

export default function RegisterDevicesSection({ onBack }) {
  const [activeModel, setActiveModel] = React.useState(null);

  // VIEW A: MODEL SELECTION
  if (!activeModel) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-sky-800 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg bg-sky-700 hover:bg-sky-600 px-3 py-2 text-sm"
            >
              ← Back
            </button>
            <div>
              <div className="text-lg font-semibold">Register Devices</div>
              <div className="text-xs text-sky-100">
                Select your device model to register/claim a device.
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveModel(m.key)}
              className="w-full rounded-xl px-5 py-4 text-left transition shadow-sm border bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
            >
              <div className="text-lg font-semibold">{m.label}</div>
              <div className="mt-1 text-sm text-slate-600">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // CF-2000
  if (activeModel === "cf2000") {
    return <RegisterDevicesCf2000Section onBack={() => setActiveModel(null)} />;
  }

  // CF-1600
  if (activeModel === "cf1600") {
    return <RegisterDevicesCf1600Section onBack={() => setActiveModel(null)} />;
  }

  // ✅ TP-4000 (extracted)
  if (activeModel === "tp400") {
    return <RegisterDevicesTp4000Section onBack={() => setActiveModel(null)} />;
  }

  return null;
}
