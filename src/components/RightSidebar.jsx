// RightSidebar.jsx
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import GaugeDisplayDraggable from "./gauge/GaugeDisplayDraggable";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function DashboardIdsDetailsIcon({ size = 56 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="coreflexIdsDetailsGrad"
          x1="10"
          y1="54"
          x2="55"
          y2="10"
        >
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* outer circular arrows */}
      <path
        d="M16 10C23 4 33 2 43 5C48 6.5 52 9 55 12"
        stroke="url(#coreflexIdsDetailsGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M51.5 8.5L55.5 12L52.2 16"
        stroke="url(#coreflexIdsDetailsGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M55 48C49 56 39 61 28 60C22 59.5 17 57.4 12.8 54"
        stroke="url(#coreflexIdsDetailsGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M16.7 49.8L12.2 54L16 57.6"
        stroke="url(#coreflexIdsDetailsGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* magnifier */}
      <circle
        cx="31"
        cy="28"
        r="16"
        stroke="url(#coreflexIdsDetailsGrad)"
        strokeWidth="3.2"
      />
      <path
        d="M18.5 40.5L8.8 50.2"
        stroke="url(#coreflexIdsDetailsGrad)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />

      {/* gear */}
      <path
        d="M31 19.7L33.2 22.2L36.6 21.7L37.7 24.9L40.8 26.4L39.9 29.7L41.4 32.8L38.2 33.9L36.7 37L33.4 36.1L31 38.3L28.6 36.1L25.3 37L23.8 33.9L20.6 32.8L22.1 29.7L21.2 26.4L24.3 24.9L25.4 21.7L28.8 22.2L31 19.7Z"
        stroke="url(#coreflexIdsDetailsGrad)"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      <circle
        cx="31"
        cy="29"
        r="5.2"
        stroke="url(#coreflexIdsDetailsGrad)"
        strokeWidth="2.3"
      />
    </svg>
  );
}

