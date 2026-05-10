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
      height={Math.round(size * 0.74)}
      viewBox="0 0 300 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <g
        stroke="#dbeafe"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Main professional rectangular tank - long body */}
        <path d="M20 48 L108 28 L280 54 L192 76 Z" />
        <path d="M20 48 L20 122 L192 152 L192 76 Z" />
        <path d="M192 76 L280 54 L280 128 L192 152 Z" />

        {/* Front/side face detail lines */}
        <path d="M26 53 L108 35 L270 58" opacity="0.9" />
        <path d="M192 82 L271 62" opacity="0.85" />
        <path d="M25 118 L192 147 L274 125" opacity="0.85" />

        {/* Hidden CAD-style geometry */}
        <path d="M20 122 L192 100 L280 128" strokeDasharray="8 8" opacity="0.55" />
        <path d="M192 76 L192 152" strokeDasharray="8 8" opacity="0.55" />
        <path d="M108 28 L108 99" strokeDasharray="8 8" opacity="0.35" />

        {/* Top service/filter box - flatter and proportional */}
        <path d="M58 40 L58 16 L116 8 L172 20 L172 45 L115 56 Z" />
        <path d="M58 16 L115 28 L172 20" />
        <path d="M115 28 L115 56" />
        <path d="M63 41 L115 51 L166 42" opacity="0.75" />

        {/* Top circular inlet/outlet */}
        <ellipse cx="79" cy="29" rx="13" ry="15" />
        <ellipse cx="79" cy="29" rx="8" ry="11" />
        <ellipse cx="79" cy="29" rx="4" ry="7" />

        {/* Left latches - compact technical style */}
        <path d="M35 71 L52 75 L52 91 L35 87 Z" />
        <path d="M37 71 L44 63 L52 75" />
        <path d="M39 77 L49 80" />
        <path d="M40 87 L48 89" />

        <path d="M74 79 L92 83 L92 101 L74 97 Z" />
        <path d="M76 79 L84 70 L92 83" />
        <path d="M78 86 L89 89" />
        <path d="M79 97 L88 99" />

        {/* Front lower ports */}
        <ellipse cx="46" cy="109" rx="11" ry="16" />
        <ellipse cx="46" cy="109" rx="7" ry="12" />
        <ellipse cx="46" cy="109" rx="3" ry="7" />

        <ellipse cx="91" cy="119" rx="11" ry="16" />
        <ellipse cx="91" cy="119" rx="7" ry="12" />
        <ellipse cx="91" cy="119" rx="3" ry="7" />

        {/* Industrial base rail and feet */}
        <path d="M22 126 L191 156 L276 131" />
        <path d="M40 128 L40 147 L67 147 L67 133" />
        <path d="M218 146 L218 158 L248 158 L248 136" />

        {/* Slight top lip */}
        <path d="M20 48 L20 43 L108 23 L280 49 L280 54" opacity="0.8" />
        <path d="M20 43 L192 70 L280 49" opacity="0.8" />
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
                    <WirelessTankIcon size={150} />
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