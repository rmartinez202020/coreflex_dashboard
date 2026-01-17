import FloatingWindow from "./FloatingWindow";
import HmiSymbolsLibraryContent from "../assets/Hmi-symbols/HmiSymbolsLibraryContent.jsx";

export default function HmiSymbolsLibrary(props) {
  return (
    <FloatingWindow {...props} title="HMI Symbols">
      <HmiSymbolsLibraryContent />
    </FloatingWindow>
  );
}

