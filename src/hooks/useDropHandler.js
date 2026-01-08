export default function useDropHandler({
  uploadedImages,
  setDroppedTanks,
}) {
  const handleDrop = (e) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1️⃣ USER IMAGE LIBRARY DROP
    const imageId = e.dataTransfer.getData("imageId");
    if (imageId) {
      const img = uploadedImages.find((i) => i.id === imageId);
      if (img) {
        setDroppedTanks((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            shape: "img",
            x,
            y,
            scale: 1,
            src: img.src,
            zIndex: 1,
          },
        ]);
      }
      return;
    }

    // 2️⃣ COREFLEX STATIC IMAGE DROP
    const staticImgSrc = e.dataTransfer.getData("coreflex-image");
    if (staticImgSrc) {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
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

    // ✅ 3️⃣ DEVICE CONTROLS DROP (NEW)
    // from DraggableControls.jsx -> e.dataTransfer.setData("control", ctrl.type)
    const control = e.dataTransfer.getData("control");
    if (control) {
      // Toggle Switch -> render the iOS-style toggle on canvas
      if (control === "toggleControl") {
        setDroppedTanks((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
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

      // Placeholders (we’ll style these next)
      if (control === "pushButtonControl") {
        setDroppedTanks((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            shape: "pushButtonControl",
            x,
            y,
            w: 90,
            h: 90,
            zIndex: 1,
          },
        ]);
        return;
      }

      if (control === "interlockControl") {
        setDroppedTanks((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            shape: "interlockControl",
            x,
            y,
            w: 120,
            h: 90,
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

    // TEXT BOX
    if (shape === "textBox") {
      setDroppedTanks((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
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
        id: Date.now().toString(),
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
