/**
 * Save Main Dashboard
 * -------------------
 * Responsible for persisting the user's Main Dashboard layout.
 * For now, this is a frontend stub.
 * Later, this will POST to the backend.
 */

export async function saveMainDashboard(layout) {
  if (!Array.isArray(layout)) {
    throw new Error("Invalid dashboard layout");
  }

  // 🔹 TEMP: frontend-only stub
  console.log("💾 Saving Main Dashboard (stub):", layout);

  // Simulate async behavior (future API call)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
}
