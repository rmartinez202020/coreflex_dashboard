import FloatingWindow from "./FloatingWindow";
import TanksAndPipesSymbols3DLibraryContent from "./TanksAndPipesSymbols3DLibraryContent";

export default function TanksAndPipesSymbols3DLibrary(props) {
  return (
    <FloatingWindow {...props} title="Tanks & Pipes Symbols 3D">
      <TanksAndPipesSymbols3DLibraryContent />
    </FloatingWindow>
  );
}
