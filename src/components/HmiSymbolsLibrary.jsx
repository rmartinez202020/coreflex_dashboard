import HmiSymbolsLibraryContent from "../assets/hmi-symbols/HmiSymbolsLibraryContent";
import CoreFlexLibrary from "./CoreFlexLibrary";

export default function HmiSymbolsLibrary(props) {
  return (
    <CoreFlexLibrary {...props} title="HMI Symbols">
      <HmiSymbolsLibraryContent />
    </CoreFlexLibrary>
  );
}
