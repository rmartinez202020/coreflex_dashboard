import TanksAndPipesSymbols3DLibrary from "../assets/tanks-and-pipes-symbols-3d/TanksAndPipesSymbols3DLibrary";

export default function TanksAndPipesSymbols3DLibraryContent() {
  return (
    <TanksAndPipesSymbols3DLibrary
      onSelect={(src) => console.log("Selected:", src)}
      onDragStart={(src) => console.log("Dragging:", src)}
    />
  );
}
