// Server-backed action implementations. Each one calls the API, then re-reads the
// authoritative state. The signatures match the offline actions in actions.js, so the
// UI does not care which mode is active (callers `await` either way).

import { client } from "../services/client.js";

const errText = (e) => (e && e.message) || "Something went wrong.";

export function createApiActions({ app, local }) {
  const { notify, refresh, user, events, setBurst } = app;

  // Fire-and-forget mutations: run, report, re-read. Nothing in the UI inspects the
  // return value of these (they are wired straight to onClick), so a failure is
  // surfaced as a toast and swallowed rather than thrown into an unhandled rejection.
  const write = async (fn, okMsg) => {
    try {
      const res = await fn();
      if (okMsg) notify(typeof okMsg === "function" ? okMsg(res) : okMsg);
      await refresh();
      return res;
    } catch (e) {
      notify(errText(e), "error");
      return undefined;
    }
  };

  return {
    handleToggleRsvp: (eventId) => {
      const ev = events.find((e) => e.id === eventId);
      const had = ev && ev.rsvps.includes(user.rollNo);
      return write(() => (had ? client.unrsvp(eventId) : client.rsvp(eventId)), had ? "RSVP cancelled." : "You're on the list.");
    },

    handleProposeEvent: async (f) => {
      try {
        await client.proposeEvent({
          title: f.title,
          venue: f.venue,
          category: f.category,
          city: f.city,
          coHostHouse: f.coHostHouse,
          society: f.society,
          xpReward: f.xpReward,
          dateLocal: f.dateLocal,
          date: f.date,
          lat: f.coords ? f.coords.lat : undefined,
          lng: f.coords ? f.coords.lng : undefined
        });
        notify(f.coHostHouse ? `Sent to ${f.coHostHouse} for approval.` : "Event is live on the map.");
        await refresh();
        return null;
      } catch (e) {
        return errText(e); // the form shows this message
      }
    },

    handleClaimCheckIn: async ({ ev, distanceM, photoHash, code, lat, lng }) => {
      try {
        const res = await client.checkIn({ eventId: ev.id, code, lat, lng, photoHash });
        notify(`Verified. +${res.entry.xp} XP for ${res.entry.houses.join(" and ")}.`);
        if (res.levelUp) setTimeout(() => notify(`Level up! You are now ${res.levelUp.name}.`), 700);
        setBurst(Date.now());
        try { if (navigator.vibrate) navigator.vibrate(30); } catch {}
        await refresh();
        return res.entry;
      } catch (e) {
        notify(errText(e), "error");
        throw e;
      }
    },

    handlePing: (peerId) => write(() => client.ping(peerId)),

    handleGoLive: (payload) => write(() => client.goLive(payload), "You're visible to nearby peers."),

    handleGoOffline: () => write(() => client.goOffline(), "You're offline on the map."),

    // The tamper demo works on the in-memory chain; it is illustrative only on the server.
    handleTamper: local.handleTamper,
    handleUndoTamper: local.handleUndoTamper,

    handleDecide: (eventId, house, approve, reason) =>
      write(
        () => client.decide(eventId, house, approve, reason),
        approve ? `${house} approved. If every house has signed off, the event is now live on the map.` : `${house} rejected the event.`
      ),

    handleBulkApprove: (ids) => write(() => client.bulkApprove(ids), (r) => `${r.count} proposal${r.count === 1 ? "" : "s"} approved.`),

    handleEditEvent: async (id, f) => {
      try {
        await client.updateEvent(id, {
          title: f.title,
          venue: f.venue,
          dateLocal: f.dateLocal,
          xpReward: f.xpReward,
          society: f.society,
          category: f.category
        });
        notify("Event updated.");
        await refresh();
        return null;
      } catch (e) {
        return errText(e);
      }
    },

    handleCancelEvent: (id, reason) => write(() => client.cancelEvent(id, reason), "Event cancelled and removed from the map."),

    handleReopenEvent: (id) => write(() => client.reopenEvent(id), "Event reopened."),

    handlePostAnnouncement: (f) =>
      write(
        () => client.createAnnouncement({ title: f.title, body: f.body, audience: f.audience, pinned: !!f.pinned }),
        "Announcement posted."
      ),

    handleDeleteAnnouncement: (id) => write(() => client.deleteAnnouncement(id), "Announcement deleted."),

    handleTogglePin: async (id) => {
      const an = app.announcements.find((x) => x.id === id);
      return write(() => client.togglePin(id, !(an && an.pinned)));
    },

    handleAward: (house, amount, reason) => write(() => client.award({ house, amount, reason }), `+${amount} XP awarded to ${house}.`)
  };
}
