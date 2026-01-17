// ManufacturingSymbols3DLibrary.jsx
import FloatingWindow from "./FloatingWindow";
import ManufacturingSymbols3DLibraryContent from "../assets/manufacturing-symbols-3d/ManufacturingSymbols3DLibraryContent";

export default function ManufacturingSymbols3DLibrary(props) {
  return (
    <FloatingWindow {...props} title="Manufacturing Symbols 3D">
      <ManufacturingSymbols3DLibraryContent />
    </FloatingWindow>
  );
}
