/**
 * DashboardHeader
 * - Displays dashboard title (dynamic)
 * - Play / Edit toggle
 * - Launch button (opens clean PLAY mode in new tab)
 * - Undo / Redo buttons
 * - ✅ Minimized windows tray (SCADA-style)
 * - Pure UI component
 */

export default function DashboardHeader({
  title = "Main Dashboard",

  dashboardMode,
  setDashboardMode,
  onLaunch,

  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,

  // ✅ Minimized windows tray
  minimizedWindows = [], // [{ key, title }]
  onRestoreWindow,
  onCloseWindow,
}) {
  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      <h1 className="text-2xl font-bold text-gray-800 mr-2">{title}</h1>

      {/* UNDO / REDO */}
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

      {/* PLAY */}
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

      {/* EDIT */}
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

      {/* ✅ LAUNCH + MINIMIZED TRAY GROUP (keeps them together) */}
      <div className="flex items-center gap-2 flex-nowrap">
        <button
          type="button"
          onClick={() => {
            setDashboardMode("play");
            onLaunch?.();
          }}
          className="px-3 py-1 rounded-md text-sm bg-green-600 text-white hover:bg-green-700"
          title="Launch dashboard in play mode"
        >
          🚀 Launch
        </button>

        {/* ✅ Minimized windows immediately to the right of Launch */}
        {minimizedWindows?.length > 0 && (
          <div className="flex items-center gap-2 flex-nowrap">
            {minimizedWindows.map((w) => (
              <div
                key={w.key}
                className="flex items-center gap-2 px-2 py-1 rounded-md border border-black bg-gray-100 shadow-sm"
                title="Click to restore"
              >
                <button
                  type="button"
                  onClick={() => onRestoreWindow?.(w.key)}
                  className="text-sm font-bold text-gray-900 hover:underline whitespace-nowrap"
                >
                  ▣ {w.title || w.key}
                </button>

                {onCloseWindow && (
                  <button
                    type="button"
                    onClick={() => onCloseWindow(w.key)}
                    className="text-xs font-bold px-2 py-0.5 rounded border border-black bg-white hover:bg-gray-200"
                    title="Close"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
