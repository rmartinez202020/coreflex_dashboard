import FloatingWindow from "./FloatingWindow";
import ManufacturingSymbols3DLibraryContent from "./ManufacturingSymbols3DLibraryContent";

export default function ManufacturingSymbols3DLibrary(props) {
  return (
    <FloatingWindow {...props} title="Manufacturing Symbols 3D">
      <ManufacturingSymbols3DLibraryContent />
    </FloatingWindow>
  );
}
