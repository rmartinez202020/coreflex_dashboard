import { API_URL } from "./config/api";

import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import DashboardHeader from "./components/DashboardHeader";
import { saveMainDashboard } from "./services/saveMainDashboard";
import RestoreWarningModal from "./components/RestoreWarningModal";
import GraphicDisplaySettingsModal from "./components/GraphicDisplaySettingsModal";


// ✅ UPDATED IMPORTS (use your helpers)
import {
  getUserKeyFromToken,
  getToken,
  clearAuth,
  // isLoggedIn, // optional if you want
} from "./utils/authToken";

// PAGES
import HomePage from "./components/HomePage";
import ProfilePage from "./components/ProfilePage";

// SIDEBAR LEFT
import SidebarLeft from "./components/SidebarLeft";

// RIGHT SIDEBAR
import RightSidebar from "./components/RightSidebar";

// IMAGE LIBRARY
import ImageLibrary from "./components/ImageLibrary";

// COREFLEX LIBRARY
import CoreFlexLibrary from "./components/CoreFlexLibrary";

// DASHBOARD CANVAS
import DashboardCanvas from "./components/DashboardCanvas";

// MODALS
import SiloPropertiesModal from "./components/SiloPropertiesModal";
import DisplaySettingsModal from "./components/DisplaySettingsModal";

// HOOKS
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useCanvasSelection from "./hooks/useCanvasSelection";
import useObjectDragging from "./hooks/useObjectDragging";
import useDropHandler from "./hooks/useDropHandler";

export default function App() {
  const navigate = useNavigate();

  // ✅ identify which user is currently logged in (from JWT)
  const [currentUserKey, setCurrentUserKey] = useState(() =>
    getUserKeyFromToken()
  );

  // DEVICE DATA
  const [sensorsData, setSensorsData] = useState([]);

  // OBJECTS ON CANVAS
  const [droppedTanks, setDroppedTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // SIDEBARS
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // ⚠️ RESTORE WARNING MODAL
  const [showRestoreWarning, setShowRestoreWarning] = useState(false);

  // MENUS
  const [showDevices, setShowDevices] = useState(false);
  const [showLevelSensors, setShowLevelSensors] = useState(false);

  // CONTEXT MENU
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
  });

  // ACTIVE SILO
  const [activeSiloId, setActiveSiloId] = useState(null);
  const [showSiloProps, setShowSiloProps] = useState(false);

  // DISPLAY SETTINGS MODAL
  const [displaySettingsId, setDisplaySettingsId] = useState(null);
  const openDisplaySettings = (tank) => setDisplaySettingsId(tank.id);
  const closeDisplaySettings = () => setDisplaySettingsId(null);

  // ✅ GRAPHIC DISPLAY SETTINGS MODAL
