// SidebarLeft.jsx
import React, { useState } from "react";
import {
  StandardTankIcon,
  HorizontalTankIcon,
  VerticalTankIcon,
  SiloTankIcon,
} from "./ProTankIcon";

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
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveProject = () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaved(false);

    // Simulate save delay (3 seconds)
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);

      // Hide success message after 2 seconds
      setTimeout(() => setSaved(false), 2000);
    }, 3000);
  };

  return (
    <aside
      className={
        "relative bg-[#0f172a] text-white h-full border-r border-gray-800 transition-all duration-300 overflow-hidden " +
        (isLeftCollapsed ? "w-[45px]" : "w-[260px] p-4")
      }
    >
      {/* Collapse / Expand Button */}
      <button
        className="absolute top-3 z-50 text-white px-2 py-1 rounded hover:bg-[#1e293b] transition"
        style={{ left: isLeftCollapsed ? "5px" : "232px" }}
        onClick={() => {
          if (dashboardMode === "play") return;
          setIsLeftCollapsed((prev) => !prev);
        }}
      >
        {isLeftCollapsed ? "▶" : "◀"}
      </button>

      {!isLeftCollapsed && (
        <div className="mt-10">
          {/* PLATFORM TITLE */}
          <h1 className="text-xl font-bold mb-2">
            CoreFlex IOTs V1.18
          </h1>

          {/* 💾 SAVE PROJECT */}
          <div
            className={`flex items-center gap-2 mb-6 cursor-pointer transition ${
              isSaving
                ? "text-yellow-400"
                : saved
                ? "text-green-400"
                : "text-green-400 hover:text-green-300"
            }`}
            onClick={handleSaveProject}
          >
            <span className="text-lg">
              {isSaving ? "⏳" : saved ? "✅" : "💾"}
            </span>

            <span className="font-semibold">
              {isSaving
                ? "Saving project..."
                : saved
                ? "Project saved"
                : "Save Project"}
            </span>
          </div>

          {/* Home */}
          <div
            className={`cursor-pointer mb-4 ${
              activePage === "home" ? "font-bold" : ""
            }`}
            onClick={() => setActivePage("home")}
          >
            Home
          </div>

          {/* Main Dashboard */}
          <div
            className={`cursor-pointer mb-4 ${
              activePage === "dashboard" ? "font-bold" : ""
            }`}
            onClick={() => setActivePage("dashboard")}
          >
            Main Dashboard
          </div>

          {/* Devices */}
          <div
            className="cursor-pointer mb-2 flex items-center gap-2"
            onClick={() => setShowDevices((prev) => !prev)}
          >
            Devices
            <span>{showDevices ? "▾" : "▸"}</span>
          </div>

          {showDevices && (
            <div className="ml-4">
              <div
                className="cursor-pointer mb-2 flex items-center gap-2"
                onClick={() => setShowLevelSensors((prev) => !prev)}
              >
                Level Sensors
                <span>{showLevelSensors ? "▾" : "▸"}</span>
              </div>

              {showLevelSensors && (
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">
                    Tank Models
                  </h3>

                  <div
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("shape", "standardTank")
                    }
                    className="cursor-pointer flex flex-col items-center mb-4"
                  >
                    <StandardTankIcon size={45} />
                    <span className="text-xs mt-1">Standard Tank</span>
                  </div>

                  <div
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("shape", "horizontalTank")
                    }
                    className="cursor-pointer flex flex-col items-center mb-4"
                  >
                    <HorizontalTankIcon size={45} />
                    <span className="text-xs mt-1">Horizontal Tank</span>
                  </div>

                  <div
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("shape", "verticalTank")
                    }
                    className="cursor-pointer flex flex-col items-center mb-4"
                  >
                    <VerticalTankIcon size={45} />
                    <span className="text-xs mt-1">Vertical Tank</span>
                  </div>

                  <div
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("shape", "siloTank")
                    }
                    className="cursor-pointer flex flex-col items-center mb-4"
                  >
                    <SiloTankIcon size={45} />
                    <span className="text-xs mt-1">Silo Tank</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <div className="cursor-pointer mt-6">Settings</div>
        </div>
      )}
    </aside>
  );
}
