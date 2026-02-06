// src/pages/AlarmLogPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import AlarmLogWindow from "../components/AlarmLogWindow";

export default function AlarmLogPage() {
  const navigate = useNavigate();

  return (
    <div style={pageWrap}>
      <div style={pageInner}>
        <AlarmLogWindow
          isPage
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
