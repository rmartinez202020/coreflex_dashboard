// src/components/ProTankIcon.jsx
import React from "react";

import { SiloTank, SiloTankIcon } from "./ProTankIconSilo";
import { StandardTank, StandardTankIcon } from "./ProTankIconStandard";
import { HorizontalTank, HorizontalTankIcon } from "./ProTankIconHorizontal";
import { VerticalTank, VerticalTankIcon } from "./ProTankIconVertical";

// ✅ re-export everything from dedicated files
export {
  StandardTank,
  StandardTankIcon,
  HorizontalTank,
  HorizontalTankIcon,
  VerticalTank,
  VerticalTankIcon,
  SiloTank,
  SiloTankIcon,
};
