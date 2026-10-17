// Single source of truth for app state and behaviour.
//
// It owns every persisted slice (user, events, ledger, XP tables, theme, ...) plus the
// non-persisted UI state (active tab, toasts, palette, tour, admin gate). useApp()
// exposes the whole flat surface to the feature components; App.jsx is layout only.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ADMIN_SESSION_KEY, CITIES, levelFor } from "@collabsphere/shared";
import { usePersisted } from "../hooks/usePersisted.js";
import { useToasts } from "../hooks/useToasts.js";
import { sessionGet, sessionSet, sessionRemove } from "../services/storage.js";
import { apiEnabled, getAdminToken, client } from "../services/client.js";
import {
  INITIAL_ACTIVITY,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_EVENTS,
  INITIAL_HOUSE_XP,
  INITIAL_PEERS,
  INITIAL_SOCIETY_XP,
  INITIAL_USER
} from "../data/seed.js";
import { TOUR } from "../components/layout/TourCard.jsx";
import { useActions } from "./actions.js";
import { createApiActions } from "./apiActions.js";

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = usePersisted("user", INITIAL_USER);
  const [events, setEvents] = usePersisted("events", INITIAL_EVENTS);
  const [peers, setPeers] = usePersisted("peers", INITIAL_PEERS);
  const [pings, setPings] = usePersisted("pings", []);
  const [houseXP, setHouseXP] = usePersisted("house_xp", INITIAL_HOUSE_XP);
  const [societyXP, setSocietyXP] = usePersisted("society_xp", INITIAL_SOCIETY_XP);
  const [ledger, setLedger] = usePersisted("ledger", []);
  const [tampered, setTampered] = usePersisted("tampered", false);
  const [announcements, setAnnouncements] = usePersisted("announcements", INITIAL_ANNOUNCEMENTS);
  const [activity, setActivity] = usePersisted("activity", INITIAL_ACTIVITY);
  const [theme, setTheme] = usePersisted("theme", "dark");
  const [cityName, setCityName] = usePersisted("city", "Kanpur");
  const [seenTour, setSeenTour] = usePersisted("seen_tour", false);
  const [customLoc, setCustomLoc] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState("EVT-101");
  const { toasts, notify } = useToasts();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tour, setTour] = useState(null);
  const [burst, setBurst] = useState(0);
  const [adminOk, setAdminOk] = useState(() => (apiEnabled() ? !!getAdminToken() : sessionGet(ADMIN_SESSION_KEY) === "1"));
  const [gateOpen, setGateOpen] = useState(false);
  const goTabRef = useRef(null);

  // append to the audit trail shown on the dashboard and in the admin console.
  // In server mode the API owns the trail, so the client does not fabricate entries.
  const logActivity = (kind, text, by, house) => {
    if (apiEnabled()) return;
    setActivity((a) =>
      [
        {
          id: `ac${Date.now()}${Math.floor(Math.random() * 10000)}`,
          ts: new Date().toISOString(),
          kind,
          text,
          by: by || user.name,
          house: house || user.house
        },
        ...a
      ].slice(0, 150)
    );
  };
  // theme: set on <html> and the browser chrome colour
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", theme === "light" ? "#f0f1fc" : "#080916");
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // first visit: open the tour once
  useEffect(() => {
    if (seenTour) return;
    const t = setTimeout(() => setTour(0), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // confetti only lives for a moment
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(0), 2200);
    return () => clearTimeout(t);
  }, [burst]);

  // keyboard: Ctrl/Cmd+K palette, 1-6 tabs, / to search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        return;
      }
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const keys = { "1": "dashboard", "2": "map", "3": "host", "4": "checkin", "5": "leaderboard", "6": "admin" };
      if (keys[e.key]) goTabRef.current(keys[e.key]);
      else if (e.key === "/") {
        e.preventDefault();
        setActiveTab("map");
        setTimeout(() => {
          const el = document.getElementById("event-search");
          if (el) el.focus();
        }, 80);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // every route into a tab goes through here, so the Admin tab can't be reached without the password
  const goTab = (tab) => {
    if (tab === "admin" && !adminOk) {
      setGateOpen(true);
      return;
    }
    setActiveTab(tab);
  };
  goTabRef.current = goTab;
  const unlockAdmin = () => {
    if (!apiEnabled()) sessionSet(ADMIN_SESSION_KEY, "1"); // server mode stores an opaque admin token instead
    setAdminOk(true);
    setGateOpen(false);
    setActiveTab("admin");
    notify("Admin unlocked.");
  };
  const lockAdmin = () => {
    if (apiEnabled()) client.adminLock().catch(() => {});
    else sessionRemove(ADMIN_SESSION_KEY);
    setAdminOk(false);
    setActiveTab("dashboard");
    notify("Admin locked.");
  };

  // Server mode: pull the authoritative state, then keep it fresh after each mutation.
  // A client that forges localStorage still cannot forge these responses.
  const refresh = useCallback(async () => {
    if (!apiEnabled()) return;
    const [ev, led, lb, ann, act, ppl, me] = await Promise.all([
      client.events({ status: "all" }),
      client.ledger(),
      client.leaderboard(),
      client.announcements(),
      client.activity(),
      client.peers(),
      client.me().catch(() => null)
    ]);
    setEvents(ev || []);
    setLedger(led || []);
    setHouseXP(Object.fromEntries((lb?.houses || []).map((h) => [h.house, h.xp])));
    setSocietyXP(Object.fromEntries((lb?.societies || []).map((s) => [s.name, s.xp])));
    setAnnouncements(ann || []);
    setActivity((act || []).slice(0, 150));
    setPeers(ppl || []);
    setPings((ppl || []).filter((p) => p.pinged).map((p) => p.id));
    if (me && me.rollNo) setUser((u) => ({ ...u, ...me }));
  }, []);

  useEffect(() => {
    if (!apiEnabled()) return;
    refresh().catch((e) => notify(e && e.message ? e.message : "Could not reach the API.", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = events.filter((e) => e.status === "PENDING_COHOST" && e.primaryHouse === user.house).length;
  const needsCount = events.filter((e) => e.status === "PENDING_COHOST" && e.approvals[user.house] === false).length;
  const myPeer = peers.find((p) => p.id === "me");
  const lvl = levelFor(user.xp);
  const center =
    cityName === "Custom" && customLoc
      ? { lat: customLoc.lat, lng: customLoc.lng, zoom: 12, label: customLoc.label }
      : { ...(CITIES[cityName] || CITIES.Kanpur), label: CITIES[cityName] ? cityName : "Kanpur" };

  const localActions = useActions({
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
  });

  // Server mode swaps the write actions for API-backed ones; reads/exports stay local.
  const actions = apiEnabled()
    ? { ...localActions, ...createApiActions({ app: { notify, refresh, user, events, announcements, setBurst }, local: localActions }) }
    : localActions;

  const goCheckIn = (id) => {
    setSelectedEventId(id);
    setActiveTab("checkin");
  };
  const openEvent = (ev) => {
    if (CITIES[ev.city]) setCityName(ev.city);
    setSelectedEventId(ev.id);
    setActiveTab("map");
  };

  const closeTour = () => {
    setTour(null);
    setSeenTour(true);
  };
  const tourTab = (tab) => {
    if (tab === "admin" && !adminOk) return; // the tour never opens a locked Admin tab
    setActiveTab(tab);
  };
  const startTour = () => {
    setTour(0);
    tourTab(TOUR[0].tab);
  };
  const nextTour = () => {
    const n = tour + 1;
    if (n >= TOUR.length) return closeTour();
    setTour(n);
    tourTab(TOUR[n].tab);
  };
  const prevTour = () => {
    const n = Math.max(0, tour - 1);
    setTour(n);
    tourTab(TOUR[n].tab);
  };

  const adminActions = {
    decide: actions.handleDecide,
    bulkApprove: actions.handleBulkApprove,
    editEvent: actions.handleEditEvent,
    cancelEvent: actions.handleCancelEvent,
    reopenEvent: actions.handleReopenEvent,
    postAnnouncement: actions.handlePostAnnouncement,
    deleteAnnouncement: actions.handleDeleteAnnouncement,
    togglePin: actions.handleTogglePin,
    award: actions.handleAward,
    openEvent,
    exportLedger: actions.exportLedger,
    exportAttendance: actions.exportAttendance,
    exportActivity: actions.exportActivity,
    exportAll: actions.exportAll,
    reset: actions.resetDemo,
    lock: lockAdmin
  };

  const value = {
    // persisted state
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
    theme,
    setTheme,
    cityName,
    setCityName,
    seenTour,
    setSeenTour,
    // non-persisted UI state
    customLoc,
    setCustomLoc,
    selectedEventId,
    setSelectedEventId,
    toasts,
    notify,
    paletteOpen,
    setPaletteOpen,
    tour,
    setTour,
    burst,
    adminOk,
    gateOpen,
    setGateOpen,
    activeTab,
    setActiveTab,
    // derived
    pendingCount,
    needsCount,
    myPeer,
    lvl,
    center,
    // navigation
    goTab,
    unlockAdmin,
    lockAdmin,
    toggleTheme,
    goCheckIn,
    openEvent,
    startTour,
    nextTour,
    prevTour,
    closeTour,
    // actions
    ...actions,
    adminActions
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
