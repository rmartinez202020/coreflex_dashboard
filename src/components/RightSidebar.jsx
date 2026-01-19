// RightSidebar.jsx
export default function RightSidebar({
  isRightCollapsed,
  setIsRightCollapsed,
  setShowImageLibrary,
  setShowCoreflexLibrary,

  // ✅ OPEN SYMBOL LIBRARIES (center + small)
  openSymbolLibrary,

  // ✅ OLD setters (you can remove later, but keep for now)
  setShowHmiLibrary,
  setShowHvac2DLibrary,
  setShowHvac3DLibrary,
  setShowManufacturing2DLibrary,
  setShowManufacturing3DLibrary,
  setShowTanksPipes2DLibrary,
  setShowTanksPipes3DLibrary,
}) {
  return (
    <aside
      className={
        "border-l border-gray-300 flex flex-col transition-all duration-300 ease-in-out overflow-hidden " +
        (isRightCollapsed
          ? "w-[40px] p-2 items-center justify-between bg-white"
          : "w-[260px] p-6 bg-white overflow-y-auto")
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
      >
        {isRightCollapsed ? "📁" : "📁▶"}
      </button>

      {!isRightCollapsed && (
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Entities</h2>

          {/* ✅ REMOVED: "Text Tools" heading (it was doing nothing) */}

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
                  color: "#000",
                  fontFamily: "monospace",
                  fontWeight: "900",
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

              {/* ✅ RENAMED */}
              <span className="text-[14px] text-center">
                Display Input (AI)
              </span>
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
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                    opacity: 0.55,
                  }}
                />
                <svg
                  width="120"
                  height="55"
                  viewBox="0 0 120 55"
                  style={{ position: "absolute", inset: 0 }}
                >
                  <path
                    d="M 6 40 L 22 32 L 36 36 L 52 22 L 68 26 L 84 18 L 100 24 L 114 14"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  />
                </svg>

                <div
                  style={{
                    position: "absolute",
                    left: 8,
                    top: 6,
                    fontSize: 10,
                    fontWeight: 900,
                    color: "#111",
                  }}
                >
                  GRAPH
                </div>
              </div>

              {/* ✅ RENAMED */}
              <span className="text-[14px] text-center">
                Graphic Display (AI)
              </span>
            </div>
          </div>

          {/* LIBRARIES */}
          <h3 className="text-sm font-semibold mb-3 text-gray-600">Libraries</h3>

          <div
            className="text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-500 flex items-center gap-2"
            onClick={() => setShowImageLibrary(true)}
          >
            📁 <span>Image Library</span>
          </div>

          <div
            className="mt-3 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-500 flex items-center gap-2"
            onClick={() => setShowCoreflexLibrary(true)}
          >
            📁 <span>CoreFlex IOTs Library</span>
          </div>

          {/* ✅ SYMBOL LIBRARIES → use openSymbolLibrary so they open centered + smaller */}
          <div
            className="mt-3 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-500 flex items-center gap-2"
            onClick={() => openSymbolLibrary("hmi")}
          >
            📁 <span>HMI Symbols</span>
          </div>

          <div
            className="mt-3 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-500 flex items-center gap-2"
            onClick={() => openSymbolLibrary("hvac2d")}
          >
            📁 <span>HVAC Symbols 2D</span>
          </div>

          <div
            className="mt-3 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-500 flex items-center gap-2"
            onClick={() => openSymbolLibrary("hvac3d")}
          >
            📁 <span>HVAC Symbols 3D</span>
          </div>

          <div
            className="mt-3 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-500 flex items-center gap-2"
            onClick={() => openSymbolLibrary("mfg2d")}
          >
            📁 <span>Manufacturing Symbols 2D</span>
          </div>

          <div
            className="mt-3 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-500 flex items-center gap-2"
            onClick={() => openSymbolLibrary("mfg3d")}
          >
            📁 <span>Manufacturing Symbols 3D</span>
          </div>

          <div
            className="mt-3 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-500 flex items-center gap-2"
            onClick={() => openSymbolLibrary("tp2d")}
          >
            📁 <span>Tanks & Pipes Symbols 2D</span>
          </div>

          <div
            className="mt-3 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-500 flex items-center gap-2"
            onClick={() => openSymbolLibrary("tp3d")}
          >
            📁 <span>Tanks & Pipes Symbols 3D</span>
          </div>
        </div>
      )}
    </aside>
  );
}