const [graphicSettingsId, setGraphicSettingsId] = useState(null);
const openGraphicDisplaySettings = (tank) => setGraphicSettingsId(tank.id);
const closeGraphicDisplaySettings = () => setGraphicSettingsId(null);


  // NAVIGATION
  const [activePage, setActivePage] = useState("home");
  const [activeSubPage, setActiveSubPage] = useState(null);
  const [subPageColor, setSubPageColor] = useState("");

  // ⭐ DASHBOARD MODE — DEFAULT EDIT
  const [dashboardMode, setDashboardMode] = useState("edit");

  // ⭐ LAST SAVED TIMESTAMP
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // IMAGE LIBRARY WINDOW
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageLibraryPos, setImageLibraryPos] = useState({ x: 260, y: 140 });
  const [imageLibrarySize, setImageLibrarySize] = useState({
    width: 400,
    height: 300,
  });
  const [isDraggingLibrary, setIsDraggingLibrary] = useState(false);
  const [isResizingLibrary, setIsResizingLibrary] = useState(false);
  const [libraryDragOffset, setLibraryDragOffset] = useState({ x: 0, y: 0 });

  // COREFLEX LIBRARY WINDOW
  const [showCoreflexLibrary, setShowCoreflexLibrary] = useState(false);
  const [coreflexLibraryPos, setCoreflexLibraryPos] = useState({
    x: 680,
    y: 140,
  });
  const [coreflexLibrarySize, setCoreflexLibrarySize] = useState({
    width: 400,
    height: 300,
  });
  const [isDraggingCoreflex, setIsDraggingCoreflex] = useState(false);
  const [isResizingCoreflex, setIsResizingCoreflex] = useState(false);
  const [coreflexDragOffset, setCoreflexDragOffset] = useState({
    x: 0,
    y: 0,
  });

  // SENSOR SETUP
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  const getLayerScore = (obj) => {
    const base = obj.zIndex ?? 1;
    let offset = 0;
    if (obj.shape === "textBox") offset = 1;
    else if (obj.shape === "img") offset = 2;
    else if (obj.shape === "displayBox") offset = 3;
    return base * 10 + offset;
  };

  // ✅ USER AUTH STATE SYNC (critical)
  useEffect(() => {
    const syncUserFromToken = () => {
      const newUserKey = getUserKeyFromToken();
      const token = getToken();

      // if token missing -> full reset
      if (!token || !newUserKey) {
        setCurrentUserKey(null);
        setDroppedTanks([]);
        setSelectedTank(null);
        setSelectedIds([]);
        setLastSavedAt(null);
        setDashboardMode("edit");
        setActivePage("home");
        return;
      }

      if (newUserKey !== currentUserKey) {
        console.log(
          "🔄 User changed → resetting dashboard state",
          currentUserKey,
          "→",
          newUserKey
        );

        setCurrentUserKey(newUserKey);
        setDroppedTanks([]);
        setSelectedTank(null);
        setSelectedIds([]);
        setLastSavedAt(null);
        setDashboardMode("edit");
        setActivePage("home");
      }
    };

    syncUserFromToken();
    window.addEventListener("coreflex-auth-changed", syncUserFromToken);

    return () => {
      window.removeEventListener("coreflex-auth-changed", syncUserFromToken);
    };
  }, [currentUserKey]);

  // ⭐ COLLAPSE BOTH SIDEBARS WHEN IN PLAY
  useEffect(() => {
    if (dashboardMode === "play") {
      setIsLeftCollapsed(true);
      setIsRightCollapsed(true);
    } else {
      setIsLeftCollapsed(false);
      setIsRightCollapsed(false);
    }
  }, [dashboardMode]);

  // ⭐ IMAGE UPLOAD FUNCTION
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setUploadedImages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + Math.random().toString(16),
            src: reader.result,
          },
        ]);
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  // ================================
  // 📡 FETCH LIVE SENSOR DATA FROM API
  // ================================
  useEffect(() => {
    fetch(`${API_URL}/devices`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load devices");
        return res.json();
      })
      .then((data) =>
        setSensorsData(
          data.map((s) => ({
            ...s,
            level_percent: Math.min(100, Math.round((s.level / 55) * 100)),
            date_received: s.last_update?.split("T")[0] || "",
            time_received: s.last_update
              ? new Date(s.last_update).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          }))
        )
      )
      .catch((err) => {
        console.error("Sensor API error:", err);
        setSensorsData([]);
      });
  }, []);

  // ⭐ LOAD LAST SAVED TIMESTAMP (per user)
  useEffect(() => {
    const loadLastSavedTimestamp = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLastSavedAt(null);
          return;
        }

        const res = await fetch(`${API_URL}/dashboard/main`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setLastSavedAt(null);
          return;
        }

        const data = await res.json();
        const savedAt = data?.layout?.meta?.savedAt || data?.meta?.savedAt;

        setLastSavedAt(savedAt ? new Date(savedAt) : null);
      } catch (err) {
        console.error("Failed to load last saved timestamp:", err);
        setLastSavedAt(null);
      }
    };

    loadLastSavedTimestamp();
  }, [currentUserKey]);

  const hideContextMenu = () =>
    setContextMenu((prev) => ({ ...prev, visible: false }));

  const handleRightClick = (id, x, y) => {
    setContextMenu({ visible: true, x, y, targetId: id });
  };

  // ✅ LOGOUT (single source of truth)
  const handleLogout = () => {
    clearAuth();

    setCurrentUserKey(null);
    setDroppedTanks([]);
    setSelectedTank(null);
    setSelectedIds([]);
    setLastSavedAt(null);
    setDashboardMode("edit");
    setActivePage("home");

    window.dispatchEvent(new Event("coreflex-auth-changed"));
    navigate("/");
  };

  // 💾 SAVE PROJECT
