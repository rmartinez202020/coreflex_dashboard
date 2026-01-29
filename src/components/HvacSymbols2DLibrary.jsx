import ShapeOfFloatingWindows from "./ShapeOfFloatingWindows";
import HvacSymbols2DLibraryContent from "./HvacSymbols2DLibraryContent";

export default function HvacSymbols2DLibrary(props) {
  return (
    <ShapeOfFloatingWindows {...props} title="HVAC Symbols 2D">
      <HvacSymbols2DLibraryContent />
    </ShapeOfFloatingWindows>
  );
}
