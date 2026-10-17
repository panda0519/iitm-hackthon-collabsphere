import { houseColor } from "@collabsphere/shared";

export function Avatar({ name, house, size = 32 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-display font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: houseColor(house),
        color: "#080916",
        fontSize: Math.round(size * 0.42)
      }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
