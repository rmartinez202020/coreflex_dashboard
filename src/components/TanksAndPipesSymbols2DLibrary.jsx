// TanksAndPipesSymbols2DLibrary.jsx
import FloatingWindow from "./FloatingWindow";
import TanksAndPipesSymbols2DLibraryContent from "../assets/Tanks-and-pipes-symbols 2D/TanksAndPipesSymbols2DLibraryContent";

export default function TanksAndPipesSymbols2DLibrary(props) {
  return (
    <FloatingWindow {...props} title="Tanks & Pipes Symbols 2D">
      <TanksAndPipesSymbols2DLibraryContent />
    </FloatingWindow>
  );
}
