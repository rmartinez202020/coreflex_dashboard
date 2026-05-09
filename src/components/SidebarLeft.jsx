// SidebarLeft.jsx
import React, { useState } from "react";
import {
  StandardTankIcon,
  HorizontalTankIcon,
  VerticalTankIcon,
  SiloTankIcon,
} from "./ProTankIcon";

import DraggableControls from "./DraggableControls";

// ✅ Indicators
import {
  DraggableLedCircle,
  DraggableStatusTextBox,
  DraggableBlinkingAlarm,
  DraggableStateImage,
  DraggableCounterInput,
} from "./indicators";

function WirelessTankIcon({ size = 125 }) {
  const w = size;
  const h = Math.round(size * 0.78);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 220 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <g
        stroke="#cbd5e1"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Main tank body */}
        <path d="M18 45 L118 22 L202 42 L102 66 Z" />
        <path d="M18 45 L18 112 L102 136 L102 66 Z" />
        <path d="M102 66 L202 42 L202 105 L102 136 Z" />

        {/* Hidden / back construction lines */}
        <path d="M18 112 L102 91 L202 105" strokeDasharray="6 6" opacity="0.8" />
        <path d="M102 66 L102 136" strokeDasharray="6 6" opacity="0.8" />
        <path d="M118 22 L118 88" strokeDasharray="6 6" opacity="0.55" />

        {/* Top box */}
        <path d="M52 36 L52 13 L96 6 L132 17 L132 41 L87 51 Z" />
        <path d="M52 13 L87 24 L132 17" />
        <path d="M87 24 L87 51" />

        {/* Top circular port */}
        <ellipse cx="66" cy="27" rx="10" ry="14" />
        <ellipse cx="66" cy="27" rx="5" ry="9" />

        {/* Side latches */}
        <rect x="33" y="68" width="14" height="16" rx="2" />
        <path d="M34 68 L40 61 L47 68" />

        <rect x="61" y="76" width="14" height="16" rx="2" />
        <path d="M62 76 L68 69 L75 76" />

        {/* Lower ports */}
        <ellipse cx="39" cy="105" rx="9" ry="14" />
        <ellipse cx="39" cy="105" rx="4.5" ry="9" />

        <ellipse cx="78" cy="117" rx="9" ry="14" />
        <ellipse cx="78" cy="117" rx="4.5" ry="9" />

        {/* Feet */}
        <path d="M38 123 L38 134 L57 134 L57 128" />
        <path d="M158 122 L158 134 L180 134 L180 116" />
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

  // ✅ hard navigation actions controlled by App.jsx
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
            className={`w-full px-2 py-[7px] rounded-md text-[12.5px] mb-1
              ${
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
                  <div className="mb-2 text-[12.5px] flex items-center">
                    <div className="flex-1">
                      <DraggableLedCircle label="Led Circle (DI)" />
                    </div>
                  </div>

                  <div className="mb-2 text-[12.5px] flex items-center">
                    <div className="flex-1">
                      <DraggableStatusTextBox label="Status Text Box (DI)" />
                    </div>
                  </div>

                  <div className="mb-2 text-[12.5px] flex items-center">
                    <div className="flex-1">
                      <DraggableBlinkingAlarm label="Blinking Alarm (DI)" />
                    </div>
                  </div>

                  <div className="mb-2 text-[12.5px] flex items-center">
                    <div className="flex-1">
                      <DraggableStateImage label="State Image (DI)" />
                    </div>
                  </div>

                  <div className="mb-2 text-[12.5px] flex items-center">
                    <div className="flex-1">
                      <DraggableCounterInput label="Counter Input (DI)" />
                    </div>
                  </div>
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
                    <WirelessTankIcon size={125} />
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