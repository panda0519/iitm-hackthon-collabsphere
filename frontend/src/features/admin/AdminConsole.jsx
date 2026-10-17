import { useState } from "react";
import { Card } from "../../components/ui/Card.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Segmented } from "../../components/ui/Segmented.jsx";
import { HouseChip } from "../../components/ui/HouseChip.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Icon, ACTIVITY_ICON } from "../../components/ui/Icon.jsx";
import { StatusBadge } from "../../components/ui/Badge.jsx";
import { FIELD } from "../../components/ui/Field.jsx";
import { hostHouses, agoLabel, prettyDate } from "@collabsphere/shared";
import { useApp } from "../../state/AppContext.jsx";
import { Kpi } from "../dashboard/Kpi.jsx";
import { ApprovalRow } from "../host/ApprovalRow.jsx";
import { IconBtn } from "./IconBtn.jsx";
import { ReasonModal } from "./ReasonModal.jsx";
import { EditEventModal } from "./EditEventModal.jsx";
import { AnnouncementModal } from "./AnnouncementModal.jsx";
import { AwardModal } from "./AwardModal.jsx";

// How the running app maps onto a deployed system. Shown in the right-hand column.
const BLUEPRINT = [
  [
    "Approvals",
    "A house secretary approves in this tab. The applyDecision state machine is the same on both sides: it runs in the browser in offline mode and in an API route (backend/src/services/events.js) in server mode, and every decision is appended to the audit trail."
  ],
  [
    "Check-in codes",
    "The 15-second code is derived from the event id and the current time window with TOTP. The same totpFor and verifyTotp functions run on the server, so a replayed screenshot fails. The host screen reads the current code from the API instead of deriving it, so the secret stays server-side."
  ],
  [
    "Geofence and photos",
    "Distance and photo hashes are checked in the browser for instant feedback and re-checked by the server. A production deployment reads GPS from the device, verifies it server-side, and stores the photo in object storage keyed by its hash."
  ],
  [
    "Ledger",
    "Each check-in is a block that stores the SHA-256 hash of the one before it. In server mode the server appends the chain from verified check-ins; the tamper test edits only this browser's copy, and Audit chain re-syncs it."
  ],
  [
    "Data and exports",
    "In server mode every read and write goes through the REST client in services/client.js; without VITE_USE_API the app falls back to the localStorage prototype in services/storage.js. Either way the rule engine in @collabsphere/shared runs unchanged."
  ]
];

const ACT_FILTERS = [
  ["all", "All"],
  ["event", "Events"],
  ["approval", "Approvals"],
  ["checkin", "Check-ins"],
  ["admin", "Admin"]
];

