import FloatingWindow from "./FloatingWindow";
import ManufacturingSymbols2DLibraryContent from "../assets/manufacturing-symbols-2d/ManufacturingSymbols2DLibraryContent.jsx";

export default function ManufacturingSymbols2DLibrary(props) {
  return (
    <FloatingWindow {...props} title="Manufacturing Symbols 2D">
      <ManufacturingSymbols2DLibraryContent />
    </FloatingWindow>
  );
}
