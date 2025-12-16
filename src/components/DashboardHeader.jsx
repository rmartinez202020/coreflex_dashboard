/**
 * DashboardHeader
 * - Displays dashboard title
 * - Play / Edit toggle
 * - Launch button
 * - Pure UI component
 */

export default function DashboardHeader({
  dashboardMode,
  setDashboardMode,
  onLaunch,
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Main Dashboard
      </h1>

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