export function AdminConsole() {
  const { user, events, ledger, announcements, activity, adminActions: a } = useApp();
  const [view, setView] = useState("approvals");
  const [modal, setModal] = useState(null);
  const [sel, setSel] = useState(() => new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [actFilter, setActFilter] = useState("all");

  const needsMe = events.filter((e) => e.status === "PENDING_COHOST" && e.approvals[user.house] === false);
  const waitingOnOthers = events.filter((e) => e.status === "PENDING_COHOST" && e.primaryHouse === user.house && e.approvals[user.house] === true);
  const hosted = events.filter((e) => e.status === "APPROVED_LIVE" && hostHouses(e).includes(user.house));
  const rsvpTotal = hosted.reduce((n, e) => n + e.rsvps.length, 0);
  const checkedTotal = hosted.reduce((n, e) => n + e.checkedIn.length, 0);
  const rate = rsvpTotal ? Math.round((checkedTotal / rsvpTotal) * 100) : 0;
  const xpAwarded = ledger.filter((l) => l.houses.includes(user.house)).reduce((n, l) => n + l.xp, 0);

  const selectedIds = needsMe.filter((e) => sel.has(e.id)).map((e) => e.id);
  const allSelected = needsMe.length > 0 && selectedIds.length === needsMe.length;
  const toggleSel = (id) =>
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const statusGroup = (e) => (e.status === "APPROVED_LIVE" ? "live" : e.status === "PENDING_COHOST" ? "pending" : "closed");
  const tableRows = events
    .filter((e) => statusFilter === "all" || statusGroup(e) === statusFilter)
    .filter((e) => !q.trim() || `${e.id} ${e.title} ${e.venue} ${e.city} ${hostHouses(e).join(" ")}`.toLowerCase().includes(q.trim().toLowerCase()));
  const logRows = activity.filter((x) => actFilter === "all" || x.kind === actFilter);

  const filterBtn = (active) =>
    `h-8 px-3 rounded-full text-xs font-semibold border transition ${active ? "bg-pri/15 border-pri/50 text-pritx" : "bg-s2 border-line text-mu hover:text-tx"}`;

  return (
    <div className="space-y-5">
      <div className="neon rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="w-9 h-9 rounded-xl btn-flame flex items-center justify-center">
          <Icon name="sliders" />
        </span>
        <div className="flex-1 min-w-[220px]">
          <div className="font-display font-bold text-tx">Admin console, {user.house} Secretary</div>
          <p className="text-xs text-mu">
            You can approve proposals that name {user.house}, edit events {user.house} hosts, post announcements and award bonus XP.
          </p>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" icon="megaphone" onClick={() => setModal({ type: "announce" })}>
            Announce
          </Btn>
          <Btn size="sm" variant="primary" icon="gift" onClick={() => setModal({ type: "award" })}>
            Award XP
          </Btn>
          <Btn size="sm" icon="lock" onClick={a.lock} title="Lock the Admin console again">
            Lock
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <Kpi icon="bell" label="Needs your approval" value={needsMe.length} sub={needsMe.length ? "Review in the queue below" : "All clear"} />
        <Kpi icon="bolt" label="Live events you host" value={hosted.length} sub={`${events.length} events in total`} />
        <Kpi icon="shield" label="Check-in rate" value={rate} suffix="%" sub={`${checkedTotal} of ${rsvpTotal} RSVPs checked in`} />
        <Kpi icon="trophy" label="XP from check-ins" value={xpAwarded} sub={`Credited to ${user.house}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <Segmented
            value={view}
            onChange={setView}
            className="max-w-full overflow-x-auto no-scrollbar"
            options={[
              { value: "approvals", label: "Approvals", count: needsMe.length },
              { value: "events", label: "Events", count: events.length },
              { value: "announcements", label: "Announcements", count: announcements.length },
              { value: "activity", label: "Activity log", count: activity.length }
            ]}
          />

          {view === "approvals" && (
            <div className="space-y-3">
              {needsMe.length === 0 ? (
                <Card>
                  <EmptyState icon="check" title="Nothing waiting for your approval">
                    When another house proposes a joint event with {user.house}, it lands here.
                  </EmptyState>
                </Card>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-tx">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => setSel(allSelected ? new Set() : new Set(needsMe.map((e) => e.id)))}
                        className="accent-[rgb(var(--pri))]"
                      />
                      Select all
                    </label>
                    <Btn
                      size="sm"
                      variant="ok"
                      icon="check"
                      disabled={selectedIds.length === 0}
                      onClick={() => {
                        a.bulkApprove(selectedIds);
                        setSel(new Set());
                      }}
                    >
                      Approve selected ({selectedIds.length})
                    </Btn>
                  </div>
                  {needsMe.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={sel.has(ev.id)}
                        onChange={() => toggleSel(ev.id)}
                        aria-label={`Select ${ev.title}`}
                        className="mt-4 accent-[rgb(var(--pri))]"
                      />
                      <div className="flex-1 min-w-0">
                        <ApprovalRow
                          ev={ev}
                          actions={
                            <div className="flex gap-2 mt-3">
                              <Btn variant="ok" size="sm" icon="check" onClick={() => a.decide(ev.id, user.house, true)}>
                                Approve as {user.house}
                              </Btn>
                              <Btn variant="danger" size="sm" icon="x" onClick={() => setModal({ type: "reject", ev })}>
                                Reject with reason
                              </Btn>
                            </div>
                          }
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}
              {waitingOnOthers.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-semibold text-tx">Your proposals waiting on other houses</div>
                  {waitingOnOthers.map((ev) => (
                    <ApprovalRow key={ev.id} ev={ev} />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "events" && (
            <Card pad="p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Icon name="search" className="w-4 h-4 text-mu absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className={`${FIELD} pl-9`}
                    placeholder="Search by title, venue, house or ID"
                    aria-label="Search events"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    ["all", "All"],
                    ["live", "Live"],
                    ["pending", "Pending"],
                    ["closed", "Closed"]
                  ].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setStatusFilter(v)} className={filterBtn(statusFilter === v)} aria-pressed={statusFilter === v}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto scroll-thin rounded-xl border border-line">
                <table className="w-full min-w-[820px] text-left text-xs">
                  <thead className="bg-s2/70 text-mu">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Event</th>
                      <th className="px-3 py-2.5 font-semibold">Hosts</th>
                      <th className="px-3 py-2.5 font-semibold">When</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="px-3 py-2.5 font-semibold">Check-ins</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tableRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-mu">
                          No events match.
                        </td>
                      </tr>
                    )}
                    {tableRows.map((ev) => {
                      const mine = hostHouses(ev).includes(user.house);
                      const pct = ev.rsvps.length ? (ev.checkedIn.length / ev.rsvps.length) * 100 : 0;
                      return (
                        <tr key={ev.id} className="hover:bg-s2/40">
                          <td className="px-3 py-2.5 max-w-[240px]">
                            <div className="font-semibold text-tx truncate">{ev.title}</div>
                            <div className="text-[11px] text-mu font-mono">
                              {ev.id}, {ev.city}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-0.5">
                              {hostHouses(ev).map((h) => (
                                <HouseChip key={h} house={h} />
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-mu">{prettyDate(ev.date)}</td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={ev.status} />
                            {(ev.rejectReason || ev.cancelReason) && (
                              <div className="text-[11px] text-mu mt-1 max-w-[160px] truncate" title={ev.rejectReason || ev.cancelReason}>
                                {ev.rejectReason || ev.cancelReason}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 min-w-[110px]">
                            <div className="text-tx tabular-nums">
                              {ev.checkedIn.length} of {ev.rsvps.length}
                            </div>
                            <div className="h-1 rounded-full bg-line/60 mt-1 overflow-hidden">
                              <div className="h-full rounded-full bg-ok" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex justify-end gap-0.5">
                              {ev.status === "APPROVED_LIVE" && <IconBtn icon="map" label="View on map" onClick={() => a.openEvent(ev)} />}
                              <IconBtn icon="edit" label="Edit event" disabled={!mine || ev.status === "CANCELLED"} onClick={() => setModal({ type: "edit", ev })} />
                              <IconBtn icon="download" label="Export attendance CSV" disabled={!mine} onClick={() => a.exportAttendance(ev)} />
                              {ev.status === "CANCELLED" ? (
                                <IconBtn icon="refresh" label="Reopen event" disabled={!mine} onClick={() => a.reopenEvent(ev.id)} />
                              ) : (
                                <IconBtn icon="x" tone="bad" label="Cancel event" disabled={!mine || ev.status === "REJECTED"} onClick={() => setModal({ type: "cancel", ev })} />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {view === "announcements" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Btn size="sm" variant="primary" icon="megaphone" onClick={() => setModal({ type: "announce" })}>
                  New announcement
                </Btn>
              </div>
              {announcements.length === 0 ? (
                <Card>
                  <EmptyState icon="megaphone" title="No announcements yet">
                    Post one and it shows on every targeted member's dashboard.
                  </EmptyState>
                </Card>
              ) : (
                [...announcements]
                  .sort((x, y) => Number(y.pinned) - Number(x.pinned) || new Date(y.ts) - new Date(x.ts))
                  .map((an) => {
                    const own = an.authorHouse === user.house;
                    return (
                      <Card key={an.id} pad="p-3.5">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {an.pinned && (
                                <Badge tone="pri" icon="pin">
                                  Pinned
                                </Badge>
                              )}
                              <Badge>{an.audience === "All" ? "All houses" : `${an.audience} only`}</Badge>
                              <span className="text-[11px] text-mu">
                                {an.author}, {agoLabel(an.ts)}
                              </span>
                            </div>
                            <div className="font-display font-semibold text-tx mt-1.5">{an.title}</div>
                            <p className="text-xs text-mu mt-0.5 leading-relaxed">{an.body}</p>
                          </div>
                          <div className="flex shrink-0">
                            <IconBtn icon="pin" label={an.pinned ? "Unpin" : "Pin"} disabled={!own} onClick={() => a.togglePin(an.id)} />
                            <IconBtn icon="trash" tone="bad" label="Delete announcement" disabled={!own} onClick={() => a.deleteAnnouncement(an.id)} />
                          </div>
                        </div>
                      </Card>
                    );
                  })
              )}
            </div>
          )}

          {view === "activity" && (
            <Card
              title="Audit trail"
              right={
                <Btn size="sm" icon="download" onClick={a.exportActivity}>
                  Export CSV
                </Btn>
              }
            >
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3">
                {ACT_FILTERS.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setActFilter(v)} className={filterBtn(actFilter === v)} aria-pressed={actFilter === v}>
                    {l}
                  </button>
                ))}
              </div>
              {logRows.length === 0 ? (
                <EmptyState icon="activity" title="No entries">
                  Actions taken in the app are recorded here.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-line max-h-[520px] overflow-y-auto scroll-thin">
                  {logRows.map((x) => (
                    <li key={x.id} className="py-2.5 flex items-start gap-3">
                      <span className="mt-0.5 w-7 h-7 rounded-full bg-s2 border border-line flex items-center justify-center shrink-0 text-pritx">
                        <Icon name={ACTIVITY_ICON[x.kind] || "info"} className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-tx leading-snug">{x.text}</div>
                        <div className="text-[11px] text-mu mt-0.5">
                          {x.by}
                          {x.house ? `, ${x.house}` : ""}, {agoLabel(x.ts)}
                        </div>
                      </div>
                      <Badge>{x.kind}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-5 min-w-0">
          <Card glow title="Quick actions">
            <div className="grid gap-2">
              <Btn icon="gift" className="justify-start" onClick={() => setModal({ type: "award" })}>
                Award bonus XP
              </Btn>
              <Btn icon="megaphone" className="justify-start" onClick={() => setModal({ type: "announce" })}>
                Post an announcement
              </Btn>
              <Btn icon="download" className="justify-start" onClick={a.exportLedger}>
                Export ledger (CSV)
              </Btn>
              <Btn icon="download" className="justify-start" onClick={a.exportAll}>
                Export everything (JSON)
              </Btn>
              <Btn variant="danger" icon="refresh" className="justify-start" onClick={a.reset}>
                Reset demo data
              </Btn>
            </div>
          </Card>
          <Card title="Production blueprint">
            <p className="text-xs text-mu mb-3">How each part of this prototype maps to a deployed system.</p>
            <dl className="space-y-2.5">
              {BLUEPRINT.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold text-tx">{k}</dt>
                  <dd className="text-xs text-mu leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>

      {modal && modal.type === "reject" && (
        <ReasonModal
          title={`Reject “${modal.ev.title}”`}
          intro="The proposing house sees this reason, and it is saved in the audit log."
          confirmLabel="Reject event"
          onConfirm={(reason) => a.decide(modal.ev.id, user.house, false, reason)}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal.type === "cancel" && (
        <ReasonModal
          title={`Cancel “${modal.ev.title}”`}
          intro="The event leaves the map and RSVPs are kept. You can reopen it later."
          confirmLabel="Cancel event"
          onConfirm={(reason) => a.cancelEvent(modal.ev.id, reason)}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal.type === "edit" && <EditEventModal ev={modal.ev} onSave={a.editEvent} onClose={() => setModal(null)} />}
      {modal && modal.type === "announce" && <AnnouncementModal onSave={a.postAnnouncement} onClose={() => setModal(null)} />}
      {modal && modal.type === "award" && <AwardModal defaultHouse={user.house} onSave={a.award} onClose={() => setModal(null)} />}
    </div>
  );
}
