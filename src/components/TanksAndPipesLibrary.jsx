import TanksAndPipesLibraryContent from "../assets/tanks-and-pipes-symbols/TanksAndPipesLibraryContent";
import CoreFlexLibrary from "./CoreFlexLibrary";

export default function TanksAndPipesLibrary(props) {
  return (
    <CoreFlexLibrary {...props} title="Tanks & Pipes Symbols">
      <TanksAndPipesLibraryContent />
    </CoreFlexLibrary>
  );
}
