import CoreFlexIOTsLibrary from "../assets/coreflex-iots-library/CoreFlexIOTsLibrary";
import ShapeOfFloatingWindows from "./ShapeOfFloatingWindows";

export default function CoreFlexLibrary({
  visible,
  position,
  size,
  onClose,
  onStartDragWindow,
  onStartResizeWindow,
}) {
  return (
    <ShapeOfFloatingWindows
      visible={visible}
      title="CoreFlex IOTs Library"
      position={position}
      size={size}
      onClose={onClose}
      onStartDragWindow={onStartDragWindow}
      onStartResizeWindow={onStartResizeWindow}
    >
      <CoreFlexIOTsLibrary
        onSelect={(src) => console.log("Selected:", src)}
        onDragStart={(src) => console.log("Dragging:", src)}
      />
    </ShapeOfFloatingWindows>
  );
}
