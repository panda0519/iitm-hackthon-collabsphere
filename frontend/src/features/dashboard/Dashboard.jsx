import { useMemo, useState } from "react";
import { Card } from "../../components/ui/Card.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { HouseChip } from "../../components/ui/HouseChip.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Icon, ACTIVITY_ICON } from "../../components/ui/Icon.jsx";
import { Counter } from "../../components/ui/Counter.jsx";
import { useMounted } from "../../hooks/useMounted.js";
import { downloadText } from "../../services/download.js";
import { toICS } from "../../services/calendar.js";
import {
  HOUSES,
  agoLabel,
  haversineDistance,
  houseColor,
  housesLabel,
  nextRsvpEvent,
  parseEventDate,
  prettyDate,
  radarDays,
  rankHouses,
  relLabel
} from "@collabsphere/shared";
import { useApp } from "../../state/AppContext.jsx";
import { Ticker } from "./Ticker.jsx";
import { Kpi } from "./Kpi.jsx";
import { MemberPass } from "./MemberPass.jsx";
import { Countdown } from "./Countdown.jsx";

export function Dashboard() {
  const {
    user,
    lvl,
    events,
    ledger,
    houseXP,
    announcements,
    activity,
    center,
    needsCount,
    goTab: go,
    openEvent: onOpenEvent,
    notify
  } = useApp();
  const mounted = useMounted();
  const [dayIdx, setDayIdx] = useState(null);

  const ranked = useMemo(() => rankHouses(houseXP, events), [houseXP, events]);
  const maxXp = Math.max(1, ranked[0].xp);
  const myIdx = ranked.findIndex((r) => r.house === user.house);
  const myRank = myIdx + 1;
  const myXp = houseXP[user.house] || 0;
  const above = myIdx > 0 ? ranked[myIdx - 1] : null;
  const below = myIdx < ranked.length - 1 ? ranked[myIdx + 1] : null;
  const raceNote = above ? `${above.xp - myXp} XP behind ${above.house}` : `Leading by ${below ? myXp - below.xp : 0} XP`;

  const liveEvents = events.filter((e) => e.status === "APPROVED_LIVE");
  const nearby = liveEvents.filter((e) => haversineDistance(center.lat, center.lng, e.lat, e.lng) <= 25).length;
  const jointLive = liveEvents.filter((e) => e.coHostHouse).length;
  const myCheckIns = ledger.filter((l) => l.rollNo === user.rollNo).length;

  const days = useMemo(() => radarDays(events, 14), [events]);
  const firstWith = days.findIndex((d) => d.events.length > 0);
  const activeDay = dayIdx !== null ? dayIdx : firstWith >= 0 ? firstWith : 0;
  const dayEvents = days[activeDay].events;

  const next = nextRsvpEvent(events, user.rollNo);
  const myAnnouncements = announcements
    .filter((a) => a.audience === "All" || a.audience === user.house)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.ts) - new Date(a.ts))
    .slice(0, 3);

  const tickerItems = useMemo(() => {
    const items = [{ icon: "trophy", text: `${ranked[0].house} leads the race with ${ranked[0].xp} XP` }];
    liveEvents
      .map((e) => ({ e, t: (parseEventDate(e.date) || new Date(8.64e15)).getTime() }))
      .filter((x) => x.t > Date.now())
      .sort((a, b) => a.t - b.t)
      .slice(0, 3)
      .forEach(({ e }) => items.push({ icon: "bolt", text: `${relLabel(e.date)}: ${e.title} (${housesLabel(e)})` }));
    activity.slice(0, 3).forEach((a) => items.push({ icon: ACTIVITY_ICON[a.kind] || "info", text: `${a.text}, ${agoLabel(a.ts)}` }));
    if (needsCount > 0) items.push({ icon: "bell", text: `${needsCount} proposal${needsCount === 1 ? "" : "s"} waiting for ${user.house} to approve` });
    return items;
  }, [ranked, events, activity, needsCount, user.house]);

  const addToCalendar = (ev) => {
    downloadText(`${ev.id}.ics`, toICS(ev));
    notify("Calendar file downloaded.");
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 lg:py-7 space-y-5">
      <Ticker items={tickerItems} />

      {needsCount > 0 && (
        <div className="neon rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3" role="status">
          <span className="w-2.5 h-2.5 rounded-full bg-pri live-dot" />
          <span className="text-sm text-tx flex-1 min-w-[200px]">
            <span className="font-semibold">
              {needsCount} proposal{needsCount === 1 ? "" : "s"}
            </span>{" "}
            from other houses {needsCount === 1 ? "is" : "are"} waiting for {user.house} to approve.
          </span>
          <Btn size="sm" variant="primary" icon="sliders" onClick={() => go("admin")}>
            Review in Admin
          </Btn>
        </div>
      )}

      {/* HERO + MEMBER PASS */}
      <div className="grid lg:grid-cols-12 gap-5">
        <section className="neon-anim lg:col-span-8 rounded-3xl p-5 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold text-ok">
            <span className="w-2 h-2 rounded-full bg-ok live-dot" />
            Live dashboard, Build-a-Thon 1.0
          </div>
          <p className="text-mu text-sm mt-3">Welcome back,</p>
          <h2 className="text-grad font-display font-extrabold text-4xl sm:text-6xl leading-tight break-words pb-1">{user.name}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-priink"
              style={{ background: houseColor(user.house), boxShadow: `0 0 22px ${houseColor(user.house)}99` }}
            >
              <Icon name="flame" className="w-3.5 h-3.5" />
              {user.house}
            </span>
            <Badge tone="pri">
              Level {lvl.level}, {lvl.name}
            </Badge>
            <Badge tone="ok" icon="trophy">
              Rank {myRank} of {HOUSES.length}
            </Badge>
            <span className="text-xs text-mu">{raceNote}</span>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-tx">
                <Counter value={user.xp} /> XP
              </span>
              <span className="text-mu">{lvl.next ? `${lvl.toNext} XP to ${lvl.next.name}` : "Top level reached"}</span>
            </div>
            <div
              className="h-3 rounded-full bg-line/60 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(lvl.pct)}
              aria-label="Progress to next level"
            >
              <div className="xp-bar h-full rounded-full transition-all duration-1000 ease-out" style={{ width: mounted ? `${Math.max(4, lvl.pct)}%` : "0%" }} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Btn variant="primary" icon="map" onClick={() => go("map")}>
              Find a meetup
            </Btn>
            <Btn icon="shield" onClick={() => go("checkin")}>
              Check in
            </Btn>
            <Btn icon="users" onClick={() => go("host")}>
              Host with another house
            </Btn>
          </div>
        </section>

        <div className="lg:col-span-4">
          <MemberPass user={user} lvl={lvl} checkIns={myCheckIns} rank={myRank} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <Kpi icon="bolt" label={`${user.house} house XP`} value={myXp} sub={raceNote} />
        <Kpi icon="flame" label="Your level" value={lvl.level} sub={`${lvl.name}, ${user.xp} XP`} />
        <Kpi icon="pin" label={`Live near ${center.label}`} value={nearby} suffix="events" sub="Within 25 km" />
        <Kpi icon="users" label="Joint events live" value={jointLive} sub="Two or more houses hosting" />
      </div>

      {/* RACE + RADAR */}
      <div className="grid lg:grid-cols-12 gap-5">
        <Card
          glow
          className="lg:col-span-7"
          title="House race"
          right={
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ok">
              <span className="w-2 h-2 rounded-full bg-ok live-dot" />
              Live
            </span>
          }
        >
          <div className="space-y-2">
            {ranked.map((r, i) => {
              const mine = r.house === user.house;
              const c = houseColor(r.house);
              return (
                <div key={r.house} className={`rounded-xl px-3 py-2 ${mine ? "bg-pri/10 border border-pri/40" : "border border-transparent"}`}>
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-4 text-mu tabular-nums">{i + 1}</span>
                      <HouseChip house={r.house} className="font-semibold" />
                      {mine && <Badge tone="pri">You</Badge>}
                    </span>
                    <span className="text-ok font-semibold tabular-nums">
                      <Counter value={r.xp} /> XP
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-line/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: mounted ? `${(r.xp / maxXp) * 100}%` : "0%",
                        background: `linear-gradient(90deg, ${c}, ${c}cc)`,
                        boxShadow: `0 0 14px ${c}99`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-mu">
            <span>XP comes only from verified check-ins.</span>
            <button type="button" onClick={() => go("leaderboard")} className="text-pritx underline">
              Open the ledger
            </button>
          </div>
        </Card>

        <Card glow className="lg:col-span-5" title="Event radar" right={<Badge>Next 14 days</Badge>}>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d, i) => {
              const n = d.events.length;
              const active = i === activeDay;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDayIdx(i)}
                  aria-pressed={active}
                  aria-label={`${d.date.toDateString()}, ${n} event${n === 1 ? "" : "s"}`}
                  className={`rounded-xl py-1.5 flex flex-col items-center gap-0.5 border transition ${
                    active ? "border-pri bg-pri/15" : "border-line bg-s2/60 hover:bg-s2"
                  }`}
                >
                  <span className="text-[10px] text-mu">{d.date.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                  <span className={`font-display font-bold text-sm ${i === 0 ? "text-pritx" : "text-tx"}`}>{d.date.getDate()}</span>
                  <span className="flex gap-0.5 h-1.5">
                    {d.events.slice(0, 3).map((e) => (
                      <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ background: houseColor(e.primaryHouse), boxShadow: `0 0 6px ${houseColor(e.primaryHouse)}` }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-2 min-h-[96px]">
            {dayEvents.length === 0 ? (
              <p className="text-xs text-mu py-4 text-center">
                Nothing scheduled that day.{" "}
                <button type="button" onClick={() => go("host")} className="text-pritx underline">
                  Propose a joint event
                </button>
              </p>
            ) : (
              dayEvents.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpenEvent(e)}
                  className="w-full text-left rounded-xl border border-line bg-s2/60 hover:bg-s2 px-3 py-2 transition"
                >
                  <span className="block text-sm font-semibold text-tx truncate">{e.title}</span>
                  <span className="block text-[11px] text-mu truncate">
                    {prettyDate(e.date)}, {housesLabel(e)}
                  </span>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* UP NEXT + ANNOUNCEMENTS + ACTIVITY */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card glow title="Up next for you">
          {next ? (
            <div>
              <div className="font-display font-bold text-base text-tx leading-snug">{next.ev.title}</div>
              <div className="text-xs text-mu mt-0.5">
                {housesLabel(next.ev)}, {prettyDate(next.ev.date)}
              </div>
              <div className="mt-3">
                <Countdown target={next.t} />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Btn size="sm" variant="primary" icon="shield" onClick={() => go("checkin")}>
                  Open check-in
                </Btn>
                <Btn size="sm" icon="calendar" onClick={() => addToCalendar(next.ev)}>
                  Add to calendar
                </Btn>
              </div>
            </div>
          ) : (
            <EmptyState icon="calendar" title="No RSVPs yet">
              Pick a meetup on the map and RSVP to see its countdown here.{" "}
              <button type="button" onClick={() => go("map")} className="text-pritx underline">
                Open the map
              </button>
            </EmptyState>
          )}
        </Card>

        <Card
          glow
          title="Announcements"
          right={
            <button type="button" onClick={() => go("admin")} className="text-[11px] text-pritx underline">
              Manage
            </button>
          }
        >
          {myAnnouncements.length === 0 ? (
            <EmptyState icon="megaphone" title="No announcements">
              House secretaries post updates from the Admin console.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {myAnnouncements.map((a) => (
                <li key={a.id}>
                  <div className="flex items-center gap-2">
                    {a.pinned && <Icon name="pin" className="w-3.5 h-3.5 text-pritx shrink-0" />}
                    <span className="text-sm font-semibold text-tx truncate">{a.title}</span>
                  </div>
                  <p className="text-xs text-mu mt-0.5 leading-relaxed">{a.body}</p>
                  <div className="text-[11px] text-mu mt-1">
                    {a.author}, {agoLabel(a.ts)}
                    {a.audience !== "All" ? `, ${a.audience} only` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card glow title="Recent activity">
          {activity.length === 0 ? (
            <EmptyState icon="activity" title="Nothing yet">
              Proposals, approvals and check-ins show up here.
            </EmptyState>
          ) : (
            <ul className="space-y-2.5">
              {activity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-s2 border border-line flex items-center justify-center shrink-0 text-pritx">
                    <Icon name={ACTIVITY_ICON[a.kind] || "info"} className="w-3 h-3" />
                  </span>
                  <span className="min-w-0 text-xs text-tx leading-snug">
                    {a.text}
                    <span className="block text-[11px] text-mu">{agoLabel(a.ts)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