export default function RightSidebar({
  isRightCollapsed,
  setIsRightCollapsed,

  // ✅ App.jsx passes these:
  setShowImageLibrary,
  setShowCoreflexLibrary,
  openSymbolLibrary,

  // ✅ open Alarm Log window (system FloatingWindow)
  onOpenAlarmLog,

  // ✅ optional new dashboard IDs details open handler
  onOpenDashboardIdsDetails,

  // ✅ active dashboard context from parent
  dashboardId = "",
  dashboardName = "",
  isDashboardOpenOnCanvas = false,
}) {
  const openLibrary = (key) => {
    if (key === "image") return setShowImageLibrary?.();
    if (key === "coreflex") return setShowCoreflexLibrary?.();
    return openSymbolLibrary?.(key);
  };

  const openAlarmLog = async (e) => {
    e?.stopPropagation?.();

    const normalizedDashboardId = String(dashboardId || "").trim();
    const normalizedDashboardName = String(dashboardName || "").trim();

    // ✅ CRITICAL RULE:
    // Alarm Log can NEVER open unless a real dashboard is open on canvas
    if (!isDashboardOpenOnCanvas || !normalizedDashboardId) {
      alert("Open a dashboard on canvas first before opening Alarms Log.");
      return;
    }

    try {
      // ✅ OPTIONAL: match the sidebar width so it opens nicely near the right area
      window.dispatchEvent(
        new CustomEvent("coreflex-alarm-log-open-at", {
          detail: { x: 175, y: 120 },
        })
      );

      const res = await fetch(`${API_URL}/alarm-log-windows/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          dashboard_id: normalizedDashboardId,
          dashboard_name:
            normalizedDashboardName ||
            (normalizedDashboardId === "main"
              ? "Main Dashboard"
              : "Customer Dashboard"),
          window_key: "alarmLog",
          title: "Alarms Log (DI-AI)",
          pos_x: 140,
          pos_y: 90,
          width: 900,
          height: 420,
          is_open: true,
          is_minimized: false,
          is_launched: false,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.detail || data?.error || "Failed to create/open alarm log window"
        );
      }

      // ✅ send the saved row back to parent so parent can render/open it
      onOpenAlarmLog?.(data);
    } catch (err) {
      console.error("Alarm log open failed:", err);
      alert("Could not open Alarms Log window.");
    }
  };

  const openDashboardIdsDetails = (e) => {
    e?.stopPropagation?.();

    const normalizedDashboardId = String(dashboardId || "").trim();
    const normalizedDashboardName = String(dashboardName || "").trim();

    if (!isDashboardOpenOnCanvas || !normalizedDashboardId) {
      alert("Open a dashboard on canvas first before opening IDs Details.");
      return;
    }

    if (typeof onOpenDashboardIdsDetails === "function") {
      onOpenDashboardIdsDetails({
        dashboardId: normalizedDashboardId,
        dashboardName:
          normalizedDashboardName ||
          (normalizedDashboardId === "main"
            ? "Main Dashboard"
            : "Customer Dashboard"),
      });
      return;
    }

    window.dispatchEvent(
      new CustomEvent("coreflex-dashboard-ids-details-open", {
        detail: {
          dashboardId: normalizedDashboardId,
          dashboardName:
            normalizedDashboardName ||
            (normalizedDashboardId === "main"
              ? "Main Dashboard"
              : "Customer Dashboard"),
        },
      })
    );
  };

  // ✅ Make it smaller like SidebarLeft (feel like “90% zoom” at 100%)
  const EXPANDED_W = 175;
  const COLLAPSED_W = 28;

  return (
    <aside
      className={
        "shrink-0 border-l border-gray-300 flex flex-col transition-all duration-300 ease-in-out overflow-visible bg-white"
      }
      style={{
        width: isRightCollapsed ? COLLAPSED_W : EXPANDED_W,
        padding: isRightCollapsed ? 6 : 10,
      }}
    >
      {/* COLLAPSE BUTTON */}
      <button
        className={
          "text-base mb-2 rounded focus:outline-none transition-colors " +
          (isRightCollapsed
            ? "w-full flex items-center justify-center py-2 hover:bg-gray-100"
            : "self-start px-2 py-1 hover:bg-gray-100")
        }
        onClick={() => setIsRightCollapsed((prev) => !prev)}
        type="button"
        title={isRightCollapsed ? "Expand" : "Collapse"}
      >
        {isRightCollapsed ? "📁" : "📁▶"}
      </button>

      {!isRightCollapsed && (
        <div className="flex-1 flex flex-col min-h-0">
          <h2 className="text-[15px] font-semibold mb-2 text-gray-800">
            Entities
          </h2>

          <div className="space-y-4 mb-4">
            {/* TEXT BOX */}
            <div
              className="flex flex-col items-center gap-1"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape", "textBox");
                e.dataTransfer.setData("text/plain", "textBox");
                e.currentTarget.style.cursor = "grabbing";
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.cursor = "grab";
              }}
              style={{ cursor: "grab" }}
              title="Text Box"
            >
              <div
                className="w-[66px] h-[36px] border border-gray-400 bg-white flex items-center justify-center text-black text-[10.5px]"
                style={{ cursor: "grab" }}
              >
                Text
              </div>
              <span className="text-[12px] text-center" style={{ cursor: "grab" }}>
                Text Box
              </span>
            </div>

            {/* DISPLAY BOX */}
            <div
              className="flex flex-col items-center gap-1"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape", "displayBox");
                e.dataTransfer.setData("text/plain", "displayBox");
                e.currentTarget.style.cursor = "grabbing";
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.cursor = "grab";
              }}
              style={{ cursor: "grab" }}
              title="Display Input (AI)"
            >
              <div
                style={{
                  width: 80,
                  height: 32,
                  background: "#e6e6e6",
                  fontFamily: "monospace",
                  fontWeight: 900,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  border: "2px solid #b5b5b5",
                  boxShadow: "inset 0 0 6px rgba(0,0,0,0.25)",
                  letterSpacing: "2px",
                  cursor: "grab",
                }}
              >
                00000
              </div>

              <span className="text-[12px] text-center" style={{ cursor: "grab" }}>
                Display Input (AI)
              </span>
            </div>

            {/* ✅ NEW: GAUGE DISPLAY */}
            <div className="flex flex-col items-center gap-1">
              <GaugeDisplayDraggable title="Gauge Display (AI)" />
            </div>

            {/* GRAPHIC DISPLAY */}
            <div
              className="flex flex-col items-center gap-1"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape", "graphicDisplay");
                e.dataTransfer.setData("text/plain", "graphicDisplay");
                e.currentTarget.style.cursor = "grabbing";
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.cursor = "grab";
              }}
              style={{ cursor: "grab" }}
              title="Graphic Display (AI)"
            >
              <div
                style={{
                  width: 92,
                  height: 44,
                  background: "linear-gradient(180deg, #ffffff 0%, #f3f3f3 100%)",
                  borderRadius: 8,
                  border: "2px solid #cfcfcf",
                  boxShadow:
                    "0 4px 10px rgba(0,0,0,0.08), inset 0 0 6px rgba(0,0,0,0.10)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  cursor: "grab",
                }}
              >
                <svg
                  width="76"
                  height="30"
                  viewBox="0 0 94 40"
                  style={{ cursor: "grab" }}
                >
                  <path d="M10 32H84" stroke="#e5e7eb" strokeWidth="1" />
                  <path d="M10 24H84" stroke="#e5e7eb" strokeWidth="1" />
                  <path d="M10 16H84" stroke="#e5e7eb" strokeWidth="1" />
                  <path d="M10 8H84" stroke="#e5e7eb" strokeWidth="1" />
                  <path d="M10 8V32" stroke="#cbd5e1" strokeWidth="1.3" />
                  <path d="M10 32H84" stroke="#cbd5e1" strokeWidth="1.3" />
                  <path
                    d="M12 29 L24 20 L36 23 L48 14 L60 18 L72 10 L82 12"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="29" r="2.2" fill="#2563eb" />
                  <circle cx="24" cy="20" r="2.2" fill="#2563eb" />
                  <circle cx="36" cy="23" r="2.2" fill="#2563eb" />
                  <circle cx="48" cy="14" r="2.2" fill="#2563eb" />
                  <circle cx="60" cy="18" r="2.2" fill="#2563eb" />
                  <circle cx="72" cy="10" r="2.2" fill="#2563eb" />
                  <circle cx="82" cy="12" r="2.2" fill="#2563eb" />
                </svg>
              </div>

              <span className="text-[12px] text-center" style={{ cursor: "grab" }}>
                Graphic Display (AI)
              </span>
            </div>
          </div>

          {/* LIBRARIES */}
          <h3 className="text-[12px] font-semibold mb-2 text-gray-600">
            Libraries
          </h3>

          {[
            ["image", "Image Library"],
            ["coreflex", "CoreFlex IOTs Library"],
            ["hmi", "HMI Symbols"],
            ["hvac2d", "HVAC Symbols 2D"],
            ["hvac3d", "HVAC Symbols 3D"],
            ["mfg2d", "Manufacturing 2D"],
            ["mfg3d", "Manufacturing 3D"],
            ["tp2d", "Tanks & Pipes  2D"],
            ["tp3d", "Tanks & Pipes  3D"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="mt-2 w-full text-left text-[12px] font-semibold text-gray-600 hover:text-blue-500 flex items-center gap-2 leading-tight"
              onClick={() => openLibrary(key)}
              title={label}
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>📁</span>
              <span className="truncate">{label}</span>
            </button>
          ))}

          {/* 🔥 ALARM LOGS */}
          <h3 className="text-[12px] font-semibold mt-5 mb-2 text-gray-600">
            Alarm Logs
          </h3>

          <button
            type="button"
            className={
              "w-full text-left text-[12px] font-semibold flex items-center gap-2 leading-tight " +
              (isDashboardOpenOnCanvas
                ? "text-gray-700 hover:text-red-600"
                : "text-gray-400 cursor-not-allowed")
            }
            onClick={openAlarmLog}
            disabled={!isDashboardOpenOnCanvas}
            title={
              isDashboardOpenOnCanvas
                ? "Open Alarms Log"
                : "Open a dashboard on canvas first"
            }
          >
            <span
              style={{
                fontSize: 18,
                width: 20,
                height: 20,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              ⚠️
            </span>
            <span className="truncate">Alarms Log (DI-AI)</span>
          </button>

          {/* ✅ BOTTOM TOOL BUTTON */}
          <div className="mt-auto pt-5">
            <button
              type="button"
              onClick={openDashboardIdsDetails}
              disabled={!isDashboardOpenOnCanvas}
              title={
                isDashboardOpenOnCanvas
                  ? "Open Dashboard IDs Details"
                  : "Open a dashboard on canvas first"
              }
              style={{
                width: "100%",
                minHeight: 108,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                cursor: isDashboardOpenOnCanvas ? "pointer" : "not-allowed",
                transition: "all 0.18s ease",
                padding: "10px 8px 12px",
                opacity: isDashboardOpenOnCanvas ? 1 : 0.6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              onMouseEnter={(e) => {
                if (!isDashboardOpenOnCanvas) return;
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                if (!isDashboardOpenOnCanvas) return;
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "visible",
                  flexShrink: 0,
                }}
              >
                <DashboardIdsDetailsIcon size={60} />
              </div>

              <span
                style={{
                  fontSize: 12,
                  lineHeight: 1.1,
                  fontWeight: 800,
                  letterSpacing: "0.2px",
                  color: isDashboardOpenOnCanvas ? "#111827" : "#6b7280",
                  textAlign: "center",
                }}
              >
                IDs Details
              </span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}