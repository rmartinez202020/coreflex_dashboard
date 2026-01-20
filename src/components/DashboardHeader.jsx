/**
 * DashboardHeader
 * - Displays dashboard title
 * - Play / Edit toggle
 * - Launch button (opens clean PLAY mode in new tab)
 * - Undo / Redo buttons
 * - Pure UI component
 */

export default function DashboardHeader({
  dashboardMode,
  setDashboardMode,
  onLaunch,

  // Undo / Redo
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h1 className="text-2xl font-bold text-gray-800 mr-2">
        Main Dashboard
      </h1>

      {/* ========================= */}
      {/* UNDO / REDO */}
      {/* ========================= */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className={`px-2 py-1 rounded-md text-sm border ${
          canUndo
            ? "bg-white text-gray-800 hover:bg-gray-100"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        ↶
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className={`px-2 py-1 rounded-md text-sm border ${
          canRedo
            ? "bg-white text-gray-800 hover:bg-gray-100"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        ↷
      </button>

      {/* ========================= */}
      {/* PLAY MODE */}
      {/* ========================= */}
      <button
        type="button"
        onClick={() => setDashboardMode("play")}
        className={`px-3 py-1 rounded-md text-sm ${
          dashboardMode === "play"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        ▶ Play
      </button>

      {/* ========================= */}
      {/* EDIT MODE */}
      {/* ========================= */}
      <button
        type="button"
        onClick={() => setDashboardMode("edit")}
        className={`px-3 py-1 rounded-md text-sm ${
          dashboardMode === "edit"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        ✎ Edit
      </button>

      {/* ========================= */}
      {/* LAUNCH (PLAY-ONLY VIEW) */}
      {/* ========================= */}
      <button
        type="button"
        onClick={() => {
          // Always force PLAY before launch
          setDashboardMode("play");
          onLaunch?.();
        }}
        className="px-3 py-1 rounded-md text-sm bg-green-600 text-white hover:bg-green-700"
        title="Launch dashboard in play mode"
      >
        🚀 Launch
      </button>
    </div>
  );
}
