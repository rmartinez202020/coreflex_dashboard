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
  // ✅ NEW
  DraggableCounterInput,
} from "./indicators";

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
  /* =========================
     SAVE STATE
  ========================= */
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* =========================
     DEVICE MENUS (ACCORDION)
  ========================= */
  const [showIndicators, setShowIndicators] = useState(false);
  const [showDeviceControls, setShowDeviceControls] = useState(false);

  // ✅ helper: open ONLY one section at a time
  const openOnly = (section) => {
    if (section === "indicators") {
      setShowIndicators((prev) => {
        const next = !prev;
        if (next) {
          setShowLevelSensors(false);
          setShowDeviceControls(false);
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
        }
        return next;
      });
      return;
    }
  };

  /* =========================
     HELPERS
  ========================= */
  const formatDate = (date) => {
    if (!date) return "Never";
    return date.toLocaleString();
  };

  /* =========================
     SAVE HANDLER
  ========================= */
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

  /* =========================
     RESTORE HANDLER
  ========================= */
  const handleUploadClick = (e) => {
    e.stopPropagation();
    onRequestRestore();
  };

  return (
    <aside
      className={
        "relative bg-[#0f172a] text-white h-full border-r border-gray-800 transition-all duration-300 overflow-hidden " +
        (isLeftCollapsed ? "w-[45px]" : "w-[225px] p-4")
      }
    >
      {/* Collapse / Expand */}
      <button
        className="absolute top-3 z-50 text-white px-2 py-1 rounded hover:bg-[#1e293b]"
        style={{ left: isLeftCollapsed ? "5px" : "197px" }}
        onClick={(e) => {
          e.stopPropagation();
          if (dashboardMode === "play") return;
          setIsLeftCollapsed((prev) => !prev);
        }}
      >
        {isLeftCollapsed ? "▶" : "◀"}
      </button>

      {!isLeftCollapsed && (
        <div className="mt-10">
          <h1 className="text-xl font-bold mb-2">CoreFlex IOTs V1.18</h1>

          {/* SAVE */}
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`w-full px-3 py-2 rounded-md text-sm mb-1
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

          <div className="text-xs text-gray-400 mb-4">
            Last saved: {formatDate(lastSavedAt)}
          </div>

          <button
            onClick={handleUploadClick}
            className="w-full px-3 py-2 rounded-md text-sm mb-6 bg-gray-800 hover:bg-gray-700 text-blue-400"
          >
            ⬆ Restore Project
          </button>

          {/* Navigation */}
          <div
            className={`cursor-pointer mb-4 ${
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
            className={`cursor-pointer mb-4 ${
              activePage === "dashboard" ? "font-bold" : ""
            }`}
            onClick={() => {
              if (onGoMainDashboard) return onGoMainDashboard();
              setActivePage("dashboard");
            }}
          >
            Main Dashboard
          </div>

          {/* DEVICES (no badge icon) */}
          <div
            className="cursor-pointer mb-2 flex items-center gap-2"
            onClick={() =>
              setShowDevices((prev) => {
                const next = !prev;
                if (!next) {
                  setShowIndicators(false);
                  setShowLevelSensors(false);
                  setShowDeviceControls(false);
                }
                return next;
              })
            }
          >
            Devices <span>{showDevices ? "▾" : "▸"}</span>
          </div>

          {showDevices && (
            <div className="ml-0">
              {/* INDICATORS */}
              <div
                className="cursor-pointer mb-2 flex items-center gap-2"
                onClick={() => openOnly("indicators")}
              >
                Indicators <span>{showIndicators ? "▾" : "▸"}</span>
              </div>

              {showIndicators && (
                // ✅ Make children align flush-left like other sections
                <div className="ml-0">
                  {/* ✅ no small icons */}
                  <div className="mb-2 text-sm flex items-center">
                    <div className="flex-1">
                      <DraggableLedCircle label="Led Circle (DI)" />
                    </div>
                  </div>

                  <div className="mb-2 text-sm flex items-center">
                    <div className="flex-1">
                      <DraggableStatusTextBox label="Status Text Box (DI)" />
                    </div>
                  </div>

                  <div className="mb-2 text-sm flex items-center">
                    <div className="flex-1">
                      <DraggableBlinkingAlarm label="Blinking Alarm (DI)" />
                    </div>
                  </div>

                  <div className="mb-2 text-sm flex items-center">
                    <div className="flex-1">
                      <DraggableStateImage label="State Image (DI)" />
                    </div>
                  </div>

                  {/* ✅ Counter Input aligned + renamed */}
                  <div className="mb-2 text-sm flex items-center">
                    <div className="flex-1">
                      <DraggableCounterInput label="Counter Input (DI)" />
                    </div>
                  </div>
                </div>
              )}

              {/* LEVEL SENSORS */}
              <div
                className="cursor-pointer mb-2 flex items-center gap-2"
                onClick={() => openOnly("levelsensors")}
              >
                Level Sensors <span>{showLevelSensors ? "▾" : "▸"}</span>
              </div>

              {showLevelSensors && (
                <div className="ml-0">
                  <h3 className="text-sm text-gray-400 mb-2">Tank Models-AI</h3>

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
                      className="cursor-pointer flex flex-col items-center mb-4 cursor-grab active:cursor-grabbing"
                      style={{ userSelect: "none" }}
                    >
                      <Icon size={45} />
                      <span className="text-xs mt-1">{name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* DEVICE CONTROLS */}
              <div
                className="cursor-pointer mb-2 flex items-center gap-2"
                onClick={() => openOnly("devicecontrols")}
              >
                Controls <span>{showDeviceControls ? "▾" : "▸"}</span>
              </div>

              {showDeviceControls && (
                <div className="ml-0">
                  <DraggableControls />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
