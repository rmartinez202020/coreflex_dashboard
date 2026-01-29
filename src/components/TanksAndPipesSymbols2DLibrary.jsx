import ShapeOfFloatingWindows from "./ShapeOfFloatingWindows";
import TanksAndPipesSymbols2DLibraryContent from "./TanksAndPipesSymbols2DLibraryContent";

export default function TanksAndPipesSymbols2DLibrary(props) {
  return (
    <ShapeOfFloatingWindows {...props} title="Tanks & Pipes Symbols 2D">
      <TanksAndPipesSymbols2DLibraryContent />
    </ShapeOfFloatingWindows>
  );
}
