import FloatingWindow from "./FloatingWindow";
import ManufacturingSymbols2DLibraryContent from "../assets/Manufacturing-symbols 2D/ManufacturingSymbols2DLibraryContent.jsx";

export default function ManufacturingSymbols2DLibrary(props) {
  return (
    <FloatingWindow {...props} title="Manufacturing Symbols 2D">
      <ManufacturingSymbols2DLibraryContent />
    </FloatingWindow>
  );
}
