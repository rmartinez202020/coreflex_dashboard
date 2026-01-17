import HvacSymbols2DLibrary from "../assets/hvac-symbols-2d/HvacSymbols2DLibrary";

export default function HvacSymbols2DLibraryContent() {
  return (
    <HvacSymbols2DLibrary
      onSelect={(src) => console.log("Selected:", src)}
      onDragStart={(src) => console.log("Dragging:", src)}
    />
  );
}
