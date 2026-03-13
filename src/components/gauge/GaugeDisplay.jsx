// src/components/gauge/GaugeDisplay.jsx

import React from "react";

import ClassicRoundGauge from "./styles/ClassicRoundGauge";
import SemiCircleGauge from "./styles/SemiCircleGauge";
import ModernArcGauge from "./styles/ModernArcGauge";
import RadialBarGauge from "./styles/RadialBarGauge";

import { buildGaugeDefaults } from "./utils";

export default function GaugeDisplay({
  value = 0,
  settings = {},
  width = 220,
  height = 220,
}) {
  const cfg = buildGaugeDefaults(settings);

  const style = String(cfg.gaugeStyle || "classic").toLowerCase();

  switch (style) {
    case "semi":
    case "semicircle":
    case "semi-circle":
      return (
        <SemiCircleGauge
          value={value}
          settings={cfg}
          width={width}
          height={height}
        />
      );

    case "arc":
    case "modern":
    case "modernarc":
      return (
        <ModernArcGauge
          value={value}
          settings={cfg}
          width={width}
          height={height}
        />
      );

    case "radial":
    case "radialbar":
      return (
        <RadialBarGauge
          value={value}
          settings={cfg}
          width={width}
          height={height}
        />
      );

    case "classic":
    default:
      return (
        <ClassicRoundGauge
          value={value}
          settings={cfg}
          width={width}
          height={height}
        />
      );
  }
}