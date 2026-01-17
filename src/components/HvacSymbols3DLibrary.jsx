import FloatingWindow from "./FloatingWindow";
import HvacSymbols3DLibraryContent from "../assets/hvac-symbols-3d/HvacSymbols3DLibraryContent.jsx";

export default function HvacSymbols3DLibrary(props) {
  return (
    <FloatingWindow {...props} title="HVAC Symbols 3D">
      <HvacSymbols3DLibraryContent />
    </FloatingWindow>
  );
}
