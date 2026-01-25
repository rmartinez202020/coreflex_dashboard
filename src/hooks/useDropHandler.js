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

    // allow: https, http, data:image, blob
    if (
      v.startsWith("http://") ||
      v.startsWith("https://") ||
      v.startsWith("data:image/") ||
      v.startsWith("blob:")
    )
      return true;

    // allow common file extensions
    return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(v);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // ===============================
    // ✅ 1) IMAGE DROP (ONLY real urls)
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
    // ✅ 2) DEVICE CONTROLS DROP
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

    // ===============================
    // ✅ 3) SHAPES (RightSidebar)
    // ===============================
    const shape = e.dataTransfer.getData("shape");
    if (!shape) return;

    // ✅ GRAPHIC DISPLAY
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

    // ✅✅✅ ALARMS LOG (DI-AI)
    if (shape === "alarmLog") {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "alarmLog",
          x,
          y,
          w: 780,
          h: 360,
          zIndex: 1,
          title: "Alarms Log (DI-AI)",
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

    // 4) OTHER MODELS
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
