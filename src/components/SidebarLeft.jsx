// SidebarLeft.jsx
import React, { useState } from "react";
import {
  StandardTankIcon,
  HorizontalTankIcon,
  VerticalTankIcon,
  SiloTankIcon,
} from "./ProTankIcon";

import DraggableControls from "./DraggableControls";

import {
  DraggableLedCircle,
  DraggableStatusTextBox,
  DraggableBlinkingAlarm,
  DraggableStateImage,
  DraggableCounterInput,
} from "./indicators";

function WirelessTankIcon({ size = 145 }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.72)}
      viewBox="0 0 260 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <g
        stroke="#dbeafe"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Main tank */}
        <path d="M18 45 L104 25 L232 50 L145 73 Z" />
        <path d="M18 45 L18 112 L145 142 L145 73 Z" />
        <path d="M145 73 L232 50 L232 116 L145 142 Z" />

        {/* Top rim */}
        <path d="M24 49 L104 31 L224 53" opacity="0.9" />
        <path d="M145 78 L226 57" opacity="0.9" />

        {/* Hidden internal lines */}
        <path d="M18 112 L145 91 L232 116" strokeDasharray="7 7" opacity="0.65" />
        <path d="M145 73 L145 142" strokeDasharray="7 7" opacity="0.65" />
        <path d="M104 25 L104 91" strokeDasharray="7 7" opacity="0.45" />

        {/* Top wireless/service box */}
        <path d="M62 36 L62 14 L103 6 L146 17 L146 42 L103 52 Z" />
        <path d="M62 14 L103 26 L146 17" />
        <path d="M103 26 L103 52" />
        <path d="M66 37 L103 46 L141 38" opacity="0.8" />

        {/* Top circular port */}
        <ellipse cx="78" cy="27" rx="12" ry="15" />
        <ellipse cx="78" cy="27" rx="6" ry="10" />
        <path d="M88 20 L96 18" />
        <path d="M88 27 L98 27" />
        <path d="M88 34 L96 37" />

        {/* Side latches */}
        <path d="M36 67 L52 71 L52 88 L36 84 Z" />
        <path d="M38 67 L44 59 L52 71" />
        <path d="M40 74 L48 76" />

        <path d="M70 75 L88 79 L88 97 L70 93 Z" />
        <path d="M72 75 L80 67 L88 79" />
        <path d="M75 83 L84 85" />

        {/* Front lower circular ports */}
        <ellipse cx="44" cy="103" rx="10" ry="15" />
        <ellipse cx="44" cy="103" rx="5" ry="10" />

        <ellipse cx="82" cy="114" rx="10" ry="15" />
        <ellipse cx="82" cy="114" rx="5" ry="10" />

        {/* Feet */}
        <path d="M42 119 L42 136 L63 136 L63 124" />
        <path d="M179 134 L179 146 L204 146 L204 127" />

        {/* Small bottom outline */}
        <path d="M28 115 L145 142 L223 119" opacity="0.8" />
      </g>
    </svg>
  );
}

