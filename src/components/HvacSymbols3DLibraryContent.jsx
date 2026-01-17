import HvacSymbols3DLibrary from "../assets/hvac-symbols-3d/HvacSymbols3DLibrary";

export default function HvacSymbols3DLibraryContent() {
  return (
    <HvacSymbols3DLibrary
      onSelect={(src) => console.log("Selected:", src)}
      onDragStart={(src) => console.log("Dragging:", src)}
    />
  );
}
