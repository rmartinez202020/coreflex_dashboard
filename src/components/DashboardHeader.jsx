/**
 * DashboardHeader
 * - Displays dashboard title
 * - Play / Edit toggle
 * - Launch button
 * - Undo / Redo
 */

export default function DashboardHeader({
  dashboardMode,
  setDashboardMode,
  onLaunch,

  // ✅ NEW
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold text-gray-800">Main Dashboard</h1>

      {/* ✅ UNDO / REDO */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className={`px-2 py-1 rounded-md text-sm border ${
          canUndo
            ? "bg-white hover:bg-gray-100 text-gray-700"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"
        }`}
      >
        ↩
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
        className={`px-2 py-1 rounded-md text-sm border ${
          canRedo
            ? "bg-white hover:bg-gray-100 text-gray-700"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"
        }`}
      >
        ↪
      </button>

      {/* PLAY */}
      <button
        onClick={() => setDashboardMode("play")}
        className={`px-3 py-1 rounded-md text-sm ${
          dashboardMode === "play"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        ▶ Play
      </button>

      {/* EDIT */}
      <button
        onClick={() => setDashboardMode("edit")}
        className={`px-3 py-1 rounded-md text-sm ${
          dashboardMode === "edit"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        ✎ Edit
      </button>

      {/* 🚀 LAUNCH */}
      <button
        onClick={onLaunch}
        className="px-3 py-1 rounded-md text-sm bg-green-600 text-white hover:bg-green-700"
      >
        🚀 Launch
      </button>
    </div>
  );
}
