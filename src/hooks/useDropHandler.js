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

    // 1️⃣ USER IMAGE LIBRARY DROP (Cloudinary)
    // App.jsx / ImageLibrary.jsx sets: e.dataTransfer.setData("imageUrl", img.src)
    const imageUrl = e.dataTransfer.getData("imageUrl");
    if (imageUrl) {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "img",
          x,
          y,
          scale: 1,
          src: imageUrl,
          zIndex: 1,
        },
      ]);
      return;
    }

    // 2️⃣ COREFLEX STATIC IMAGE DROP
    const staticImgSrc = e.dataTransfer.getData("coreflex-image");
    if (staticImgSrc) {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: makeId(),
          shape: "img",
          x,
          y,
          scale: 1,
          src: staticImgSrc,
          zIndex: 1,
        },
      ]);
      return;
    }

    // ✅ 3️⃣ DEVICE CONTROLS DROP (Toggle / Push Buttons / Interlock)
    // from DraggableControls.jsx -> e.dataTransfer.setData("control", ctrl.type)
    const control = e.dataTransfer.getData("control");
    if (control) {
      // Toggle Switch
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

      // ✅ Push Button (NO) -> Green
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

      // ✅ Push Button (NC) -> Red
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

      // ✅ Interlock (NEW) — match DashboardCanvas defaults
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

      return;
    }

    // 4️⃣ DRAGGING A SHAPE / TEXT BOX
    const shape = e.dataTransfer.getData("shape");
    if (!shape) return;

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

          // ✅ defaults (align with your modal naming)
          title: "Graphic Display",
          timeUnit: "seconds",
          sampleMs: 1000,
          window: 60,

          // ✅ NEW defaults for vertical axis + style (matches modal)
          yMin: 0,
          yMax: 100,
          yUnits: "",
          graphStyle: "line",

          // keep your old fields too (backward compatible if other code uses them)
          sampleEveryMs: 1000,
          windowCount: 60,

          // series config
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

    // 5️⃣ TANK MODELS (standard/horizontal/vertical/silo)
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
