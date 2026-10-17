import { useMemo } from "react";
import { Logo } from "../../components/ui/Logo.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { useTilt } from "../../hooks/useTilt.js";
import { qrDataUrl } from "../../utils/qr.js";
import { houseColor } from "@collabsphere/shared";

// Holographic member pass: tilts toward the pointer and catches the light.
export function MemberPass({ user, lvl, checkIns, rank }) {
  const tilt = useTilt();
  const qr = useMemo(() => qrDataUrl(`collabsphere://member/${user.rollNo}`), [user.rollNo]);
  const hc = houseColor(user.house);
  return (
    <div className="tilt-wrap h-full">
      <div
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        className="tilt relative h-full min-h-[260px] rounded-3xl p-5 overflow-hidden flex flex-col"
        style={{
          background: `linear-gradient(150deg, ${hc}59, rgb(255 255 255 / .07) 58%)`,
          border: `1px solid ${hc}99`,
          boxShadow: `0 28px 70px -30px ${hc}, inset 0 1px 0 rgb(255 255 255 / .4)`,
          backdropFilter: "blur(30px) saturate(1.6)",
          WebkitBackdropFilter: "blur(30px) saturate(1.6)"
        }}
      >
        <div className="shine pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative flex items-center gap-2 text-xs font-semibold text-tx">
          <Logo id="lg-pass" size={22} />
          CollabSphere member pass
        </div>
        <div className="relative mt-4">
          <div className="font-display font-extrabold text-3xl leading-tight text-tx break-words">{user.name}</div>
          <div className="font-mono text-[11px] text-mu mt-1">{user.rollNo}</div>
        </div>
        <div className="relative mt-3 inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-xs font-bold text-priink" style={{ background: hc }}>
          <Icon name="flame" className="w-3.5 h-3.5" />
          {user.house} house
        </div>
        <div className="relative mt-auto pt-4 flex items-end justify-between gap-3">
          <dl className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
            <div>
              <dt className="text-mu">Level</dt>
              <dd className="font-display font-bold text-lg text-tx">{lvl.level}</dd>
            </div>
            <div>
              <dt className="text-mu">XP</dt>
              <dd className="font-display font-bold text-lg text-tx">{user.xp}</dd>
            </div>
            <div>
              <dt className="text-mu">Rank</dt>
              <dd className="font-display font-bold text-lg text-tx">#{rank}</dd>
            </div>
            <div className="col-span-3 text-[11px] text-mu">
              {lvl.name}, {checkIns} verified check-in{checkIns === 1 ? "" : "s"}
            </div>
          </dl>
          {qr && <img src={qr} alt="Member verification QR code" className="w-16 h-16 rounded-lg bg-white p-1 shrink-0" style={{ imageRendering: "pixelated" }} />}
        </div>
      </div>
    </div>
  );
}
