import { useEffect, useState } from "react";

const TAB_GENERAL = "General";
const TAB_UNITS = "Units";
const TAB_DIMENSIONS = "Dimensions";
const TAB_ALARM = "Alarm";

const DEFAULT_PROPERTIES = {
  general: {
    name: "",
    contents: "",
    density: 0,
    displayDefault: "Weight",
    fullColor: "#00ff00",
    alarmColor: "#ff0000",
  },
  units: {
    linear: "feet",
    volume: "Cubic Feet",
    density: "lbs/ft³",
    weight: "Pounds",
  },
  dimensions: {
    type: "Cylindrical",
    vesselHeight: 0,
    vesselDiameter: 0,
    coneHeight: 0,
    coneOutletDiameter: 0,
  },
  alarm: {
    enabled: false,
    highLevel: 0,
    lowLevel: 0,
    resetMode: "Automatic (based on level)",
  },
};

export default function SiloPropertiesModal({ open, silo, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState(TAB_GENERAL);
  const [localProps, setLocalProps] = useState(DEFAULT_PROPERTIES);

  // ⭐ DRAGGING STATE
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Center the window when opened
  useEffect(() => {
    if (open) {
      const centerX = window.innerWidth / 2 - 340; // 680 width / 2
      const centerY = window.innerHeight / 2 - 200;
      setPos({ x: centerX, y: centerY });
    }
  }, [open]);

  const startDrag = (e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const stopDrag = () => setDragging(false);

  const onDrag = (e) => {
    if (!dragging) return;
    setPos({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
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

  // Load saved props
  useEffect(() => {
    if (!silo) return;

    const propsFromSilo = silo.properties || {};
    setLocalProps({
      general: { ...DEFAULT_PROPERTIES.general, ...(propsFromSilo.general || {}) },
      units: { ...DEFAULT_PROPERTIES.units, ...(propsFromSilo.units || {}) },
      dimensions: {
        ...DEFAULT_PROPERTIES.dimensions,
        ...(propsFromSilo.dimensions || {}),
      },
      alarm: { ...DEFAULT_PROPERTIES.alarm, ...(propsFromSilo.alarm || {}) },
    });
    setActiveTab(TAB_GENERAL);
  }, [silo]);

  if (!open || !silo) return null;

  const updateSection = (section, field, value) => {
    setLocalProps((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleApply = () => {
    if (typeof onSave === "function") {
      onSave({
        ...silo,
        properties: { ...localProps },
      });
    }
  };

  const handleOk = () => {
    handleApply();
    if (typeof onClose === "function") onClose();
  };

  const handleCancel = () => {
    if (typeof onClose === "function") onClose();
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/40">
      {/* Draggable Modal */}
      <div
        className="absolute bg-white border border-gray-400 rounded-md shadow-xl w-[680px]"
        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      >
        {/* Title bar (DRAGGABLE) */}
        <div
          onMouseDown={startDrag}
          className="px-4 py-2 border-b border-gray-300 bg-gray-200 flex items-center justify-between cursor-move select-none"
        >
          <span className="font-semibold text-gray-800 text-sm">
            Silo Properties – {localProps.general.name || silo.id}
          </span>
        </div>

        {/* Tab strip */}
        <div className="px-4 pt-3 border-b border-gray-300 flex gap-1 text-xs bg-white">
          {[TAB_GENERAL, TAB_UNITS, TAB_DIMENSIONS, TAB_ALARM].map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  "px-3 py-1 rounded-t border-x border-t " +
                  (isActive
                    ? "border-gray-400 bg-white font-semibold text-gray-800"
                    : "border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200")
                }
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="px-5 py-4 text-xs h-[260px] overflow-y-auto bg-white">
          {activeTab === TAB_GENERAL && (
            <GeneralTab localProps={localProps} updateSection={updateSection} />
          )}
          {activeTab === TAB_UNITS && (
            <UnitsTab localProps={localProps} updateSection={updateSection} />
          )}
          {activeTab === TAB_DIMENSIONS && (
            <DimensionsTab localProps={localProps} updateSection={updateSection} />
          )}
          {activeTab === TAB_ALARM && (
            <AlarmTab localProps={localProps} updateSection={updateSection} />
          )}
        </div>

        {/* Buttons */}
        <div className="px-4 py-2 border-t border-gray-300 bg-gray-50 flex justify-end gap-2 text-xs">
          <button
            className="px-4 py-1 border border-gray-400 bg-white rounded-sm hover:bg-gray-100"
            onClick={handleOk}
          >
            OK
          </button>
          <button
            className="px-4 py-1 border border-gray-400 bg-white rounded-sm hover:bg-gray-100"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 border border-gray-300 bg-gray-100 rounded-sm hover:bg-gray-200"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================== TABS ================== */

function GeneralTab({ localProps, updateSection }) {
  const g = localProps.general;

  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-3">
      {/* Name */}
      <div className="col-span-2 flex items-center gap-2">
        <label className="w-24 text-right">Name:</label>
        <input
          type="text"
          value={g.name}
          onChange={(e) => updateSection("general", "name", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 flex-1 text-xs"
        />
      </div>

      {/* Contents */}
      <div className="col-span-2 flex items-center gap-2">
        <label className="w-24 text-right">Contents:</label>
        <input
          type="text"
          value={g.contents}
          onChange={(e) => updateSection("general", "contents", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 flex-1 text-xs"
        />
      </div>

      {/* Density */}
      <div className="col-span-2 flex items-center gap-2">
        <label className="w-24 text-right">Density:</label>
        <input
          type="number"
          value={g.density}
          onChange={(e) =>
            updateSection(
              "general",
              "density",
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          className="border border-gray-300 rounded px-2 py-1 w-28 text-xs"
        />
        <span className="text-gray-500 text-[10px]">(Units tab)</span>
      </div>

      {/* Display Default */}
      <div className="col-span-2 flex items-center gap-2">
        <label className="w-24 text-right">Display:</label>
        <select
          value={g.displayDefault}
          onChange={(e) =>
            updateSection("general", "displayDefault", e.target.value)
          }
          className="border border-gray-300 rounded px-2 py-1 w-40 text-xs"
        >
          <option value="Weight">Weight</option>
          <option value="Volume">Volume</option>
          <option value="Level">Level</option>
        </select>
      </div>

      {/* Internal Colors */}
      <div className="col-span-2 mt-2">
        <div className="font-semibold mb-1 text-gray-700">
          Internal Colors of Material
        </div>

        <div className="flex items-center gap-6">
          {/* Full Color */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs">Full:</span>
            <input
              type="color"
              value={g.fullColor}
              onChange={(e) =>
                updateSection("general", "fullColor", e.target.value)
              }
              className="w-7 h-7 border border-gray-300 rounded"
            />
          </div>

          {/* Alarm Color */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs">Alarm:</span>
            <input
              type="color"
              value={g.alarmColor}
              onChange={(e) =>
                updateSection("general", "alarmColor", e.target.value)
              }
              className="w-7 h-7 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function UnitsTab({ localProps, updateSection }) {
  const u = localProps.units;

  return (
    <div className="grid grid-cols-[120px,1fr] gap-y-3 items-center">
      <label className="text-right pr-2">Linear:</label>
      <select
        value={u.linear}
        onChange={(e) => updateSection("units", "linear", e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 w-40 text-xs"
      >
        <option value="feet">feet</option>
        <option value="meters">meters</option>
      </select>

      <label className="text-right pr-2">Volume:</label>
      <select
        value={u.volume}
        onChange={(e) => updateSection("units", "volume", e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 w-52 text-xs"
      >
        <option value="Cubic Feet">Cubic Feet</option>
        <option value="US Bushels">US Bushels</option>
        <option value="US Gallons">US Gallons</option>
        <option value="Cubic Meters">Cubic Meters</option>
        <option value="Litres">Litres</option>
        <option value="British Bushels">British Bushels</option>
        <option value="Imperial Gallons">Imperial Gallons</option>
      </select>

      <label className="text-right pr-2">Density:</label>
      <select
        value={u.density}
        onChange={(e) => updateSection("units", "density", e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 w-40 text-xs"
      >
        <option value="lbs/ft³">lbs/ft³</option>
        <option value="kg/m³">kg/m³</option>
        <option value="g/cm³">g/cm³</option>
      </select>

      <label className="text-right pr-2">Weight:</label>
      <select
        value={u.weight}
        onChange={(e) => updateSection("units", "weight", e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 w-40 text-xs"
      >
        <option value="Pounds">Pounds</option>
        <option value="Short Tons">Short Tons</option>
        <option value="Kilograms">Kilograms</option>
        <option value="Metric Tons">Metric Tons</option>
      </select>
    </div>
  );
}

function DimensionsTab({ localProps, updateSection }) {
  const d = localProps.dimensions;

  const numChange = (field) => (e) =>
    updateSection(
      "dimensions",
      field,
      e.target.value === "" ? "" : Number(e.target.value)
    );

  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-xs">
      {/* Type */}
      <div className="col-span-2 flex items-center gap-2 mb-1">
        <label className="w-24 text-right">Type:</label>
        <select
          value={d.type}
          onChange={(e) => updateSection("dimensions", "type", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 w-48 text-xs"
        >
          <option value="Cylindrical">Cylindrical</option>
          <option value="Cylindrical + Cone">Cylindrical + Cone</option>
          <option value="Conical">Conical</option>
        </select>
      </div>

      {/* Vessel */}
      <div>
        <div className="font-semibold mb-1 text-gray-700">Vessel</div>

        <div className="flex items-center gap-2 mb-2">
          <span className="w-16 text-xs">Height:</span>
          <input
            type="number"
            value={d.vesselHeight}
            onChange={numChange("vesselHeight")}
            className="border border-gray-300 rounded px-2 py-1 w-24 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="w-16 text-xs">Diameter:</span>
          <input
            type="number"
            value={d.vesselDiameter}
            onChange={numChange("vesselDiameter")}
            className="border border-gray-300 rounded px-2 py-1 w-24 text-xs"
          />
        </div>
      </div>

      {/* Cone */}
      <div>
        <div className="font-semibold mb-1 text-gray-700">Cone</div>

        <div className="flex items-center gap-2 mb-2">
          <span className="w-20 text-xs">Height:</span>
          <input
            type="number"
            value={d.coneHeight}
            onChange={numChange("coneHeight")}
            className="border border-gray-300 rounded px-2 py-1 w-24 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="w-20 text-xs">Outlet Dia.:</span>
          <input
            type="number"
            value={d.coneOutletDiameter}
            onChange={numChange("coneOutletDiameter")}
            className="border border-gray-300 rounded px-2 py-1 w-24 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function AlarmTab({ localProps, updateSection }) {
  const a = localProps.alarm;

  const numChange = (field) => (e) =>
    updateSection(
      "alarm",
      field,
      e.target.value === "" ? "" : Number(e.target.value)
    );

  return (
    <div className="grid grid-cols-[120px,1fr] gap-y-3 items-center text-xs">
      <label className="text-right pr-2">Enabled:</label>
      <input
        type="checkbox"
        checked={a.enabled}
        onChange={(e) => updateSection("alarm", "enabled", e.target.checked)}
      />

      <label className="text-right pr-2">High Level:</label>
      <input
        type="number"
        value={a.highLevel}
        onChange={numChange("highLevel")}
        className="border border-gray-300 rounded px-2 py-1 w-28 text-xs"
      />

      <label className="text-right pr-2">Reset Mode:</label>
      <input
        type="text"
        readOnly
        value={a.resetMode}
        className="border border-gray-200 rounded px-2 py-1 w-56 text-xs bg-gray-50 text-gray-500"
      />
    </div>
  );
}
