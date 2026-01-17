import HmiSymbolsLibrary from "../assets/hmi-symbols/HmiSymbolsLibrary";

export default function HmiSymbolsLibraryContent() {
  return (
    <HmiSymbolsLibrary
      onSelect={(src) => console.log("Selected:", src)}
      onDragStart={(src) => console.log("Dragging:", src)}
    />
  );
}
