import ManufacturingSymbols3DLibrary from "../assets/manufacturing-symbols-3d/ManufacturingSymbols3DLibrary";

export default function ManufacturingSymbols3DLibraryContent() {
  return (
    <ManufacturingSymbols3DLibrary
      onSelect={(src) => console.log("Selected:", src)}
      onDragStart={(src) => console.log("Dragging:", src)}
    />
  );
}
