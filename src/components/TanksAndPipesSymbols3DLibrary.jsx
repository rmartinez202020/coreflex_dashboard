import ShapeOfFloatingWindows from "./ShapeOfFloatingWindows";
import TanksAndPipesSymbols3DLibraryContent from "./TanksAndPipesSymbols3DLibraryContent";

export default function TanksAndPipesSymbols3DLibrary(props) {
  return (
    <ShapeOfFloatingWindows {...props} title="Tanks & Pipes Symbols 3D">
      <TanksAndPipesSymbols3DLibraryContent />
    </ShapeOfFloatingWindows>
  );
}
