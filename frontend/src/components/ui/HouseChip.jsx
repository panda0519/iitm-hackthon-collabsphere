import { houseColor } from "@collabsphere/shared";

export function HouseChip({ house, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-tx ${className}`}>
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: houseColor(house) }} />
      {house}
    </span>
  );
}
