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
  onSaveProject, // ✅ REAL SAVE HANDLER FROM APP
  onRequestRestore,
  lastSavedAt, // ✅ TIMESTAMP
}) {
  /* =========================
     SAVE STATE
  ========================= */
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
     UPLOAD HANDLER (OPEN WARNING MODAL)
  ========================= */
  const handleUploadClick = (e) => {
    e.stopPropagation();
    onRequestRestore(); // ✅ App.jsx decides what happens next
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
          {/* PLATFORM TITLE */}
          <h1 className="text-xl font-bold mb-2">CoreFlex IOTs V1.18</h1>

          {/* 💾 SAVE PROJECT */}
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition
              ${
                isSaving
                  ? "bg-blue-600 text-white cursor-not-allowed"
                  : saved
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-green-400"
              }`}
          >
            {isSaving && "⏳ Saving project..."}
            {!isSaving && saved && "✅ Project saved"}
            {!isSaving && !saved && "💾 Save Project"}
          </button>

          {/* 🕒 LAST SAVED TIMESTAMP */}
          <div className="mt-1 mb-4 text-xs text-gray-400">
            Last saved: {formatDate(lastSavedAt)}
          </div>

          {/* ⬆ RESTORE PROJECT */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleUploadClick}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition bg-gray-800 hover:bg-gray-700 text-blue-400"
            >
              ⬆ Restore Project
            </button>
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
            Devices <span>{showDevices ? "▾" : "▸"}</span>
          </div>

          {showDevices && (
            <div className="ml-4">
              {/* ✅ NEW: Device Controls */}
              <div
  className={`cursor-pointer mb-2 ${
    activePage === "deviceControls" ? "font-bold text-blue-300" : "text-gray-200"
  }`}
  onClick={() => setActivePage("deviceControls")}
>
  Device Controls
</div>

              {/* Level Sensors */}
              <div
                className="cursor-pointer mb-2 flex items-center gap-2"
                onClick={() => setShowLevelSensors((prev) => !prev)}
              >
                Level Sensors <span>{showLevelSensors ? "▾" : "▸"}</span>
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

          {/* ✅ Settings REMOVED */}
        </div>
      )}
    </aside>
  );
}
