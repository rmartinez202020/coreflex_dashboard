import FloatingWindow from "./FloatingWindow";
import HmiSymbolsLibraryContent from "./HmiSymbolsLibraryContent";

export default function HmiSymbolsLibrary(props) {
  return (
    <FloatingWindow {...props} title="HMI Symbols">
      <HmiSymbolsLibraryContent />
    </FloatingWindow>
  );
}
