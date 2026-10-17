import { useEffect, useRef, useState } from "react";
import { Card } from "../../components/ui/Card.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Segmented } from "../../components/ui/Segmented.jsx";
import { HouseChip } from "../../components/ui/HouseChip.jsx";
import { Ring } from "../../components/ui/Ring.jsx";
import { Counter } from "../../components/ui/Counter.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { useMounted } from "../../hooks/useMounted.js";
import { entryIsValid, houseColor, HOUSES, levelFor, rankHouses } from "@collabsphere/shared";
import { useApp } from "../../state/AppContext.jsx";
import { apiEnabled } from "../../services/client.js";
import { Podium } from "./Podium.jsx";

const BLOCK_STYLE = {
  idle: "border-line bg-s2/50 hover:bg-s2",
  checking: "border-pri/70 bg-pri/10",
  verified: "border-ok/40 bg-ok/5",
  broken: "border-bad bg-bad/10",
  downstream: "border-bad/30 bg-bad/5 opacity-80"
};
const DOT_STYLE = { idle: "bg-line", checking: "bg-pri", verified: "bg-ok", broken: "bg-bad", downstream: "bg-bad/50" };
const LINE_STYLE = { idle: "bg-line", checking: "bg-pri/60", verified: "bg-ok/60", broken: "bg-bad/70", downstream: "bg-bad/30" };

