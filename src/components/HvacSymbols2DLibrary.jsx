import FloatingWindow from "./FloatingWindow";
import HvacSymbols2DLibraryContent from "../assets/hvac-symbols-2d/HvacSymbols2DLibraryContent.jsx";

export default function HvacSymbols2DLibrary(props) {
  return (
    <FloatingWindow {...props} title="HVAC Symbols 2D">
      <HvacSymbols2DLibraryContent />
    </FloatingWindow>
  );
}
