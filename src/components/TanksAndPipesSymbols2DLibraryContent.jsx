import TanksAndPipesSymbols2DLibrary from "../assets/tanks-and-pipes-symbols-2d/TanksAndPipesSymbols2DLibrary";

export default function TanksAndPipesSymbols2DLibraryContent() {
  return (
    <TanksAndPipesSymbols2DLibrary
      onSelect={(src) => console.log("Selected:", src)}
      onDragStart={(src) => console.log("Dragging:", src)}
    />
  );
}