export function Leaderboard() {
  const { houseXP, societyXP, events, ledger, user, tampered, handleTamper: onTamper, handleUndoTamper: onUndoTamper, goTab } = useApp();
  const [board, setBoard] = useState("houses");
  const [open, setOpen] = useState(null);
  const [audit, setAudit] = useState({ status: "idle", upTo: -1, brokenAt: null });
  const timer = useRef(null);
  const listRef = useRef(null);
  const mounted = useMounted();

  useEffect(() => () => clearTimeout(timer.current), []);
  // Any change to the ledger invalidates an earlier audit result.
  useEffect(() => {
    clearTimeout(timer.current);
    setAudit({ status: "idle", upTo: -1, brokenAt: null });
  }, [ledger]);
  // Keep the newest entry in view.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [ledger.length]);

  // Walk the chain from the first entry, one block at a time.
  const runAudit = () => {
    clearTimeout(timer.current);
    const list = ledger;
    if (list.length === 0) {
      setAudit({ status: "ok", upTo: -1, brokenAt: null });
      return;
    }
    let i = 0,
      prev = "GENESIS";
    setAudit({ status: "running", upTo: -1, brokenAt: null });
    const step = () => {
      if (i >= list.length) {
        setAudit({ status: "ok", upTo: list.length - 1, brokenAt: null });
        return;
      }
      if (!entryIsValid(prev, list[i])) {
        setAudit({ status: "broken", upTo: i - 1, brokenAt: i });
        return;
      }
      prev = list[i].hash;
      setAudit({ status: "running", upTo: i, brokenAt: null });
      i++;
      timer.current = setTimeout(step, 380);
    };
    timer.current = setTimeout(step, 250);
  };

  const stateOf = (i) => {
    if (audit.status === "broken" && i === audit.brokenAt) return "broken";
    if (audit.status === "broken" && i > audit.brokenAt) return "downstream";
    if (i <= audit.upTo) return "verified";
    if (audit.status === "running" && i === audit.upTo + 1) return "checking";
    return "idle";
  };

  const ranked = rankHouses(houseXP, events);
  const max = Math.max(1, ranked[0].xp);
  const societies = Object.entries(societyXP).sort((a, b) => b[1] - a[1]);
  const sMax = Math.max(1, societies.length ? societies[0][1] : 1);
  const lvl = levelFor(user.xp);
  const myRank = ranked.findIndex((r) => r.house === user.house) + 1;
  const myEntries = ledger
    .filter((e) => e.rollNo === user.rollNo)
    .slice(-3)
    .reverse();

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <Card
          title="Standings"
          right={
            <Segmented
              value={board}
              onChange={setBoard}
              options={[
                { value: "houses", label: "Houses" },
                { value: "societies", label: "Societies" }
              ]}
            />
          }
        >
          {board === "houses" ? (
            <>
              <Podium ranked={ranked} mounted={mounted} />
              <div className="mt-5 space-y-1.5">
                {ranked.map((r, i) => (
                  <div key={r.house} className={`rounded-xl px-3 py-2.5 ${r.house === user.house ? "bg-pri/10 border border-pri/30" : "border border-transparent"}`}>
                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-4 text-mu tabular-nums">{i + 1}</span>
                        <span className="font-semibold">
                          <HouseChip house={r.house} />
                        </span>
                        {r.house === user.house && <Badge tone="pri">Your house</Badge>}
                      </span>
                      <span className="text-mu shrink-0">
                        {r.joint} joint event{r.joint === 1 ? "" : "s"}
                        <span className="text-ok font-semibold ml-2">
                          <Counter value={r.xp} /> XP
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-line/60 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: mounted ? `${(r.xp / max) * 100}%` : "0%", background: houseColor(r.house) }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-mu mt-3">Starting totals are demo seed values. New XP comes only from verified check-ins, and each one credits every host house.</p>
            </>
          ) : (
            <>
              <div className="space-y-3">
                {societies.map(([name, xp]) => (
                  <div key={name} className="text-xs">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-semibold text-tx">{name}</span>
                      <span className="text-ok font-semibold">
                        <Counter value={xp} /> XP
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-line/60 overflow-hidden">
                      <div className="h-full rounded-full bg-pri transition-all duration-700 ease-out" style={{ width: mounted ? `${(xp / sMax) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-mu mt-3">Societies earn XP when an event they back has a verified check-in.</p>
            </>
          )}
        </Card>

        <Card
          title={`Verification ledger (${ledger.length})`}
          right={
            <div className="flex gap-2">
              <Btn size="sm" variant="primary" icon="shield" onClick={runAudit} disabled={audit.status === "running"}>
                {audit.status === "running" ? "Auditing" : "Audit chain"}
              </Btn>
              {tampered ? (
                <Btn size="sm" icon="refresh" onClick={onUndoTamper}>
                  Undo tamper
                </Btn>
              ) : (
                <Btn size="sm" variant="danger" icon="alert" onClick={onTamper} disabled={ledger.length === 0}>
                  Tamper test
                </Btn>
              )}
            </div>
          }
        >
          {audit.status === "running" && (
            <div role="status" className="mb-3 text-xs rounded-xl px-3 py-2 border border-pri/40 bg-pri/10 text-tx">
              Walking the chain from the first entry. Each block must match the hash its successor remembers.
            </div>
          )}
          {audit.status === "ok" && (
            <div role="status" className="mb-3 text-xs rounded-xl px-3 py-2 border border-ok/40 bg-ok/10 text-tx pop-in">
              {ledger.length === 0 ? "Nothing to audit yet. Complete a check-in first." : `Chain intact: all ${ledger.length} entries verify.`}
            </div>
          )}
          {audit.status === "broken" && (
            <div role="alert" className="mb-3 text-xs rounded-xl px-3 py-2 border border-bad/40 bg-bad/10 text-tx pop-in">
              Tampering detected at entry #{ledger[audit.brokenAt] ? ledger[audit.brokenAt].idx : audit.brokenAt + 1}. Its stored hash no longer matches its
              contents, so every entry after it is untrusted.
            </div>
          )}

          {ledger.length === 0 ? (
            <EmptyState icon="link" title="No check-ins recorded yet">
              Complete one and it is added here as a block linked to the one before it.{" "}
              <button type="button" onClick={() => goTab("checkin")} className="text-pritx underline">
                Go to check-in
              </button>
            </EmptyState>
          ) : (
            <div ref={listRef} className="max-h-[520px] overflow-y-auto scroll-thin pr-1">
              <ol>
                <li className="flex gap-3">
                  <div className="flex flex-col items-center w-3 shrink-0">
                    <span className="w-3 h-3 rounded-full bg-mu/50 mt-0.5" />
                    <span className="w-px flex-1 bg-line" />
                  </div>
                  <div className="pb-3 text-xs text-mu">
                    Start of chain <span className="font-mono">GENESIS</span>
                  </div>
                </li>
                {ledger.map((e, i) => {
                  const st = stateOf(i);
                  const last = i === ledger.length - 1;
                  return (
                    <li key={e.idx} className="flex gap-3">
                      <div className="flex flex-col items-center w-3 shrink-0">
                        <span className={`w-3 h-3 rounded-full mt-4 transition-colors ${DOT_STYLE[st]}`} />
                        <span className={`w-px flex-1 transition-colors ${last ? "bg-transparent" : LINE_STYLE[st]}`} />
                      </div>
                      <div className="flex-1 min-w-0 pb-3">
                        <button
                          type="button"
                          onClick={() => setOpen(open === e.idx ? null : e.idx)}
                          aria-expanded={open === e.idx}
                          className={`w-full text-left rounded-2xl border p-3 transition-colors ${BLOCK_STYLE[st]}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-display font-bold text-tx">#{e.idx}</span>
                            <span className="text-sm text-tx truncate">{e.name}</span>
                            <span className="ml-auto flex items-center gap-2 shrink-0">
                              <Badge tone="ok">+{e.xp} XP</Badge>
                              {st === "verified" && <Icon name="check" className="w-4 h-4 text-ok" />}
                              {st === "broken" && <Icon name="alert" className="w-4 h-4 text-bad" />}
                              {st === "downstream" && <Icon name="lock" className="w-4 h-4 text-bad/70" />}
                            </span>
                          </span>
                          <span className="block text-xs text-mu mt-0.5 truncate">
                            {e.eventTitle}, {e.houses.join(" and ")}
                          </span>
                          {st === "broken" && <span className="block text-xs text-bad font-medium mt-1.5">Hash mismatch: this entry was edited after it was written.</span>}
                          {st === "downstream" && <span className="block text-xs text-bad/80 mt-1.5">Not trusted: it builds on an entry that failed.</span>}
                          <span className="mt-2 grid gap-1 font-mono text-[10px] text-mu">
                            <span className="flex gap-2">
                              <span className="w-8 shrink-0 font-sans text-[11px]">prev</span>
                              <span className="truncate">{e.prevHash}</span>
                            </span>
                            <span className="flex gap-2">
                              <span className="w-8 shrink-0 font-sans text-[11px]">hash</span>
                              <span className="truncate">{e.hash}</span>
                            </span>
                          </span>
                          {open === e.idx && (
                            <span className="mt-3 pt-3 border-t border-line grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                              <span className="text-mu">Recorded</span>
                              <span className="text-tx">{new Date(e.ts).toLocaleString("en-GB")}</span>
                              <span className="text-mu">Student</span>
                              <span className="text-tx">
                                {e.name} ({e.rollNo})
                              </span>
                              <span className="text-mu">Event</span>
                              <span className="text-tx">{e.eventId}</span>
                              <span className="text-mu">Distance</span>
                              <span className="text-tx">{e.distanceM} m from the venue</span>
                              <span className="text-mu">Photo hash</span>
                              <span className="font-mono text-tx">{e.photoHash}</span>
                            </span>
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          <p className="text-[11px] text-mu mt-3">
            Each entry stores the hash of the one before it. Edit any past record and every later link breaks, which the audit catches.{" "}
            {apiEnabled()
              ? "The chain is appended by the server from verified check-ins; the tamper test edits only this browser's copy."
              : "In production this chain lives on a server you control."}
          </p>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="Your contribution">
          <div className="flex items-center gap-4">
            <Ring pct={lvl.pct} size={76} stroke={6}>
              <span className="font-display font-extrabold text-2xl text-tx">{lvl.level}</span>
            </Ring>
            <div className="min-w-0">
              <div className="font-display font-bold text-3xl text-ok leading-none">
                <Counter value={user.xp} />
                <span className="text-sm font-semibold text-mu ml-1">XP</span>
              </div>
              <div className="text-sm font-semibold text-tx mt-1.5">
                Level {lvl.level}, {lvl.name}
              </div>
              <div className="text-xs text-mu">{lvl.next ? `${lvl.toNext} XP to ${lvl.next.name}` : "Top level reached"}</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-mu">
            {user.name} ({user.rollNo}) in <span className="text-tx font-semibold">{user.house}</span>, ranked {myRank} of {HOUSES.length}.
          </div>
          {myEntries.length > 0 && (
            <div className="mt-3 pt-3 border-t border-line space-y-1.5">
              <div className="text-xs font-semibold text-tx">Your latest check-ins</div>
              {myEntries.map((e) => (
                <div key={e.idx} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-mu truncate">{e.eventTitle}</span>
                  <span className="text-ok font-semibold shrink-0">+{e.xp}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="See the tamper check work">
          <ol className="text-xs text-mu space-y-2 list-decimal pl-4">
            <li>Complete a check-in so the ledger has an entry.</li>
            <li>
              Press <span className="text-tx font-semibold">Audit chain</span> and watch each block turn green.
            </li>
            <li>
              Press <span className="text-tx font-semibold">Tamper test</span>, which quietly edits entry #1.
            </li>
            <li>
              Audit again. The edited block turns red and everything after it loses trust. <span className="text-tx font-semibold">Undo tamper</span> restores it.
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
