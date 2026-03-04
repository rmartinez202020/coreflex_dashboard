// src/hooks/useDropHandler.js
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

export default function useDropHandler({
  setDroppedTanks,

  // ✅ add these 3 from the caller so we can attach to correct dashboard
  activeDashboardId,
  dashboardId,
  selectedTank,
}) {
  const makeId = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now().toString() + Math.random().toString(16).slice(2);
    }
  };

  function getAuthHeaders() {
    const token = String(getToken() || "").trim();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ✅ resolve dashboard id (prefer activeDashboardId, then dashboardId, then selectedTank, else "main")
  function resolveDash() {
    const a = String(activeDashboardId || "").trim();
    if (a) return a;

    const b = String(dashboardId || "").trim();
    if (b) return b;

    const c = String(
      selectedTank?.dashboard_id || selectedTank?.dashboardId || ""
    ).trim();
    if (c) return c;

    return "main";
  }

  // ✅ Create DB row ONLY for counter drops
  async function createCounterPlaceholder(widgetId) {
    try {
      const token = String(getToken() || "").trim();
      if (!token) return;

      const dash = resolveDash();

      await fetch(`${API_URL}/device-counters/create-placeholder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          widget_id: String(widgetId || "").trim(),
          dashboard_id: dash, // "main" allowed
        }),
      });
    } catch (err) {
      // never break the UI on drop
      console.warn("create-placeholder failed:", err);
    }
  }

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

  // ✅ Option A: compute a new "top layer" z for every new drop
  // - Supports both new `z` and any older `zIndex` objects that might still exist.
  const nextTopZ = (prev) => {
    const maxZ = Math.max(
      0,
      ...(prev || []).map((t) =>
        typeof t?.z === "number"
          ? t.z
          : typeof t?.zIndex === "number"
          ? t.zIndex
          : 0
      )
    );
    return maxZ + 1;
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
      setDroppedTanks((prev) => {
        const z = nextTopZ(prev);

        // ✅ NEW: bigger default image drop size
        // (DraggableImage can read these if you already support w/h, otherwise it will ignore safely)
        const DEFAULT_IMG_W = 260;
        const DEFAULT_IMG_H = 160;

        return [
          ...prev,
          {
            id: makeId(),
            shape: "img",
            x,
            y,
            scale: 1,
            src: imgSrc,
            z,

            // ✅ NEW: give images an explicit size (so they don’t drop tiny)
            w: DEFAULT_IMG_W,
            h: DEFAULT_IMG_H,
          },
        ];
      });
      return;
    }

    // ===============================
    // ✅ 2) DEVICE CONTROLS
    // ===============================
    const control = e.dataTransfer.getData("control");
    if (control) {
      if (control === "toggleControl") {
        setDroppedTanks((prev) => {
          const z = nextTopZ(prev);
          return [
            ...prev,
            {
              id: makeId(),
              shape: "toggleSwitch",
              x,
              y,

              w: 120, 
              h: 45, 

              isOn: true,
              z,
            },
          ];
        });
        return;
      }

      if (control === "pushButtonNO") {
        setDroppedTanks((prev) => {
          const z = nextTopZ(prev);
          return [
            ...prev,
            {
              id: makeId(),
              shape: "pushButtonNO",
              x,
              y,
              w: 80,
              h: 8,
              pressed: false,
              z,
            },
          ];
        });
        return;
      }

      if (control === "pushButtonNC") {
        setDroppedTanks((prev) => {
          const z = nextTopZ(prev);
          return [
            ...prev,
            {
              id: makeId(),
              shape: "pushButtonNC",
              x,
              y,
              w: 80,
              h: 80,
              pressed: false,
              z,
            },
          ];
        });
        return;
      }

      if (control === "displayOutput") {
        setDroppedTanks((prev) => {
          const z = nextTopZ(prev);
          return [
            ...prev,
            {
              id: makeId(),
              shape: "displayOutput",
              x,
              y,
              w: 160,
              h: 60,
              value: "",
              z,
              properties: {
                label: "",
                numberFormat: "00000",
                theme: "TextBox",
              },
            },
          ];
        });
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
    // ✅ FIX: make it drop in the "AFTER" size by default
    if (shape === "graphicDisplay") {
      setDroppedTanks((prev) => {
        const z = nextTopZ(prev);

        const DEFAULT_W = 660;
        const DEFAULT_H = 340;

        return [
          ...prev,
          {
            id: makeId(),
            shape: "graphicDisplay",
            x,
            y,

            // ✅ default drop size
            w: DEFAULT_W,
            h: DEFAULT_H,

            // ✅ optional helpers (safe if your resizer uses them)
            baseW: DEFAULT_W,
            baseH: DEFAULT_H,
            minW: 520,
            minH: 260,

            z,
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
        ];
      });
      return;
    }

    // 🚫 Alarm Log drop ignored
    if (shape === "alarmLog") {
      return;
    }

    // ✅ COUNTER INPUT (DI) — CREATE DB ROW ONLY HERE
    if (shape === "counterInput") {
      const newId = makeId(); // ✅ use same ID for widget_id

      setDroppedTanks((prev) => {
        const z = nextTopZ(prev);
        return [
          ...prev,
          {
            id: newId,
            shape: "counterInput",
            x,
            y,
            w: 140,
            h: 120,
            z,
            properties: {
              title: "Counter",
              count: 0,
              digits: 4,
              tag: {
                deviceId: "",
                field: "",
              },
              _prev01: 0,
            },
          },
        ];
      });

      // ✅ create device_counters row ONLY for this shape
      createCounterPlaceholder(newId);

      return;
    }

    // ✅ INDICATORS
    if (shape === "ledCircle") {
      setDroppedTanks((prev) => {
        const z = nextTopZ(prev);
        return [
          ...prev,
          {
            id: makeId(),
            shape: "ledCircle",
            x,
            y,
            w: 70,
            h: 70,
            z,
            properties: {
              label: "",
              onColor: "#22c55e",
              offColor: "#94a3b8",
              blink: false,
            },
          },
        ];
      });
      return;
    }

    if (shape === "statusTextBox") {
      setDroppedTanks((prev) => {
        const z = nextTopZ(prev);
        return [
          ...prev,
          {
            id: makeId(),
            shape: "statusTextBox",
            x,
            y,
            w: 220,
            h: 70,
            z,
            properties: {
              label: "Status",
              value: "OK",
            },
          },
        ];
      });
      return;
    }

    if (shape === "blinkingAlarm") {
      setDroppedTanks((prev) => {
        const z = nextTopZ(prev);
        return [
          ...prev,
          {
            id: makeId(),
            shape: "blinkingAlarm",
            x,
            y,
            w: 240,
            h: 70,
            z,
            properties: {
              label: "ALARM",
              blinkMs: 500,
              alarmStyle: "annunciator",
              alarmTone: "critical",
              colorOn: "#ef4444",
              colorOff: "#0b1220",
              tag: {
                deviceId: "",
                field: "",
              },
            },
          },
        ];
      });
      return;
    }

    if (shape === "stateImage") {
      setDroppedTanks((prev) => {
        const z = nextTopZ(prev);
        return [
          ...prev,
          {
            id: makeId(),
            shape: "stateImage",
            x,
            y,
            w: 140,
            h: 140,
            z,
            properties: {
              state: "OFF",
            },
          },
        ];
      });
      return;
    }

    // TEXT BOX
    if (shape === "textBox") {
      setDroppedTanks((prev) => {
        const z = nextTopZ(prev);
        return [
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
            z,
          },
        ];
      });
      return;
    }

    // ===============================
    // ✅ 4) OTHER MODELS
    // ===============================
    setDroppedTanks((prev) => {
      const z = nextTopZ(prev);
      return [
        ...prev,
        {
          id: makeId(),
          shape,
          x,
          y,
          scale: 1,
          z,
        },
      ];
    });
  };

  return { handleDrop };
}