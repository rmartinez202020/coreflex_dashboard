// src/components/homepagesections/RegisterDevicesSection.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import { useMySubscriptionSection } from "./useMySubscriptionSection";

// ✅ extracted sections
import RegisterDevicesCf2000Section from "./RegisterDevicesCf2000Section";
import RegisterDevicesCf1600Section from "./RegisterDevicesCf1600Section";
import RegisterDevicesTp4000Section from "./RegisterDevicesTp4000Section";

const MODELS = [
  { key: "cf2000", label: "Model CF-2000", desc: "4-DI // 4-DO // 4-AI" },
  { key: "cf1600", label: "Model CF-1600", desc: "4-AI // 2-AO" },
  { key: "tp400", label: "Model TP-400", desc: "8-Thermocouple channels" },
];

const DEVICE_COUNT_ENDPOINTS = [
  `${API_URL}/zhc1921/my-devices`,
  `${API_URL}/zhc1661/my-devices`,
  `${API_URL}/tp4000/my-devices`,
];

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getPlanName(plan, fallbackKey) {
  const name = String(plan?.name || plan?.plan_name || "").trim();
  if (name) return name;

  const key = String(fallbackKey || "free").trim();
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
}

function getDeviceLimit(plan, subscription) {
  return (
    plan?.deviceLimit ??
    plan?.device_limit ??
    subscription?.device_limit ??
    subscription?.deviceLimit ??
    subscription?.devices_limit ??
    subscription?.devicesLimit ??
    "—"
  );
}

function normalizeDeviceLimit(value) {
  if (value === "Unlimited") return Infinity;
  if (value === "unlimited") return Infinity;

  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function fetchDeviceCount(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    return 0;
  }

  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data.length : 0;
}

export default function RegisterDevicesSection({ onBack }) {
  const [activeModel, setActiveModel] = React.useState(null);
  const [registeredDeviceCount, setRegisteredDeviceCount] = React.useState(0);
  const [loadingDeviceCount, setLoadingDeviceCount] = React.useState(true);

  const {
    subscription,
    loadingSubscription,
    subscriptionError,
    currentPlan,
    currentPlanKey,
  } = useMySubscriptionSection();

  const planName = loadingSubscription
    ? "Loading..."
    : getPlanName(currentPlan, currentPlanKey);

  const deviceLimit = loadingSubscription
    ? "—"
    : getDeviceLimit(currentPlan, subscription);

  const numericDeviceLimit = normalizeDeviceLimit(deviceLimit);

  const deviceLimitReached =
    !loadingDeviceCount &&
    !loadingSubscription &&
    numericDeviceLimit !== Infinity &&
    numericDeviceLimit > 0 &&
    registeredDeviceCount >= numericDeviceLimit;

  const refreshRegisteredDeviceCount = React.useCallback(async () => {
    setLoadingDeviceCount(true);

    try {
      const token = String(getToken() || "").trim();

      if (!token) {
        setRegisteredDeviceCount(0);
        return;
      }

      const counts = await Promise.all(
        DEVICE_COUNT_ENDPOINTS.map((url) => fetchDeviceCount(url))
      );

      const total = counts.reduce((sum, count) => sum + Number(count || 0), 0);
      setRegisteredDeviceCount(total);
    } catch (err) {
      setRegisteredDeviceCount(0);
    } finally {
      setLoadingDeviceCount(false);
    }
  }, []);

  React.useEffect(() => {
    refreshRegisteredDeviceCount();
  }, [refreshRegisteredDeviceCount]);

  const devicesUsedDisplay = loadingDeviceCount
    ? "Loading..."
    : `${registeredDeviceCount} / ${deviceLimit}`;

  const sharedDeviceLimitProps = {
    devicesUsed: registeredDeviceCount,
    deviceLimit,
    deviceLimitReached,
    refreshRegisteredDeviceCount,
  };

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
                {planName}
              </div>
            </div>

            <div
              className={`rounded-lg border px-4 py-3 ${
                deviceLimitReached
                  ? "border-red-300 bg-red-500/20"
                  : "border-sky-500/40 bg-white/10"
              }`}
            >
              <div className="text-xs text-sky-100">Devices Used</div>
              <div className="mt-1 text-base font-semibold text-white">
                {devicesUsedDisplay}
              </div>
            </div>

            <div className="rounded-lg border border-sky-500/40 bg-white/10 px-4 py-3">
              <div className="text-xs text-sky-100">Device Limit</div>
              <div className="mt-1 text-base font-semibold text-white">
                {deviceLimit}
              </div>
            </div>
          </div>

          {deviceLimitReached ? (
            <div className="mt-2 text-xs font-semibold text-yellow-200">
              Device limit reached. Remove a device or upgrade your plan before
              registering another device.
            </div>
          ) : null}

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

  if (activeModel === "cf2000") {
    return (
      <RegisterDevicesCf2000Section
        onBack={() => {
          refreshRegisteredDeviceCount();
          setActiveModel(null);
        }}
        {...sharedDeviceLimitProps}
      />
    );
  }

  if (activeModel === "cf1600") {
    return (
      <RegisterDevicesCf1600Section
        onBack={() => {
          refreshRegisteredDeviceCount();
          setActiveModel(null);
        }}
        {...sharedDeviceLimitProps}
      />
    );
  }

  if (activeModel === "tp400") {
    return (
      <RegisterDevicesTp4000Section
        onBack={() => {
          refreshRegisteredDeviceCount();
          setActiveModel(null);
        }}
        {...sharedDeviceLimitProps}
      />
    );
  }

  return null;
}