import ShapeOfFloatingWindows from "./ShapeOfFloatingWindows";
import ManufacturingSymbols2DLibraryContent from "./ManufacturingSymbols2DLibraryContent";

export default function ManufacturingSymbols2DLibrary(props) {
  return (
    <ShapeOfFloatingWindows {...props} title="Manufacturing Symbols 2D">
      <ManufacturingSymbols2DLibraryContent />
    </ShapeOfFloatingWindows>
  );
}
