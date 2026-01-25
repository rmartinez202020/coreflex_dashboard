// src/components/AlarmLogWindow.jsx
import React from "react";
import useAlarmsMockData from "../hooks/useAlarmsMockData";

export default function AlarmLogWindow({ onLaunch }) {
  const alarms = useAlarmsMockData();

  return (
    <div style={wrap}>
      <div style={topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900 }}>
            Alarms Log (AI) ({alarms.length})
          </div>

          {/* small icon button (matches “open alarm log” vibe) */}
          <button
            style={iconBtn}
            onClick={onLaunch}
            title="Open / Launch Alarm Log"
          >
            ⚠
          </button>
        </div>

        <button style={btn} onClick={onLaunch}>
          Launch
        </button>
      </div>

      <div style={table}>
        <div style={header}>
          {["Ack", "Sev", "Alarm Text", "Time", "Group", "Controller"].map(
            (h) => (
              <div key={h} style={cellHead}>
                {h}
              </div>
            )
          )}
        </div>

        {alarms.map((a) => {
          // base row background by severity (warm highlight for higher severity)
          const baseBg =
            a.severity >= 4 ? "rgba(245,158,11,0.12)" : "transparent";

          return (
            <div
              key={a.id}
              style={{ ...row, background: baseBg }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(148,163,184,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = baseBg;
              }}
            >
              {/* Ack checkbox style (looks closer to the screenshot) */}
              <div style={cell}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: "1px solid #6b7280",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: a.acknowledged ? "#16a34a" : "transparent",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 900,
                    userSelect: "none",
                  }}
                  title={a.acknowledged ? "Acknowledged" : "Not acknowledged"}
                >
                  {a.acknowledged ? "✓" : ""}
                </div>
              </div>

              <div style={cell}>{a.severity}</div>
              <div style={{ ...cell, flex: 2 }}>{a.text}</div>
              <div style={cell}>{a.time}</div>
              <div style={cell}>{a.groupName}</div>
              <div style={cell}>{a.controller}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const wrap = {
  width: "100%",
  height: "100%",
  background: "#0b1220",
  color: "#e5e7eb",
  display: "flex",
  flexDirection: "column",
};

const topBar = {
  height: 40,
  background: "#1f2937",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 12px",
  borderBottom: "1px solid #111827",
};

const btn = {
  background: "#111827",
  border: "1px solid #374151",
  color: "#e5e7eb",
  padding: "6px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 800,
};

const iconBtn = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#0b1220",
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 900,
  lineHeight: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const table = {
  flex: 1,
  overflow: "auto",
};

const header = {
  display: "flex",
  background: "#020617",
  borderBottom: "1px solid #374151",
};

const cellHead = {
  flex: 1,
  padding: 8,
  fontSize: 12,
  fontWeight: 900,
};

const row = {
  display: "flex",
  borderBottom: "1px solid #1f2937",
};

const cell = {
  flex: 1,
  padding: 8,
  fontSize: 12,
};
