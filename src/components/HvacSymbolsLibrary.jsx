import HvacSymbolsLibraryContent from "../assets/hvac-symbols/HvacSymbolsLibraryContent";
import CoreFlexLibrary from "./CoreFlexLibrary";

export default function HvacSymbolsLibrary(props) {
  return (
    <CoreFlexLibrary {...props} title="HVAC Symbols">
      <HvacSymbolsLibraryContent />
    </CoreFlexLibrary>
  );
}