const handleSaveProject = async () => {
  const dashboardPayload = {
    version: "1.0",
    type: "main_dashboard",
    canvas: { objects: droppedTanks },
    meta: { dashboardMode, savedAt: new Date().toISOString() },
  };

  try {
    const token = getToken(); // ✅ one read
    console.log("✅ SAVE token start:", token.slice(0, 25));
    console.log("✅ SAVE userKey:", getUserKeyFromToken(token)); // ✅ decode same token

    await saveMainDashboard(dashboardPayload);

    setLastSavedAt(new Date());
    console.log("✅ Main Dashboard saved");
  } catch (err) {
    console.error("❌ Save failed:", err);
  }
};


  // ⬆ RESTORE PROJECT
const handleUploadProject = async () => {
  try {
    const token = getToken(); // ✅ one read
    console.log("⬆️ RESTORE token start:", token.slice(0, 25));
    console.log("⬆️ RESTORE userKey:", getUserKeyFromToken(token)); // ✅ decode same token

    if (!token) throw new Error("No auth token found");

    const res = await fetch(`${API_URL}/dashboard/main`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to load dashboard from DB");

    const data = await res.json();
    console.log("📦 Dashboard payload from DB:", data);

    setDroppedTanks([]);

    setTimeout(() => {
      const objects =
        data?.canvas?.objects ||
        data?.layout?.canvas?.objects ||
        data?.layout?.objects ||
        [];

      setDroppedTanks([...objects]);

      const mode = data?.layout?.meta?.dashboardMode || data?.meta?.dashboardMode;
      if (mode) setDashboardMode(mode);

      const savedAt = data?.layout?.meta?.savedAt || data?.meta?.savedAt;
      setLastSavedAt(savedAt ? new Date(savedAt) : null);

      console.log("✅ Main dashboard restored from DB");
    }, 0);
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
};

  // KEYBOARD SHORTCUTS
  useKeyboardShortcuts({
    selectedIds,
    setSelectedIds,
    selectedTank,
    setSelectedTank,
    droppedTanks,
    setDroppedTanks,
  });

  // CANVAS SELECTION
  const {
    selectionBox,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  } = useCanvasSelection({
    droppedTanks,
    setSelectedIds,
    setSelectedTank,
    hideContextMenu,
  });

  // OBJECT DRAGGING
  const { dragDelta, setDragDelta, handleDragMove, handleDragEnd, guides } =
    useObjectDragging({
      selectedIds,
      droppedTanks,
      setDroppedTanks,
    });

  // DROP HANDLER
  const { handleDrop } = useDropHandler({
    uploadedImages,
    setDroppedTanks,
  });

  const handleSelect = (id) => {
    setSelectedTank(id);
    setSelectedIds([id]);
    hideContextMenu();
  };

  const activeSilo = droppedTanks.find(
    (t) => t.id === activeSiloId && t.shape === "siloTank"
  );

  const displayTarget = droppedTanks.find(
    (t) => t.id === displaySettingsId && t.shape === "displayBox"
  );

  const graphicTarget = droppedTanks.find(
  (t) => t.id === graphicSettingsId && t.shape === "graphicDisplay"
);

  // ⭐ GLOBAL MOUSE MOVE / UP FOR DRAGGING + RESIZING WINDOWS
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLibrary) {
        setImageLibraryPos({
          x: e.clientX - libraryDragOffset.x,
          y: e.clientY - libraryDragOffset.y,
        });
      }

      if (isResizingLibrary) {
        setImageLibrarySize((prev) => ({
          width: Math.max(260, e.clientX - imageLibraryPos.x),
          height: Math.max(180, e.clientY - imageLibraryPos.y),
        }));
      }

      if (isDraggingCoreflex) {
        setCoreflexLibraryPos({
          x: e.clientX - coreflexDragOffset.x,
          y: e.clientY - coreflexDragOffset.y,
        });
      }

      if (isResizingCoreflex) {
        setCoreflexLibrarySize((prev) => ({
          width: Math.max(260, e.clientX - coreflexLibraryPos.x),
          height: Math.max(180, e.clientY - coreflexLibraryPos.y),
        }));
      }
    };

    const handleMouseUp = () => {
      if (
        isDraggingLibrary ||
        isResizingLibrary ||
        isDraggingCoreflex ||
        isResizingCoreflex
      ) {
        setIsDraggingLibrary(false);
        setIsResizingLibrary(false);
        setIsDraggingCoreflex(false);
        setIsResizingCoreflex(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDraggingLibrary,
    isResizingLibrary,
    isDraggingCoreflex,
    isResizingCoreflex,
    libraryDragOffset,
    coreflexDragOffset,
    imageLibraryPos.x,
    imageLibraryPos.y,
    coreflexLibraryPos.x,
    coreflexLibraryPos.y,
  ]);

  return (
    <div
      className="flex h-screen bg-white"
      onClick={() => {
        if (showRestoreWarning) return;
        hideContextMenu();
      }}
    >
      <SidebarLeft
        isLeftCollapsed={isLeftCollapsed}
        setIsLeftCollapsed={setIsLeftCollapsed}
        activePage={activePage}
        setActivePage={setActivePage}
        showDevices={showDevices}
        setShowDevices={setShowDevices}
        showLevelSensors={showLevelSensors}
        setShowLevelSensors={setShowLevelSensors}
        dashboardMode={dashboardMode}
        onSaveProject={handleSaveProject}
        onRequestRestore={() => setShowRestoreWarning(true)}
        lastSavedAt={lastSavedAt}
      />

      <main className="flex-1 p-6 bg-white overflow-visible relative">
        <Header onLogout={handleLogout} />

        {activePage === "dashboard" ? (
  <DashboardHeader
    dashboardMode={dashboardMode}
    setDashboardMode={setDashboardMode}
    onLaunch={() => window.open("/launchMainDashboard", "_blank")}
  />
) : (
  <h1 className="text-2xl font-bold mb-4 text-gray-800">
    {activePage === "home"
      ? "Home"
      : activePage === "deviceControls"
      ? "Device Controls"
      : "Main Dashboard"}
  </h1>
)}

        {activePage === "home" ? (
  <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-white">
    <div className="w-full h-full p-6">
      {activeSubPage === "profile" ? (
        <ProfilePage
          subPageColor={subPageColor}
          setActiveSubPage={setActiveSubPage}
        />
      ) : (
        <HomePage
          setActiveSubPage={setActiveSubPage}
          setSubPageColor={setSubPageColor}
        />
      )}
    </div>
  </div>
) : activePage === "dashboard" ? (
  <DashboardCanvas
    dashboardMode={dashboardMode}
    sensors={sensors}
    sensorsData={sensorsData}
    droppedTanks={droppedTanks}
    setDroppedTanks={setDroppedTanks}
    selectedIds={selectedIds}
    setSelectedIds={setSelectedIds}
    selectedTank={selectedTank}
    setSelectedTank={setSelectedTank}
    dragDelta={dragDelta}
    setDragDelta={setDragDelta}
    contextMenu={contextMenu}
    setContextMenu={setContextMenu}
    activeSiloId={activeSiloId}
    setActiveSiloId={setActiveSiloId}
    setShowSiloProps={setShowSiloProps}
    handleSelect={handleSelect}
    handleRightClick={handleRightClick}
    handleDrop={handleDrop}
    handleDragMove={handleDragMove}
    handleDragEnd={handleDragEnd}
    handleCanvasMouseDown={handleCanvasMouseDown}
    handleCanvasMouseMove={handleCanvasMouseMove}
    handleCanvasMouseUp={handleCanvasMouseUp}
    getLayerScore={getLayerScore}
    selectionBox={selectionBox}
    hideContextMenu={hideContextMenu}
    guides={guides}
    onOpenDisplaySettings={openDisplaySettings}
    onOpenGraphicDisplaySettings={openGraphicDisplaySettings}

  />
) : activePage === "deviceControls" ? (
  <div className="w-full h-full border rounded-lg bg-white p-6">
    <h2 className="text-lg font-semibold text-gray-800 mb-2">
      Device Controls
    </h2>

    <p className="text-sm text-gray-600">
      Here we will add buttons + toggle switches for devices.
    </p>
  </div>
) : null}


        {displayTarget && (
          <DisplaySettingsModal
            tank={displayTarget}
            onClose={closeDisplaySettings}
            onSave={(updatedProps) => {
              setDroppedTanks((prev) =>
                prev.map((t) =>
                  t.id === displayTarget.id
                    ? {
                        ...t,
                        properties: {
                          ...(t.properties || {}),
                          ...updatedProps,
                        },
                      }
                    : t
                )
              );
            }}
          />
        )}

        {graphicTarget && (
  <GraphicDisplaySettingsModal
    open={true}
    tank={graphicTarget}
    onClose={closeGraphicDisplaySettings}
    onSave={(updatedTank) => {
      setDroppedTanks((prev) =>
        prev.map((t) =>
          t.id === updatedTank.id ? updatedTank : t
        )
      );
      closeGraphicDisplaySettings();
    }}
  />
)}


        {showSiloProps && activeSilo && (
          <SiloPropertiesModal
            open={showSiloProps}
            silo={activeSilo}
            onClose={() => setShowSiloProps(false)}
            onSave={(updatedSilo) =>
              setDroppedTanks((prev) =>
                prev.map((t) => (t.id === updatedSilo.id ? updatedSilo : t))
              )
            }
          />
        )}

        <ImageLibrary
          visible={showImageLibrary}
          position={imageLibraryPos}
          size={imageLibrarySize}
          images={uploadedImages}
          onClose={() => setShowImageLibrary(false)}
          onUpload={handleImageUpload}
          onDragStartImage={(e, img) => e.dataTransfer.setData("imageId", img.id)}
          onStartDragWindow={(e) => {
            setIsDraggingLibrary(true);
            setLibraryDragOffset({
              x: e.clientX - imageLibraryPos.x,
              y: e.clientY - imageLibraryPos.y,
            });
          }}
          onStartResizeWindow={() => setIsResizingLibrary(true)}
        />

        <CoreFlexLibrary
          visible={showCoreflexLibrary}
          position={coreflexLibraryPos}
          size={coreflexLibrarySize}
          onClose={() => setShowCoreflexLibrary(false)}
          onStartDragWindow={(e) => {
            setIsDraggingCoreflex(true);
            setCoreflexDragOffset({
              x: e.clientX - coreflexLibraryPos.x,
              y: e.clientY - coreflexLibraryPos.y,
            });
          }}
          onStartResizeWindow={() => setIsResizingCoreflex(true)}
        />
      </main>

      <RestoreWarningModal
        open={showRestoreWarning}
        lastSavedAt={lastSavedAt}
        onCancel={() => setShowRestoreWarning(false)}
        onConfirm={async () => {
          setShowRestoreWarning(false);
          await handleUploadProject();
        }}
      />

      <RightSidebar
        isRightCollapsed={isRightCollapsed}
        setIsRightCollapsed={setIsRightCollapsed}
        setShowImageLibrary={setShowImageLibrary}
        setShowCoreflexLibrary={setShowCoreflexLibrary}
        dashboardMode={dashboardMode}
      />
    </div>
  );
}
