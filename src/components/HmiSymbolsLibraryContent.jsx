import HmiSymbolsLibrary from "./HmiSymbolsLibrary.jsx";

export default function HmiSymbolsLibraryContent() {
  return (
    <HmiSymbolsLibrary
      onSelect={(src) => console.log("Selected:", src)}
      onDragStart={(src) => console.log("Dragging:", src)}
    />
  );
}
