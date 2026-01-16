import ManufacturingSymbolsLibraryContent from "../assets/manufacturing-symbols/ManufacturingSymbolsLibraryContent";
import CoreFlexLibrary from "./CoreFlexLibrary";

export default function ManufacturingSymbolsLibrary(props) {
  return (
    <CoreFlexLibrary {...props} title="Manufacturing Symbols">
      <ManufacturingSymbolsLibraryContent />
    </CoreFlexLibrary>
  );
}
