// =========================
// MAIN CONTAINER
// =========================
export const wrap = {
  width: "100%",
  height: "100%",
  background: "#f8fafc",
  border: "1.5px solid #1f2937",
  borderRadius: 12,
  boxShadow:
    "0 0 0 1px rgba(148,163,184,0.28) inset, 0 10px 26px rgba(0,0,0,.28)",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  overflow: "hidden",
};

// =========================
// TOP BAR
// =========================
export const topBar = {
  height: 42,
  background: "#eceff3",
  color: "#111827",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 10px",
  borderBottom: "1px solid #d1d5db",
  userSelect: "none",
};

export const titleWrap = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  minWidth: 0,
  flex: 1,
};

export const titleDash = {
  color: "#9ca3af",
  fontWeight: 800,
  flexShrink: 0,
};

export const dashboardNameText = {
  color: "#374151",
  fontWeight: 800,
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  minWidth: 0,
};

export const btnRow = {
  display: "flex",
  gap: 6,
  alignItems: "center",
};

export const iconBtn = {
  width: 28,
  height: 26,
  background: "#f8fafc",
  color: "#111827",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  cursor: "pointer",
  fontWeight: 900,
};

export const closeBtnRed = {
  width: 28,
  height: 26,
  background: "#ef4444",
  color: "#fff",
  borderRadius: 6,
  border: "1px solid #b91c1c",
  cursor: "pointer",
  fontWeight: 900,
};

// =========================
// TABS
// =========================
export const tabsBar = {
  height: 34,
  display: "flex",
  gap: 6,
  padding: "0 10px",
  background: "#eceff3",
  alignItems: "center",
  borderBottom: "1px solid #d1d5db",
};

export const tabsLeft = {
  display: "flex",
  gap: 6,
  alignItems: "center",
};

export const tabsRight = {
  marginLeft: "auto",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

export const tabBtn = {
  padding: "4px 10px",
  fontWeight: 900,
  borderRadius: 6,
  border: "1px solid #9ca3af",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  fontSize: 12,
};

export const tabBtnActive = {
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #6b7280",
  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
};

// =========================
// SETTINGS / LAUNCH BUTTONS
// =========================
export const settingsTabBtn = {
  height: 26,
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #9ca3af",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

export const gearPill = {
  width: 18,
  height: 18,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
};

export const launchTabBtn = {
  height: 26,
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #9ca3af",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

export const launchPill = {
  width: 18,
  height: 18,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 900,
};

// =========================
// ERROR BAR
// =========================
export const errorBar = {
  minHeight: 28,
  padding: "6px 10px",
  borderBottom: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: 12,
  display: "flex",
  alignItems: "center",
};

// =========================
// BOTTOM BAR
// =========================
export const bottomBar = {
  height: 44,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 10px",
  background: "#d9dde3",
  borderTop: "1px solid #cbd5e1",
};

export const ackBtn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #9ca3af",
  background: "#f3f4f6",
  color: "#111827",
  fontWeight: 900,
};

export const bottomInfo = {
  fontSize: 12,
  color: "#111827",
};

// =========================
// CONFIRM MODAL
// =========================
export const confirmOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.60)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999999,
};

export const confirmCard = {
  width: 440,
  maxWidth: "calc(100% - 40px)",
  background: "#0b1220",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.25)",
  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
  overflow: "hidden",
};

export const confirmHeader = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
  borderBottom: "1px solid rgba(148,163,184,0.18)",
  background: "linear-gradient(180deg, rgba(30,41,59,0.65), rgba(2,6,23,0))",
};

export const warnIcon = {
  width: 34,
  height: 34,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  background: "rgba(245,158,11,0.12)",
  border: "1px solid rgba(245,158,11,0.35)",
};

export const confirmTitle = {
  fontWeight: 900,
  color: "#f8fafc",
  fontSize: 14,
  letterSpacing: 0.2,
  lineHeight: 1.1,
};

export const confirmSubTitle = {
  marginTop: 2,
  fontSize: 12,
  color: "rgba(226,232,240,0.75)",
};

export const confirmBody = {
  padding: "14px 16px 6px",
  color: "rgba(226,232,240,0.88)",
  fontSize: 13,
  lineHeight: 1.35,
};

export const confirmHint = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(239,68,68,0.10)",
  border: "1px solid rgba(239,68,68,0.22)",
  color: "rgba(254,226,226,0.92)",
  fontSize: 12,
};

export const confirmErrorBox = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(127,29,29,0.22)",
  border: "1px solid rgba(248,113,113,0.28)",
  color: "#fecaca",
  fontSize: 12,
  lineHeight: 1.35,
};

export const confirmActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  padding: "12px 16px 16px",
};

export const cancelBtn = {
  padding: "8px 12px",
  cursor: "pointer",
  border: "1px solid rgba(148,163,184,0.30)",
  background: "rgba(15,23,42,0.55)",
  color: "rgba(226,232,240,0.92)",
  borderRadius: 10,
  fontWeight: 900,
};

export const dangerBtn = {
  padding: "8px 12px",
  cursor: "pointer",
  border: "1px solid rgba(239,68,68,0.45)",
  background: "rgba(239,68,68,0.95)",
  color: "#fff",
  borderRadius: 10,
  fontWeight: 900,
};