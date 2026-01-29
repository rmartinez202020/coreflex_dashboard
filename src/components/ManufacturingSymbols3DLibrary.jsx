import ShapeOfFloatingWindows from "./ShapeOfFloatingWindows";
import ManufacturingSymbols3DLibraryContent from "./ManufacturingSymbols3DLibraryContent";

export default function ManufacturingSymbols3DLibrary(props) {
  return (
    <ShapeOfFloatingWindows {...props} title="Manufacturing Symbols 3D">
      <ManufacturingSymbols3DLibraryContent />
    </ShapeOfFloatingWindows>
  );
}
