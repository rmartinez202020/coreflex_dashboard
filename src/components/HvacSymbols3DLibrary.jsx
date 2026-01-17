import FloatingWindow from "./FloatingWindow";
import HvacSymbols3DLibraryContent from "./HvacSymbols3DLibraryContent";

export default function HvacSymbols3DLibrary(props) {
  return (
    <FloatingWindow {...props} title="HVAC Symbols 3D">
      <HvacSymbols3DLibraryContent />
    </FloatingWindow>
  );
}
