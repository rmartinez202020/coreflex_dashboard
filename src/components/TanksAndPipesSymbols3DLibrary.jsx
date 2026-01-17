import FloatingWindow from "./FloatingWindow";
import TanksAndPipesSymbols3DLibraryContent from "../assets/tanks-and-pipes-symbols-3d/TanksAndPipesSymbols3DLibraryContent.jsx";

export default function TanksAndPipesSymbols3DLibrary(props) {
  return (
    <FloatingWindow {...props} title="Tanks & Pipes Symbols 3D">
      <TanksAndPipesSymbols3DLibraryContent />
    </FloatingWindow>
  );
}
