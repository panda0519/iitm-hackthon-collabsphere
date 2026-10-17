import { Avatar } from "../../components/ui/Avatar.jsx";
import { Counter } from "../../components/ui/Counter.jsx";
import { houseColor } from "@collabsphere/shared";

export function Podium({ ranked, mounted }) {
  const order = [
    { r: ranked[1], place: 2 },
    { r: ranked[0], place: 1 },
    { r: ranked[2], place: 3 }
  ];
  const heights = { 1: 124, 2: 98, 3: 78 };
  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      {order.map(({ r, place }) => (
        <div key={r.house} className="flex flex-col items-center text-center min-w-0">
          <Avatar name={r.house} house={r.house} size={place === 1 ? 52 : 42} />
          <div className="font-display font-semibold text-sm text-tx mt-2 truncate max-w-full">{r.house}</div>
          <div className="text-xs text-ok font-semibold">
            <Counter value={r.xp} /> XP
          </div>
          <div
            className="w-full mt-2 rounded-t-xl border-t-[3px] flex items-start justify-center pt-2 overflow-hidden transition-all duration-700 ease-out"
            style={{
              height: mounted ? heights[place] : 0,
              background: `${houseColor(r.house)}26`,
              borderColor: houseColor(r.house)
            }}
          >
            <span className="font-display font-extrabold text-3xl text-tx/80">{place}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
