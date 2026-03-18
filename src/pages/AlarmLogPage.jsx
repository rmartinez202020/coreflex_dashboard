// src/pages/AlarmLogPage.jsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AlarmLogWindow from "../components/AlarmLogWindow";

export default function AlarmLogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const dashboardId =
    String(searchParams.get("dashboardId") || "").trim() || "main";

  const dashboardName =
    String(searchParams.get("dashboardName") || "").trim() || "";

  const windowKey =
    String(searchParams.get("windowKey") || "").trim() || "alarmLog";

  return (
    <div style={pageWrap}>
      <div style={pageInner}>
        <AlarmLogWindow
          isPage
          dashboardId={dashboardId}
          dashboardName={dashboardName}
          windowKey={windowKey}
          onClose={() => navigate(-1)}
        />
      </div>
    </div>
  );
}

const pageWrap = {
  width: "100vw",
  height: "100vh",
  background: "#0b1220",
  padding: 18,
  boxSizing: "border-box",
  display: "flex",
};

const pageInner = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
};