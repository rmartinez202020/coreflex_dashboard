// src/hooks/useDropHandler.js
export default function useDropHandler({ setDroppedTanks }) {
  const makeId = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now().toString() + Math.random().toString(16).slice(2);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // ===============================
    // ✅ 1) IMAGE DROP (ALL SOURCES)
    // ===============================
    const imgSrc =
      e.dataTransfer.getData("imageUrl") ||
      e.dataTransfer.getData("coreflex-image") ||
      e.dataTransfer.getData("text/plain");

    if (imgSrc) {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "img",
          x,
          y,
          scale: 1,
          src: imgSrc,
          zIndex: 1,
        },
      ]);
      return;
    }

    // ✅ 2) DEVICE CONTROLS DROP
    const control = e.dataTransfer.getData("control");
    if (control) {
      if (control === "toggleControl") {
        setDroppedTanks((prev) => [
          ...prev,
          {
            id: makeId(),
            shape: "toggleSwitch",
            x,
            y,
            w: 180,
            h: 70,
            isOn: true,
            zIndex: 1,
          },
        ]);
        return;
      }

      if (control === "pushButtonNO") {
        setDroppedTanks((prev) => [
          ...prev,
          {
            id: makeId(),
            shape: "pushButtonNO",
            x,
            y,
            w: 110,
            h: 110,
            zIndex: 1,
            pressed: false,
          },
        ]);
        return;
      }

      if (control === "pushButtonNC") {
        setDroppedTanks((prev) => [
          ...prev,
          {
            id: makeId(),
            shape: "pushButtonNC",
            x,
            y,
            w: 110,
            h: 110,
            zIndex: 1,
            pressed: false,
          },
        ]);
        return;
      }

      if (control === "interlockControl" || control === "interlock") {
        setDroppedTanks((prev) => [
          ...prev,
          {
            id: makeId(),
            shape: "interlockControl",
            x,
            y,
            w: 190,
            h: 80,
            locked: true,
            zIndex: 1,
          },
        ]);
        return;
      }

      if (control === "displayOutput") {
        setDroppedTanks((prev) => [
          ...prev,
          {
            id: makeId(),
            shape: "displayOutput",
            x,
            y,
            w: 160,
            h: 60,
            value: "",
            zIndex: 1,
            properties: {
              label: "",
              numberFormat: "00000",
              theme: "TextBox",
            },
          },
        ]);
        return;
      }

      return;
    }

    // 3) DRAGGING A SHAPE / ENTITY
    const shape = e.dataTransfer.getData("shape");
    if (!shape) return;

    // ✅ NEW: ALARMS LOG (AI)
    // Dropping the sidebar icon should create the FULL window object (not the small tile)
    if (shape === "alarmLog") {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "alarmLogWindow",
          x,
          y,
          w: 720,
          h: 320,
          zIndex: 1,
          title: "Alarms Log (AI)",
        },
      ]);
      return;
    }

    // ✅ GRAPHIC DISPLAY (Trend)
    if (shape === "graphicDisplay") {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "graphicDisplay",
          x,
          y,
          w: 520,
          h: 260,
          zIndex: 1,
          title: "Graphic Display",
          timeUnit: "seconds",
          sampleMs: 1000,
          window: 60,
          yMin: 0,
          yMax: 100,
          yUnits: "",
          graphStyle: "line",
          sampleEveryMs: 1000,
          windowCount: 60,
          series: [
            {
              name: "Level %",
              deviceId: "",
              field: "level_percent",
            },
          ],
          recording: false,
          samples: [],
        },
      ]);
      return;
    }

    // TEXT BOX
    if (shape === "textBox") {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "textBox",
          x,
          y,
          text: "Text...",
          fontSize: 16,
          color: "#000",
          width: 160,
          height: 60,
          zIndex: 1,
        },
      ]);
      return;
    }

    // 4) TANK MODELS (default)
    setDroppedTanks((prev) => [
      ...prev,
      {
        id: makeId(),
        shape,
        x,
        y,
        scale: 1,
        zIndex: 1,
      },
    ]);
  };

  return { handleDrop };
}
