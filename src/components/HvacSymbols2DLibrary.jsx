// HvacSymbols2DLibrary.jsx
import FloatingWindow from "./FloatingWindow";
import HvacSymbols2DLibraryContent from "../assets/Hvac-symbols 2D/HvacSymbols2DLibraryContent";

export default function HvacSymbols2DLibrary(props) {
  return (
    <FloatingWindow {...props} title="HVAC Symbols 2D">
      <HvacSymbols2DLibraryContent />
    </FloatingWindow>
  );
}
