import ManufacturingSymbols2DLibrary from "../assets/manufacturing-symbols-2d/ManufacturingSymbols2DLibrary";

export default function ManufacturingSymbols2DLibraryContent() {
  return (
    <ManufacturingSymbols2DLibrary
      onSelect={(src) => console.log("Selected:", src)}
      onDragStart={(src) => console.log("Dragging:", src)}
    />
  );
}
