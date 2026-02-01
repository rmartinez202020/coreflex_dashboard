// RightSidebar.jsx
export default function RightSidebar({
  isRightCollapsed,
  setIsRightCollapsed,

  // ✅ App.jsx passes these:
  setShowImageLibrary,
  setShowCoreflexLibrary,
  openSymbolLibrary,

  // ✅ open Alarm Log window (system FloatingWindow)
  onOpenAlarmLog,
}) {
  const openLibrary = (key) => {
    if (key === "image") return setShowImageLibrary?.();
    if (key === "coreflex") return setShowCoreflexLibrary?.();
    return openSymbolLibrary?.(key);
  };

  const openAlarmLog = (e) => {
    e?.stopPropagation?.();

    // ✅ OPTIONAL: match the sidebar width so it opens nicely near the right area
    window.dispatchEvent(
      new CustomEvent("coreflex-alarm-log-open-at", {
        detail: { x: 230, y: 120 }, // was 260
      })
    );

    onOpenAlarmLog?.();
  };

  // ✅ tweak these two numbers to taste
  const EXPANDED_W = 230; // was 260
  const COLLAPSED_W = 36; // was 40

  return (
    <aside
      className={
        "shrink-0 border-l border-gray-300 flex flex-col transition-all duration-300 ease-in-out overflow-hidden bg-white " +
        (isRightCollapsed
          ? `w-[${COLLAPSED_W}px] p-2 items-center justify-between`
          : `w-[${EXPANDED_W}px] p-5 overflow-y-auto`)
      }
    >
      {/* COLLAPSE BUTTON */}
      <button
        className={
          "text-lg mb-4 rounded focus:outline-none transition-colors " +
          (isRightCollapsed
            ? "w-full flex items-center justify-center py-2 hover:bg-gray-100"
            : "self-start px-2 py-1 hover:bg-gray-100")
        }
        onClick={() => setIsRightCollapsed((prev) => !prev)}
        type="button"
      >
        {isRightCollapsed ? "📁" : "📁▶"}
      </button>

      {!isRightCollapsed && (
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Entities</h2>

          <div className="space-y-6 mb-6">
            {/* TEXT BOX */}
            <div
              className="cursor-pointer flex flex-col items-center gap-1"
              draggable
              onDragStart={(e) => e.dataTransfer.setData("shape", "textBox")}
            >
              <div className="w-[80px] h-[45px] border border-gray-400 bg-white flex items-center justify-center text-black text-xs">
                Text
              </div>
              <span className="text-[14px] text-center">Text Box</span>
            </div>

            {/* DISPLAY BOX */}
            <div
              className="cursor-pointer flex flex-col items-center gap-1"
              draggable
              onDragStart={(e) => e.dataTransfer.setData("shape", "displayBox")}
            >
              <div
                style={{
                  width: "100px",
                  height: "40px",
                  background: "#e6e6e6",
                  fontFamily: "monospace",
                  fontWeight: 900,
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  border: "2px solid #b5b5b5",
                  boxShadow: "inset 0 0 6px rgba(0,0,0,0.25)",
                  letterSpacing: "2px",
                }}
              >
                00000
              </div>
              <span className="text-[14px] text-center">Display Input (AI)</span>
            </div>

            {/* GRAPHIC DISPLAY */}
            <div
              className="cursor-pointer flex flex-col items-center gap-1"
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("shape", "graphicDisplay")
              }
            >
              <div
                style={{
                  width: "120px",
                  height: "55px",
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #f3f3f3 100%)",
                  borderRadius: 8,
                  border: "2px solid #cfcfcf",
                  boxShadow:
                    "0 4px 10px rgba(0,0,0,0.08), inset 0 0 6px rgba(0,0,0,0.10)",
                  position: "relative",
                }}
              />
              <span className="text-[14px] text-center">
                Graphic Display (AI)
              </span>
            </div>
          </div>

          {/* LIBRARIES */}
          <h3 className="text-sm font-semibold mb-3 text-gray-600">Libraries</h3>

          {[
            ["image", "Image Library"],
            ["coreflex", "CoreFlex IOTs Library"],
            ["hmi", "HMI Symbols"],
            ["hvac2d", "HVAC Symbols 2D"],
            ["hvac3d", "HVAC Symbols 3D"],
            ["mfg2d", "Manufacturing Symbols 2D"],
            ["mfg3d", "Manufacturing Symbols 3D"],
            ["tp2d", "Tanks & Pipes Symbols 2D"],
            ["tp3d", "Tanks & Pipes Symbols 3D"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="mt-3 w-full text-left text-sm font-semibold text-gray-600 hover:text-blue-500 flex items-center gap-2"
              onClick={() => openLibrary(key)}
            >
              📁 <span>{label}</span>
            </button>
          ))}

          {/* 🔥 ALARM LOGS */}
          <h3 className="text-sm font-semibold mt-8 mb-3 text-gray-600">
            Alarm Logs
          </h3>

          <button
            type="button"
            className="w-full text-left text-sm font-semibold text-gray-700 hover:text-red-600 flex items-center gap-3"
            onClick={openAlarmLog}
          >
            <span
              style={{
                fontSize: "26px",
                width: 28,
                height: 28,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ⚠️
            </span>
            <span>Alarms Log (DI-AI)</span>
          </button>
        </div>
      )}
    </aside>
  );
}
