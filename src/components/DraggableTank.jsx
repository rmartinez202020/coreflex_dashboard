import DraggableDroppedTank from "./DraggableDroppedTank";
import { StandardTank } from "./ProTankIcon";

export default function DraggableTank({ sensor }) {
  const level = sensor.level_percent ?? 0;

  const tankObject = {
    id: sensor.imei.toString(),
    shape: "liveTank",
    x: sensor.x ?? 0,
    y: sensor.y ?? 0,
    scale: 1,
    zIndex: sensor.zIndex ?? 1,     // ⭐ follows layering
  };

  return (
    <DraggableDroppedTank
      tank={tankObject}
      selected={false}
      selectedIds={[]}
      dragDelta={{ x: 0, y: 0 }}
      onSelect={() => {}}
      onRightClick={() => {}}
      onDoubleClick={() => {}}
      onUpdate={() => {}}
    >
      <StandardTank level={level} />
    </DraggableDroppedTank>
  );
}
