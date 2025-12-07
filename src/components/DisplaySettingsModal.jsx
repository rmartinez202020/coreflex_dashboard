import React, { useState, useEffect } from "react";

// 🔁 TEMP: replace with your real API call later
async function fetchTagsForImei(imei) {
  if (!imei) return [];

  return [
    { name: "LEVEL", type: "string" },
    { name: "TEMPERATURE", type: "string" },
    { name: "HOUR_RECEIVED", type: "string" },
    { name: "DI1", type: "boolean" },
    { name: "ANALOG1", type: "number" },
  ];
}

const THEME_MAP = {
  "LCD Grey": "gray",
  "LCD Blue": "blue",
  "LED Green": "green",
  "Alert Red": "red",
  "Industrial Dark": "dark",
};

const REVERSE_THEME_MAP = Object.fromEntries(
  Object.entries(THEME_MAP).map(([label, key]) => [key, label])
);

export default function DisplaySettingsModal({ tank, onClose, onSave }) {
  const props = tank.properties || {};

  const [activeTab, setActiveTab] = useState("display");

  // Display settings
  const [label, setLabel] = useState(props.label || "");
  const [numberFormat, setNumberFormat] = useState(props.numberFormat || "00000");
  const [theme, setTheme] = useState(REVERSE_THEME_MAP[props.theme] || "LCD Grey");

  // Register Tag
  const [imei, setImei] = useState(props.imei || "");
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(props.tag || "");

  // Math
  const [formula, setFormula] = useState(props.formula || "");

  // ⭐ MODAL DRAGGING STATE
  const [modalPos, setModalPos] = useState({ x: window.innerWidth / 2 - 240, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // LOAD TAGS WHEN IMEI CHANGES
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!imei) {
        setAvailableTags([]);
        return;
      }

      const tags = await fetchTagsForImei(imei);
      if (cancelled) return;

      const stringTags = tags.filter((t) => t.type === "string");
      setAvailableTags(stringTags);

      if (!selectedTag && stringTags.length > 0) {
        setSelectedTag(stringTags[0].name);
      }
    };

    load();
    return () => (cancelled = true);
  }, [imei]);

  // ⭐ DRAGGING EVENT HANDLERS
  const startDrag = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - modalPos.x,
      y: e.clientY - modalPos.y,
    });
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const onDrag = (e) => {
    if (!isDragging) return;

    setModalPos({
      x: Math.max(20, Math.min(window.innerWidth - 500, e.clientX - dragOffset.x)),
      y: Math.max(20, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y)),
    });
  };

  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);

    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  });

  // SAVE
  const handleSave = () => {
    const themeKey = THEME_MAP[theme];

    onSave({
      label,
      numberFormat,
      theme: themeKey,
      imei,
      tag: selectedTag,
      formula,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999999,
      }}
      onClick={onClose}
    >
      {/* ⭐ DRAGGABLE MODAL CONTAINER */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: modalPos.x,
          top: modalPos.y,
          width: 650,
          background: "#f9fafb",
          borderRadius: 10,
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
          border: "1px solid #d1d5db",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* ⭐ DRAG HANDLE: TABS AREA */}
        <div
          onMouseDown={startDrag}
          style={{
            display: "flex",
            marginBottom: 12,
            borderBottom: "1px solid #e5e7eb",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          {[
            { id: "display", label: "Display Settings" },
            { id: "tag", label: "Register Tag" },
            { id: "math", label: "Math" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                borderBottom:
                  activeTab === tab.id ? "3px solid #2563eb" : "3px solid transparent",
                background: "transparent",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? "700" : "500",
                color: activeTab === tab.id ? "#111827" : "#6b7280",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, maxHeight: "60vh" }}>
          {/* DISPLAY TAB ----------------------------- */}
          {activeTab === "display" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Label</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Number Format
                </label>
                <select
                  value={numberFormat}
                  onChange={(e) => setNumberFormat(e.target.value)}
                  className="mt-1 block w-40 border border-gray-300 rounded-md px-2 py-1 text-sm"
                >
                  <option value="00">00</option>
                  <option value="000">000</option>
                  <option value="0000">0000</option>
                  <option value="00000">00000</option>

                  <option value="00.0">00.0</option>
                  <option value="00.00">00.00</option>
                  <option value="000.00">000.00</option>
                  <option value="0000.00">0000.00</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="mt-1 block w-44 border border-gray-300 rounded-md px-2 py-1 text-sm"
                >
                  <option>LCD Grey</option>
                  <option>LCD Blue</option>
                  <option>LED Green</option>
                  <option>Alert Red</option>
                  <option>Industrial Dark</option>
                </select>
              </div>
            </div>
          )}

          {/* TAG TAB ----------------------------- */}
          {activeTab === "tag" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label className="block text-sm font-medium text-gray-700">IMEI</label>
              <input
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
              />

              <label className="block text-sm font-medium text-gray-700">STRING Tags</label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value="">Select a STRING tag…</option>
                {availableTags.map((tag) => (
                  <option key={tag.name} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* MATH TAB ----------------------------- */}
          {activeTab === "math" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label className="block text-sm font-medium text-gray-700">Formula</label>

              <textarea
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                rows={3}
                placeholder="Example: VALUE * 2"
              />

              {/* EXAMPLE PANEL */}
              <div
                style={{
                  marginTop: 6,
                  padding: 14,
                  background: "#f1f5f9",
                  borderRadius: 6,
                  fontSize: "11px",
                  color: "#1e293b",
                  border: "1px solid #e2e8f0",
                  lineHeight: "1.25",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Supported Operators
                </div>

                <ul className="text-xs space-y-1 mb-3">
                  <li><strong>VALUE + 10</strong> → add 10</li>
                  <li><strong>VALUE - 3</strong> → subtract</li>
                  <li><strong>VALUE * 2</strong> → multiply</li>
                  <li><strong>VALUE / 5</strong> → divide</li>
                  <li><strong>VALUE % 60</strong> → modulo</li>
                  <li><strong>VALUE = 100</strong> → compare</li>
                </ul>

                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Combined Examples
                </div>

                <ul className="text-xs space-y-1 mb-3">
                  <li><strong>(VALUE * 1.5) + 5</strong> → scale & offset</li>
                  <li><strong>(VALUE - 4) / 2</strong> → normalize</li>
                  <li><strong>((VALUE * 9/5) + 32)</strong> → °C → °F</li>
                  <li><strong>((VALUE - 32) * 5/9)</strong> → °F → °C</li>
                  <li><strong>((VALUE / 4095) * 20) - 4</strong> → ADC → 4–20 mA</li>
                </ul>

                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  String Output Examples
                </div>

                <ul className="text-xs space-y-1">
                  <li><strong>CONCAT("Temp=", VALUE)</strong></li>
                  <li><strong>CONCAT("Level=", VALUE, " %")</strong></li>
                  <li><strong>CONCAT("Vol=", VALUE * 2, " Gal")</strong></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* --------- BUTTONS --------- */}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
