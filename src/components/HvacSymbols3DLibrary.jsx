import ShapeOfFloatingWindows from "./ShapeOfFloatingWindows";
import HvacSymbols3DLibraryContent from "./HvacSymbols3DLibraryContent";

export default function HvacSymbols3DLibrary(props) {
  return (
    <ShapeOfFloatingWindows {...props} title="HVAC Symbols 3D">
      <HvacSymbols3DLibraryContent />
    </ShapeOfFloatingWindows>
  );
}
