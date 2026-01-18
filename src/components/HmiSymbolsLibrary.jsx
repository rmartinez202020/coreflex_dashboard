import React from "react";
import FloatingWindow from "./FloatingWindow";
import HmiSymbolsLibraryGrid from "./HmiSymbolsLibraryGrid";

export default function HmiSymbolsLibrary(props) {
  return (
    <FloatingWindow {...props} title="HMI Symbols">
      <HmiSymbolsLibraryGrid
        onSelect={props.onSelect}
        onDragStart={props.onDragStart}
      />
    </FloatingWindow>
  );
}
