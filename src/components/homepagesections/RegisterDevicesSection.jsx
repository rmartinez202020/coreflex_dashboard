// src/components/homepagesections/RegisterDevicesSection.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

// ✅ extracted sections
import RegisterDevicesCf2000Section from "./RegisterDevicesCf2000Section";
import RegisterDevicesCf1600Section from "./RegisterDevicesCf1600Section";
import RegisterDevicesTp4000Section from "./RegisterDevicesTp4000Section";

const MODELS = [
  { key: "cf2000", label: "Model CF-2000", desc: "4-DI // 4-DO // 4-AI" },
  { key: "cf1600", label: "Model CF-1600", desc: "4-AI // 2-AO" },
  { key: "tp400", label: "Model TP-400", desc: "8-Thermocouple channels" },
];

function formatPlanName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Free";

  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function normalizeSubscription(data) {
  const source =
    data?.subscription ||
    data?.item ||
    data?.data ||
    data?.current_subscription ||
    data ||
    {};

  const planKey =
    source?.plan_key ||
    source?.planKey ||
    source?.plan ||
    source?.current_plan_key ||
    source?.currentPlanKey ||
    "free";

  const deviceLimit =
    source?.device_limit ??
    source?.deviceLimit ??
    source?.devices_limit ??
    source?.devicesLimit ??
    source?.max_devices ??
    source?.maxDevices ??
    1;

  const devicesUsed =
    source?.devices_used ??
    source?.devicesUsed ??
    source?.device_count ??
    source?.deviceCount ??
    source?.registered_devices ??
    source?.registeredDevices ??
    0;

  return {
    planName: formatPlanName(planKey),
    deviceLimit,
    devicesUsed,
  };
}

export default function RegisterDevicesSection({ onBack }) {
  const [activeModel, setActiveModel] = React.useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = React.useState({
    planName: "Loading...",
    deviceLimit: "—",
    devicesUsed: "—",
  });
  const [subscriptionError, setSubscriptionError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    const loadSubscription = async () => {
      try {
        const token = String(getToken() || "").trim();

        if (!token) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch(`${API_URL}/billing/my-subscription`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || "Unable to load subscription.");
        }

        if (cancelled) return;

        setSubscriptionInfo(normalizeSubscription(data));
        setSubscriptionError("");
      } catch (err) {
        if (cancelled) return;

        setSubscriptionInfo({
          planName: "Unavailable",
          deviceLimit: "—",
          devicesUsed: "—",
        });
        setSubscriptionError(err?.message || "Unable to load subscription.");
      }
    };

    loadSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  // VIEW A: MODEL SELECTION
  if (!activeModel) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-sky-800 text-white px-4 py-4">
          <div className="flex items-center justify-between">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-sky-500/40 bg-white/10 px-4 py-3">
              <div className="text-xs text-sky-100">Current Plan</div>
              <div className="mt-1 text-base font-semibold text-white">
                {subscriptionInfo.planName}
              </div>
            </div>

            <div className="rounded-lg border border-sky-500/40 bg-white/10 px-4 py-3">
              <div className="text-xs text-sky-100">Devices Used</div>
              <div className="mt-1 text-base font-semibold text-white">
                {subscriptionInfo.devicesUsed} / {subscriptionInfo.deviceLimit}
              </div>
            </div>

            <div className="rounded-lg border border-sky-500/40 bg-white/10 px-4 py-3">
              <div className="text-xs text-sky-100">Device Limit</div>
              <div className="mt-1 text-base font-semibold text-white">
                {subscriptionInfo.deviceLimit}
              </div>
            </div>
          </div>

          {subscriptionError ? (
            <div className="mt-2 text-xs text-yellow-200">
              {subscriptionError}
            </div>
          ) : null}
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