import FloatingWindow from "./FloatingWindow";
import TanksAndPipesSymbols2DLibraryContent from "./TanksAndPipesSymbols2DLibraryContent.jsx";

export default function TanksAndPipesSymbols2DLibrary(props) {
  return (
    <FloatingWindow {...props} title="Tanks & Pipes Symbols 2D">
      <TanksAndPipesSymbols2DLibraryContent />
    </FloatingWindow>
  );
}