export default function SidebarLeft({
  isLeftCollapsed,
  setIsLeftCollapsed,
  activePage,
  setActivePage,
  showDevices,
  setShowDevices,
  showLevelSensors,
  setShowLevelSensors,
  dashboardMode,
  onSaveProject,
  onRequestRestore,
  lastSavedAt,
  onGoHome,
  onGoMainDashboard,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showIndicators, setShowIndicators] = useState(false);
  const [showDeviceControls, setShowDeviceControls] = useState(false);
  const [showWirelessLevelSensor, setShowWirelessLevelSensor] = useState(false);

  const openOnly = (section) => {
    if (section === "indicators") {
      setShowIndicators((prev) => {
        const next = !prev;
        if (next) {
          setShowLevelSensors(false);
          setShowDeviceControls(false);
          setShowWirelessLevelSensor(false);
        }
        return next;
      });
      return;
    }

    if (section === "levelsensors") {
      setShowLevelSensors((prev) => {
        const next = !prev;
        if (next) {
          setShowIndicators(false);
          setShowDeviceControls(false);
          setShowWirelessLevelSensor(false);
        }
        return next;
      });
      return;
    }

    if (section === "devicecontrols") {
      setShowDeviceControls((prev) => {
        const next = !prev;
        if (next) {
          setShowIndicators(false);
          setShowLevelSensors(false);
          setShowWirelessLevelSensor(false);
        }
        return next;
      });
      return;
    }

    if (section === "wirelesslevelsensor") {
      setShowWirelessLevelSensor((prev) => {
        const next = !prev;
        if (next) {
          setShowIndicators(false);
          setShowLevelSensors(false);
          setShowDeviceControls(false);
        }
        return next;
      });
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return date.toLocaleString();
  };

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    if (isSaving) return;

    setIsSaving(true);
    setSaved(false);

    try {
      await onSaveProject();
      setTimeout(() => {
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 3000);
    } catch (err) {
      console.error("❌ Save Project failed:", err);
      setIsSaving(false);
    }
  };

  const handleUploadClick = (e) => {
    e.stopPropagation();
    onRequestRestore();
  };

  const handleWirelessLevelSensorDragStart = (e) => {
    const shapeName = "wirelessLevelSensor";
    e.dataTransfer.setData("shape", shapeName);
    e.dataTransfer.setData("text/plain", shapeName);
  };

  const EXPANDED_W = 190;
  const COLLAPSED_W = 45;

  return (
    <aside
      className={
        "relative bg-[#0f172a] text-white h-full border-r border-gray-800 transition-all duration-300 overflow-visible " +
        (isLeftCollapsed ? "" : "px-3 py-3")
      }
      style={{ width: isLeftCollapsed ? COLLAPSED_W : EXPANDED_W }}
    >
      <button
        className="absolute top-3 right-2 z-50 text-white bg-[#1e293b] px-2 py-1 rounded hover:bg-[#334155] shadow-md"
        onClick={(e) => {
          e.stopPropagation();
          if (dashboardMode === "play") return;
          setIsLeftCollapsed((prev) => !prev);
        }}
        title={isLeftCollapsed ? "Expand" : "Collapse"}
      >
        {isLeftCollapsed ? "▶" : "◀"}
      </button>

      {!isLeftCollapsed && (
        <div className="mt-10">
          <h1 className="text-[15px] font-bold mb-2">CoreFlex IOTs V1.18</h1>

          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`w-full px-2 py-[7px] rounded-md text-[12.5px] mb-1 ${
              isSaving
                ? "bg-blue-600"
                : saved
                ? "bg-green-600"
                : "bg-gray-800 hover:bg-gray-700 text-green-400"
            }`}
          >
            {isSaving ? "⏳ Saving..." : saved ? "✅ Saved" : "💾 Save Project"}
          </button>

          <div className="text-[11px] text-gray-400 mb-3">
            Last saved: {formatDate(lastSavedAt)}
          </div>

          <button
            onClick={handleUploadClick}
            className="w-full px-2 py-[7px] rounded-md text-[12.5px] mb-5 bg-gray-800 hover:bg-gray-700 text-blue-400"
          >
            ⬆ Restore Project
          </button>

          <div
            className={`cursor-pointer mb-3 text-[13px] ${
              activePage === "home" ? "font-bold" : ""
            }`}
            onClick={() => {
              if (onGoHome) return onGoHome();
              setActivePage("home");
            }}
          >
            Home
          </div>

          <div
            className={`cursor-pointer mb-3 text-[13px] ${
              activePage === "dashboard" ? "font-bold" : ""
            }`}
            onClick={() => {
              if (onGoMainDashboard) return onGoMainDashboard();
              setActivePage("dashboard");
            }}
          >
            Main Dashboard
          </div>

          <div
            className="cursor-pointer mb-2 flex items-center gap-2 text-[13px]"
            onClick={() =>
              setShowDevices((prev) => {
                const next = !prev;
                if (!next) {
                  setShowIndicators(false);
                  setShowLevelSensors(false);
                  setShowDeviceControls(false);
                  setShowWirelessLevelSensor(false);
                }
                return next;
              })
            }
          >
            Devices <span>{showDevices ? "▾" : "▸"}</span>
          </div>

          {showDevices && (
            <div className="ml-0">
              <div
                className="cursor-pointer mb-2 flex items-center gap-2 text-[13px]"
                onClick={() => openOnly("indicators")}
              >
                Indicators <span>{showIndicators ? "▾" : "▸"}</span>
              </div>

              {showIndicators && (
                <div className="ml-0">
                  <DraggableLedCircle label="Led Circle (DI)" />
                  <DraggableStatusTextBox label="Status Text Box (DI)" />
                  <DraggableBlinkingAlarm label="Blinking Alarm (DI)" />
                  <DraggableStateImage label="State Image (DI)" />
                  <DraggableCounterInput label="Counter Input (DI)" />
                </div>
              )}

              <div
                className="cursor-pointer mb-2 flex items-center gap-2 text-[13px]"
                onClick={() => openOnly("levelsensors")}
              >
                Level Sensors <span>{showLevelSensors ? "▾" : "▸"}</span>
              </div>

              {showLevelSensors && (
                <div className="ml-0">
                  <h3 className="text-[12px] text-gray-400 mb-2">
                    Tank Models-AI
                  </h3>

                  {[
                    { Icon: StandardTankIcon, name: "standardTank" },
                    { Icon: HorizontalTankIcon, name: "horizontalTank" },
                    { Icon: VerticalTankIcon, name: "verticalTank" },
                    { Icon: SiloTankIcon, name: "siloTank" },
                  ].map(({ Icon, name }) => (
                    <div
                      key={name}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("shape", name);
                        e.dataTransfer.setData("text/plain", name);
                      }}
                      className="cursor-pointer flex flex-col items-center mb-3 cursor-grab active:cursor-grabbing"
                      style={{ userSelect: "none" }}
                    >
                      <Icon size={40} />
                      <span className="text-[11px] mt-1">{name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="cursor-pointer mb-2 flex items-center gap-2 text-[13px]"
                onClick={() => openOnly("devicecontrols")}
              >
                Controls <span>{showDeviceControls ? "▾" : "▸"}</span>
              </div>

              {showDeviceControls && (
                <div className="ml-0">
                  <DraggableControls />
                </div>
              )}

              <div
                className="cursor-pointer mb-2 flex items-start gap-2 text-[13px]"
                onClick={() => openOnly("wirelesslevelsensor")}
              >
                <div className="leading-tight">
                  <div>Wireless Level Sensor</div>
                  <div className="text-[11px] text-gray-400">(Unlimited)</div>
                </div>
                <span>{showWirelessLevelSensor ? "▾" : "▸"}</span>
              </div>

              {showWirelessLevelSensor && (
                <div className="ml-0">
                  <div
                    draggable
                    onDragStart={handleWirelessLevelSensorDragStart}
                    className="cursor-pointer flex flex-col items-center mb-3 cursor-grab active:cursor-grabbing select-none"
                    title="Drag Wireless Level Sensor to dashboard"
                    style={{ userSelect: "none" }}
                  >
                    <WirelessTankIcon size={145} />
                    <span className="text-[11px] mt-1 text-center leading-tight">
                      wirelessTank
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}