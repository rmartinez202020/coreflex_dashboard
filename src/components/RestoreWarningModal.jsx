export default function RestoreWarningModal({
  open,
  lastSavedAt,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  const formattedTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleString()
    : "Unknown";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-warning-title"
    >
      <div className="w-full max-w-md rounded-lg border-2 border-yellow-500 bg-white shadow-2xl">
        
        {/* HEADER */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-yellow-300 bg-yellow-50">
          <span className="text-xl">⚠️</span>
          <h2
            id="restore-warning-title"
            className="text-lg font-semibold text-yellow-800"
          >
            Warning
          </h2>
        </div>

        {/* BODY */}
        <div className="px-5 py-4 text-gray-800">
          <p className="mb-3 font-medium">
            You are about to restore the <strong>last saved version</strong> of this project.
          </p>

          <p className="mb-4 text-sm text-gray-700">
            Any changes made <strong>after the last save</strong> will be permanently lost.
            This action cannot be undone.
          </p>

          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
            <strong>Last saved:</strong> {formattedTime}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 transition"
          >
            Restore Project
          </button>
        </div>
      </div>
    </div>
  );
}
