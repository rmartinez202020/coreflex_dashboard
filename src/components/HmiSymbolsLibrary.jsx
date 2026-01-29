import React from "react";
import ShapeOfFloatingWindows from "./ShapeOfFloatingWindows";
import HmiSymbolsLibraryGrid from "./HmiSymbolsLibraryGrid";

export default function HmiSymbolsLibrary(props) {
  return (
    <ShapeOfFloatingWindows
      {...props}
      title="HMI Symbols"
    >
      <HmiSymbolsLibraryGrid
        onSelect={props.onSelect}
        onDragStart={props.onDragStart}
      />
    </ShapeOfFloatingWindows>
  );
}
