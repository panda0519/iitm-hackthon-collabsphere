import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card.jsx";
import { Field, FIELD } from "../../components/ui/Field.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { EventCard } from "../../components/cards/EventCard.jsx";
import { Segmented } from "../../components/ui/Segmented.jsx";
import { houseColor, CATEGORIES, CITIES, HOUSES, SOCIETIES, fmtDateTime, inDaysLocal, prettyDate } from "@collabsphere/shared";
import { useApp } from "../../state/AppContext.jsx";
import { ApprovalRow } from "./ApprovalRow.jsx";
import { FlowSteps } from "./FlowSteps.jsx";

export function HostManager() {
  const { user, events, handleProposeEvent: onPropose } = useApp();
  const otherHouses = HOUSES.filter((h) => h !== user.house);
  const [form, setForm] = useState({
    title: "",
    category: "Co-Working",
    city: "Kanpur",
    venue: "",
    dateLocal: inDaysLocal(14, 16, 0),
    coHostHouse: "Saranda",
    society: "Code Crafters",
    xpReward: 50,
    coords: null
  });
  const [formError, setFormError] = useState("");
  const [view, setView] = useState(null);

  // The co-host can never be the proposing house.
  useEffect(() => {
    if (form.coHostHouse === user.house) setForm((f) => ({ ...f, coHostHouse: otherHouses[0] }));
  }, [user.house]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const useGpsVenue = () => {
    if (!navigator.geolocation) return setFormError("This browser has no GPS access.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("coords", { lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFormError("");
      },
      () => setFormError("Location permission denied or unavailable."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = await onPropose({ ...form, date: fmtDateTime(form.dateLocal) });
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setView(form.coHostHouse ? "waiting" : "live");
    setForm((f) => ({ ...f, title: "", venue: "", coords: null }));
  };

  // Hosts only propose and watch the outcome. Approving or rejecting lives in the Admin console.
  const waiting = events.filter((e) => e.status === "PENDING_COHOST");
  const live = events.filter((e) => e.status === "APPROVED_LIVE");
  const closed = events.filter((e) => e.status === "REJECTED" || e.status === "CANCELLED");
  const active = view || (waiting.length ? "waiting" : "live");
  const mine = events.filter((e) => e.primaryHouse === user.house);
  const outcome = (ev) => {
    const pendingHouses = Object.entries(ev.approvals)
      .filter(([, ok]) => !ok)
      .map(([h]) => h);
    if (ev.status === "APPROVED_LIVE") return { tone: "ok", label: "Approved", note: "Live on the map" };
    if (ev.status === "REJECTED")
      return {
        tone: "bad",
        label: "Rejected",
        note: `${pendingHouses.join(", ") || "Co-host"} rejected this${ev.rejectReason ? `: ${ev.rejectReason}` : ""}`
      };
    if (ev.status === "CANCELLED") return { tone: "neutral", label: "Cancelled", note: ev.cancelReason || "Cancelled by a house secretary" };
    return { tone: "pri", label: "Waiting", note: `Waiting for ${pendingHouses.join(", ")} to approve in Admin` };
  };

  const xp = Math.min(100, Math.max(10, Number(form.xpReward) || 50));
  const preview = {
    id: "PREVIEW",
    title: form.title.trim() || "Your event title",
    category: form.category,
    city: form.city,
    venue: form.venue.trim() || "Venue name",
    date: fmtDateTime(form.dateLocal),
    primaryHouse: user.house,
    coHostHouse: form.coHostHouse,
    society: form.society,
    xpReward: xp,
    rsvps: [user.rollNo],
    checkedIn: []
  };
  const steps = form.coHostHouse
    ? [`${user.house} proposes`, `${form.coHostHouse} approves`, "Live on the map"]
    : [`${user.house} proposes`, "Live on the map straight away"];

  const choiceBtn = (selected) =>
    `h-9 px-3 rounded-xl text-xs font-semibold border transition inline-flex items-center gap-1.5 ${
      selected ? "border-pri/60 bg-pri/15 text-pritx" : "border-line bg-s2 text-mu hover:text-tx"
    }`;

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      {/* LEFT: proposal form + live preview */}
      <div className="lg:col-span-2 space-y-4">
        <form onSubmit={submit} className="rounded-2xl border border-line bg-s1/85 p-4 space-y-4">
          <div>
            <h2 className="font-display font-semibold text-[17px] text-tx">Propose a joint event</h2>
            <p className="text-xs text-mu mt-1">
              You are proposing as <span className="text-tx font-semibold">{user.house}</span>. The event reaches the map
              once the co-host house secretary approves it in Admin.
            </p>
          </div>

          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={80}
              className={FIELD}
              placeholder="e.g. Cross-House SQL Study Circle"
            />
          </Field>

          <div>
            <span className="text-xs font-medium text-mu">Event type</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => set("category", c)} className={choiceBtn(form.category === c)} aria-pressed={form.category === c}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-mu">City</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.keys(CITIES).map((c) => (
                <button key={c} type="button" onClick={() => set("city", c)} className={choiceBtn(form.city === c)} aria-pressed={form.city === c}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Field label="Venue">
            <input
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              maxLength={80}
              className={FIELD}
              placeholder="Cafe, library or co-work space"
            />
          </Field>
          <div className="flex items-center gap-2 -mt-1">
            <Btn size="sm" icon="crosshair" onClick={useGpsVenue}>
              Pin venue at my GPS
            </Btn>
            <span className="text-[11px] text-mu">
              {form.coords ? `Pinned at ${form.coords.lat.toFixed(4)}, ${form.coords.lng.toFixed(4)}` : "Otherwise placed near the city centre"}
            </span>
          </div>

          <Field label="Date and time">
            <input type="datetime-local" value={form.dateLocal} onChange={(e) => set("dateLocal", e.target.value)} className={FIELD} />
          </Field>

          <div>
            <span className="text-xs font-medium text-mu">Co-host house</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {otherHouses.map((h) => (
                <button key={h} type="button" onClick={() => set("coHostHouse", h)} className={choiceBtn(form.coHostHouse === h)} aria-pressed={form.coHostHouse === h}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: houseColor(h) }} />
                  {h}
                </button>
              ))}
              <button type="button" onClick={() => set("coHostHouse", "")} className={choiceBtn(form.coHostHouse === "")} aria-pressed={form.coHostHouse === ""}>
                No co-host
              </button>
            </div>
          </div>

          <Field label="Society">
            <select value={form.society} onChange={(e) => set("society", e.target.value)} className={FIELD}>
              {SOCIETIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-mu">XP reward per host house</span>
              <span className="font-display font-bold text-ok text-sm">+{xp}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={xp}
              onChange={(e) => set("xpReward", Number(e.target.value))}
              className="w-full mt-1"
              aria-label="XP reward per host house"
            />
          </div>

          {formError && (
            <div role="alert" className="shake text-xs text-bad bg-bad/10 border border-bad/30 rounded-xl px-3 py-2">
              {formError}
            </div>
          )}
          <Btn type="submit" variant="primary" size="lg" className="w-full" icon="users">
            {form.coHostHouse ? `Send to ${form.coHostHouse} for approval` : "Publish to the map"}
          </Btn>
        </form>

        <Card title={`${user.house} proposals`}>
          {mine.length === 0 ? (
            <EmptyState icon="clock" title="No proposals yet">
              Send one from the form above. Its approval status shows up here.
            </EmptyState>
          ) : (
            <ul className="space-y-2 max-h-[320px] overflow-y-auto scroll-thin pr-1" aria-label="Status of your house's proposals">
              {mine.map((ev) => {
                const o = outcome(ev);
                return (
                  <li
                    key={ev.id}
                    className={`rounded-xl border px-3 py-2.5 ${
                      o.tone === "ok" ? "border-ok/40 bg-ok/10" : o.tone === "bad" ? "border-bad/40 bg-bad/10" : "border-line bg-s1"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-tx leading-snug">{ev.title}</div>
                        <div className="text-[11px] text-mu mt-0.5">
                          {ev.city}, {prettyDate(ev.date)}
                        </div>
                      </div>
                      <Badge tone={o.tone}>{o.label}</Badge>
                    </div>
                    <div className="text-[11px] text-mu mt-1.5">{o.note}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Preview">
          <EventCard ev={preview} />
          <div className="mt-4">
            <FlowSteps steps={steps} />
          </div>
        </Card>
      </div>

      {/* RIGHT: approval board */}
      <div className="lg:col-span-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-semibold text-[17px] text-tx">Approval board</h2>
          <Segmented
            value={active}
            onChange={setView}
            options={[
              { value: "waiting", label: "Waiting", count: waiting.length },
              { value: "live", label: "Live", count: live.length },
              ...(closed.length ? [{ value: "closed", label: "Closed", count: closed.length }] : [])
            ]}
          />
        </div>

        <div className="space-y-2.5">
          {active === "waiting" &&
            (waiting.length === 0 ? (
              <Card>
                <EmptyState icon="clock" title="No proposals are waiting">
                  Send one from the form and track each house's answer here.
                </EmptyState>
              </Card>
            ) : (
              waiting.map((ev) => <ApprovalRow key={ev.id} ev={ev} />)
            ))}

          {active === "live" &&
            (live.length === 0 ? (
              <Card>
                <EmptyState icon="map" title="No live events yet">
                  Approved events appear here and on the map.
                </EmptyState>
              </Card>
            ) : (
              <div className="space-y-2.5 lg:max-h-[640px] lg:overflow-y-auto scroll-thin lg:pr-1">
                {live.map((ev) => (
                  <ApprovalRow key={ev.id} ev={ev} />
                ))}
              </div>
            ))}

          {active === "closed" && closed.map((ev) => <ApprovalRow key={ev.id} ev={ev} />)}
        </div>
      </div>
    </div>
  );
}
