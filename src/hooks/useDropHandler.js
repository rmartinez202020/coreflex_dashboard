// src/hooks/useDropHandler.js
export default function useDropHandler({ setDroppedTanks }) {
  const makeId = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now().toString() + Math.random().toString(16).slice(2);
    }
  };

  // ✅ Only accept actual image URLs / data URLs as "image drops"
  const isLikelyImageUrl = (s) => {
    const v = String(s || "").trim();
    if (!v) return false;

    if (
      v.startsWith("http://") ||
      v.startsWith("https://") ||
      v.startsWith("data:image/") ||
      v.startsWith("blob:")
    )
      return true;

    return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(v);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // ✅ canvas coords
    const y = e.clientY - rect.top; // ✅ canvas coords

    // ===============================
    // ✅ 1) IMAGE DROP
    // ===============================
    const imageUrl = e.dataTransfer.getData("imageUrl");
    const coreflexImg = e.dataTransfer.getData("coreflex-image");
    const plain = e.dataTransfer.getData("text/plain");

    const imgSrc =
      (isLikelyImageUrl(imageUrl) && imageUrl) ||
      (isLikelyImageUrl(coreflexImg) && coreflexImg) ||
      (isLikelyImageUrl(plain) && plain);

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

    // ===============================
    // ✅ 2) DEVICE CONTROLS
    // ===============================
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
            pressed: false,
            zIndex: 1,
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
            pressed: false,
            zIndex: 1,
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

    // ===============================
    // ✅ 3) SHAPES (RightPanel + SidebarLeft)
    // ===============================
    const shape = e.dataTransfer.getData("shape");
    if (!shape) return;

    // ✅ GRAPHIC DISPLAY (canvas object)
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

    // 🚫 Alarm Log drop ignored
    if (shape === "alarmLog") {
      return;
    }

    // ✅ INDICATORS (NEW)
    if (shape === "ledCircle") {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "ledCircle",
          x,
          y,
          w: 70,
          h: 70,
          zIndex: 1,
          // optional default props
          properties: {
            label: "",
            onColor: "#22c55e",
            offColor: "#94a3b8",
            blink: false,
          },
        },
      ]);
      return;
    }

    if (shape === "statusTextBox") {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "statusTextBox",
          x,
          y,
          w: 220,
          h: 70,
          zIndex: 1,
          properties: {
            label: "Status",
            value: "OK",
          },
        },
      ]);
      return;
    }

    if (shape === "blinkingAlarm") {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "blinkingAlarm",
          x,
          y,
          w: 220,
          h: 70,
          zIndex: 1,
          properties: {
            label: "ALARM",
            active: true,
            blinkMs: 500,
          },
        },
      ]);
      return;
    }

    if (shape === "stateImage") {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "stateImage",
          x,
          y,
          w: 140,
          h: 140,
          zIndex: 1,
          properties: {
            state: "OFF",
            // you can later store image urls per state here
            // offSrc: "",
            // onSrc: "",
          },
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

    // ===============================
    // ✅ 4) OTHER MODELS
    // ===============================
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
