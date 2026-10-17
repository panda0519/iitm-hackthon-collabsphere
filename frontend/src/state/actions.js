// Behaviour layer: turns the app state plus a few setters into the actions the UI
// calls. AppContext.jsx owns the state; this file owns what the buttons do.

import {
  CITIES,
  applyDecision,
  attendanceRows,
  chainHash,
  coreOf,
  fmtDateTime,
  hostHouses,
  levelFor,
  ledgerRows,
  toCSV,
  validateEventFields
} from "@collabsphere/shared";
import { downloadText } from "../services/download.js";
import { clearAll } from "../services/storage.js";
import { apiEnabled } from "../services/client.js";

export function useActions(app) {
  const {
    user,
    setUser,
    events,
    setEvents,
    peers,
    setPeers,
    pings,
    setPings,
    houseXP,
    setHouseXP,
    societyXP,
    setSocietyXP,
    ledger,
    setLedger,
    tampered,
    setTampered,
    announcements,
    setAnnouncements,
    activity,
    setActivity,
    notify,
    logActivity,
    setBurst
  } = app;

  // ---- member actions ----
  const handleToggleRsvp = (eventId) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const had = ev.rsvps.includes(user.rollNo);
    setEvents((prev) =>
      prev.map((e) => (e.id !== eventId ? e : { ...e, rsvps: had ? e.rsvps.filter((r) => r !== user.rollNo) : [...e.rsvps, user.rollNo] }))
    );
    logActivity("rsvp", `${user.name} ${had ? "cancelled their RSVP for" : "RSVP'd to"} “${ev.title}”`);
    notify(had ? "RSVP cancelled." : "You're on the list.");
  };

  const handleProposeEvent = (f) => {
    const err = validateEventFields(f);
    if (err) return err;
    if (f.coHostHouse === user.house) return "The co-host must be a different house.";
    const base = CITIES[f.city] || CITIES.Kanpur;
    const lat = f.coords ? f.coords.lat : base.lat + (Math.random() - 0.5) * 0.04;
    const lng = f.coords ? f.coords.lng : base.lng + (Math.random() - 0.5) * 0.04;
    const nextNum = Math.max(100, ...events.map((e) => Number(e.id.split("-")[1]) || 0)) + 1;
    const xp = Math.min(100, Math.max(10, Number(f.xpReward) || 50));
    const solo = !f.coHostHouse;
    const created = {
      id: `EVT-${nextNum}`,
      title: f.title.trim(),
      category: f.category,
      city: f.city,
      venue: f.venue.trim(),
      lat,
      lng,
      date: f.date,
      primaryHouse: user.house,
      coHostHouse: f.coHostHouse,
      society: f.society,
      xpReward: xp,
      approvals: solo ? { [user.house]: true } : { [user.house]: true, [f.coHostHouse]: false },
      status: solo ? "APPROVED_LIVE" : "PENDING_COHOST",
      rsvps: [user.rollNo],
      checkedIn: []
    };
    setEvents((prev) => [created, ...prev]);
    logActivity("event", `${user.house} proposed “${created.title}”${solo ? " (solo, live immediately)" : ` with ${f.coHostHouse}`}`);
    notify(solo ? "Event is live on the map." : `Sent to ${f.coHostHouse} for approval. You can follow the status under your proposals.`);
    return null;
  };

  const handleDecide = (eventId, house, approve, reason) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const after = applyDecision(ev, house, approve, reason);
    setEvents((prev) => prev.map((e) => (e.id === eventId ? applyDecision(e, house, approve, reason) : e)));
    logActivity(
      "approval",
      approve
        ? `${house} approved “${ev.title}”${after.status === "APPROVED_LIVE" ? ", now live on the map" : ""}`
        : `${house} rejected “${ev.title}”${reason ? `: ${reason}` : ""}`,
      `${house} Secy`,
      house
    );
    notify(
      approve ? `${house} approved. If every house has signed off, the event is now live on the map.` : `${house} rejected the event.`,
      approve ? "ok" : "error"
    );
  };

  const handleClaimCheckIn = ({ ev, distanceM, photoHash }) => {
    const houses = hostHouses(ev);
    const prevHash = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
    const core = { idx: ledger.length + 1, ts: new Date().toISOString(), eventId: ev.id, rollNo: user.rollNo, xp: ev.xpReward, houses, photoHash, distanceM };
    const entry = { ...core, name: user.name, eventTitle: ev.title, society: ev.society, prevHash, hash: chainHash(prevHash, coreOf(core)) };
    const before = levelFor(user.xp),
      after = levelFor(user.xp + ev.xpReward);

    setLedger((l) => [...l, entry]);
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, checkedIn: [...e.checkedIn, user.rollNo] } : e)));
    setUser((u) => ({ ...u, xp: u.xp + ev.xpReward }));
    setHouseXP((x) => {
      const n = { ...x };
      houses.forEach((h) => {
        n[h] = (n[h] || 0) + ev.xpReward;
      });
      return n;
    });
    if (ev.society && ev.society !== "None") setSocietyXP((x) => ({ ...x, [ev.society]: (x[ev.society] || 0) + ev.xpReward }));
    logActivity("checkin", `${user.name} checked in to “${ev.title}” (+${ev.xpReward} XP for ${houses.join(" and ")})`);
    notify(`Verified. +${ev.xpReward} XP for ${houses.join(" and ")}.`);
    if (after.index > before.index) setTimeout(() => notify(`Level up! You are now ${after.name}.`), 700);
    setBurst(Date.now());
    try {
      if (navigator.vibrate) navigator.vibrate(30);
    } catch (e) {
      /* ignore */
    }
    return entry;
  };

  const handlePing = (peerId) => {
    const had = pings.includes(peerId);
    setPings((p) => (had ? p.filter((x) => x !== peerId) : [...p, peerId]));
    const peer = peers.find((p) => p.id === peerId);
    notify(had ? "Ping withdrawn." : `Ping sent to ${peer ? peer.name : "peer"}.`);
  };

  const handleGoLive = ({ lat, lng, city, status }) => {
    setPeers((prev) => [
      ...prev.filter((p) => p.id !== "me"),
      { id: "me", name: user.name, house: user.house, level: "Degree", city, lat, lng, status, skills: [] }
    ]);
    notify("You're visible to nearby peers.");
  };
  const handleGoOffline = () => {
    setPeers((prev) => prev.filter((p) => p.id !== "me"));
    notify("You're offline on the map.");
  };

  // ---- ledger integrity demo ----
  const handleTamper = () => {
    if (tampered || ledger.length === 0) return;
    setLedger((l) => l.map((e, i) => (i === 0 ? { ...e, xp: e.xp + 1000 } : e)));
    setTampered(true);
    notify("Entry #1 was edited. Run the audit to see it caught.", "error");
  };
  const handleUndoTamper = () => {
    if (!tampered) return;
    setLedger((l) => l.map((e, i) => (i === 0 ? { ...e, xp: e.xp - 1000 } : e)));
    setTampered(false);
    notify("Entry #1 restored.");
  };

  // ---- admin actions ----
  const handleBulkApprove = (ids) => {
    const targets = events.filter((e) => ids.includes(e.id));
    if (!targets.length) return;
    setEvents((prev) => prev.map((e) => (ids.includes(e.id) ? applyDecision(e, user.house, true) : e)));
    targets.forEach((ev) => logActivity("approval", `${user.house} approved “${ev.title}”`, `${user.house} Secy`, user.house));
    notify(`${targets.length} proposal${targets.length === 1 ? "" : "s"} approved by ${user.house}.`);
  };

  const handleEditEvent = (id, f) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return "Event not found.";
    if (!hostHouses(ev).includes(user.house)) return "Only a host house can edit this event.";
    const err = validateEventFields(f);
    if (err) return err;
    const date = fmtDateTime(f.dateLocal);
    const xp = Math.min(100, Math.max(10, Number(f.xpReward) || ev.xpReward));
    const changedSchedule = date !== ev.date || f.venue.trim() !== ev.venue;
    const other = ev.primaryHouse === user.house ? ev.coHostHouse : ev.primaryHouse;
    const reapprove = !!(changedSchedule && ev.coHostHouse && ev.status === "APPROVED_LIVE" && other);
    const next = { ...ev, title: f.title.trim(), venue: f.venue.trim(), date, xpReward: xp, society: f.society, category: f.category };
    if (reapprove) {
      next.approvals = { ...ev.approvals, [other]: false };
      next.status = "PENDING_COHOST";
    }
    setEvents((prev) => prev.map((e) => (e.id === id ? next : e)));
    logActivity("admin", `${user.house} edited “${next.title}”${reapprove ? `, sent back to ${other} for approval` : ""}`);
    notify(reapprove ? `Saved. The new date or venue needs ${other}'s approval again.` : "Event updated.");
    return null;
  };

  const handleCancelEvent = (id, reason) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "CANCELLED", cancelReason: reason } : e)));
    logActivity("admin", `${user.house} cancelled “${ev.title}”: ${reason}`);
    notify("Event cancelled and removed from the map.", "error");
  };
  const handleReopenEvent = (id) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    const all = Object.values(ev.approvals).every(Boolean);
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: all ? "APPROVED_LIVE" : "PENDING_COHOST", cancelReason: "" } : e)));
    logActivity("admin", `${user.house} reopened “${ev.title}”`);
    notify(all ? "Event reopened and live again." : "Event reopened and waiting for approvals.");
  };

  const handlePostAnnouncement = (f) => {
    const item = {
      id: `an${Date.now()}`,
      title: f.title.trim(),
      body: f.body.trim(),
      audience: f.audience,
      pinned: !!f.pinned,
      authorHouse: user.house,
      author: `${user.house} Secy`,
      ts: new Date().toISOString()
    };
    setAnnouncements((a) => [item, ...a]);
    logActivity("admin", `${user.house} posted “${item.title}” to ${f.audience === "All" ? "all houses" : f.audience}`);
    notify("Announcement posted.");
  };
  const handleDeleteAnnouncement = (id) => {
    const an = announcements.find((x) => x.id === id);
    setAnnouncements((a) => a.filter((x) => x.id !== id));
    if (an) logActivity("admin", `${user.house} deleted the announcement “${an.title}”`);
    notify("Announcement deleted.");
  };
  const handleTogglePin = (id) => setAnnouncements((a) => a.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)));

  const handleAward = (house, amount, reason) => {
    setHouseXP((x) => ({ ...x, [house]: (x[house] || 0) + amount }));
    logActivity("admin", `${user.house} Secy awarded +${amount} XP to ${house}: ${reason}`);
    notify(`+${amount} XP awarded to ${house}.`);
  };

  // ---- exports ----
  const exportLedger = () => {
    downloadText("collabsphere-ledger.csv", toCSV(ledgerRows(ledger)), "text/csv");
    notify("Ledger CSV downloaded.");
  };
  const exportAttendance = (ev) => {
    downloadText(`${ev.id}-attendance.csv`, toCSV(attendanceRows(ev, ledger)), "text/csv");
    logActivity("admin", `${user.house} exported attendance for “${ev.title}”`);
    notify("Attendance CSV downloaded.");
  };
  const exportActivity = () => {
    downloadText(
      "collabsphere-activity.csv",
      toCSV([["time", "kind", "by", "house", "text"], ...activity.map((x) => [x.ts, x.kind, x.by, x.house, x.text])]),
      "text/csv"
    );
    notify("Audit trail CSV downloaded.");
  };
  const exportAll = () => {
    const dump = { exportedAt: new Date().toISOString(), user, events, peers, houseXP, societyXP, ledger, announcements, activity };
    downloadText("collabsphere-export.json", JSON.stringify(dump, null, 2), "application/json");
    notify("Full JSON export downloaded.");
  };

  const resetDemo = () => {
    const api = apiEnabled();
    const prompt = api
      ? "Clear this browser's cached copy and re-sync from the server? Server data is unchanged."
      : "Reset all demo data (events, XP, ledger, announcements) to the starting state?";
    if (!window.confirm(prompt)) return;
    clearAll();
    window.location.reload();
  };

  return {
    handleToggleRsvp,
    handleProposeEvent,
    handleDecide,
    handleClaimCheckIn,
    handlePing,
    handleGoLive,
    handleGoOffline,
    handleTamper,
    handleUndoTamper,
    handleBulkApprove,
    handleEditEvent,
    handleCancelEvent,
    handleReopenEvent,
    handlePostAnnouncement,
    handleDeleteAnnouncement,
    handleTogglePin,
    handleAward,
    exportLedger,
    exportAttendance,
    exportActivity,
    exportAll,
    resetDemo
  };
}
