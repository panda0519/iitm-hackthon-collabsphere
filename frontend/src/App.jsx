// Layout and routing only. Every piece of state and every action comes from useApp().
import { Btn } from "./components/ui/Btn.jsx";
import { Card } from "./components/ui/Card.jsx";
import { EmptyState } from "./components/ui/EmptyState.jsx";
import { Rail, BottomNav, TopBar, CommandPalette, TourCard } from "./components/layout/index.js";
import { AdminGate } from "./features/admin/AdminGate.jsx";
import { AdminConsole } from "./features/admin/AdminConsole.jsx";
import { Burst } from "./components/ui/Burst.jsx";
import { Toasts } from "./components/ui/Toasts.jsx";
import { Dashboard } from "./features/dashboard/Dashboard.jsx";
import { DiscoverTab } from "./features/discover/DiscoverTab.jsx";
import { HostManager } from "./features/host/HostManager.jsx";
import { CheckInPanel } from "./features/checkin/CheckInPanel.jsx";
import { Leaderboard } from "./features/leaderboard/Leaderboard.jsx";
import { useApp } from "./state/AppContext.jsx";
import { apiEnabled } from "./services/client.js";
import { CITIES } from "@collabsphere/shared";

export const PAGE_TITLES = {
  dashboard: ["Dashboard", "Your house, your meetups, your momentum"],
  map: ["Discover", "Find meetups from other houses near you"],
  host: ["Host a joint event", "Two houses sign off before it reaches the map"],
  checkin: ["Proof-of-presence check-in", "Live code, geofence and venue photo"],
  leaderboard: ["House recognition ledger", "Standings backed by a tamper-evident chain"],
  admin: ["Admin console", "Approve, edit and audit everything your house runs"]
};

export function App() {
  const {
    activeTab,
    setActiveTab,
    goTab,
    theme,
    toggleTheme,
    paletteOpen,
    setPaletteOpen,
    user,
    lvl,
    pendingCount,
    needsCount,
    ledger,
    adminOk,
    events,
    setCityName,
    openEvent,
    exportLedger,
    exportAll,
    resetDemo,
    startTour,
    gateOpen,
    setGateOpen,
    unlockAdmin,
    tour,
    nextTour,
    prevTour,
    closeTour,
    toasts,
    burst,
    selectedEventId
  } = useApp();

  const tabs = [
    { id: "dashboard", label: "Home", icon: "dash", badge: 0 },
    { id: "map", label: "Discover", icon: "map", badge: 0 },
    { id: "host", label: "Host", icon: "users", badge: pendingCount },
    { id: "checkin", label: "Check in", icon: "shield", badge: 0 },
    { id: "leaderboard", label: "Ledger", icon: "trophy", badge: ledger.length },
    { id: "admin", label: "Admin", icon: "sliders", badge: adminOk ? needsCount : 0, locked: !adminOk }
  ];

  // ---- command palette entries ----
  const commands = [
    ...tabs.map((t, i) => ({
      id: "go-" + t.id,
      group: "Go to",
      label: t.label === "Home" ? "Dashboard" : t.label,
      hint: String(i + 1),
      icon: t.icon,
      run: () => goTab(t.id)
    })),
    {
      id: "theme",
      group: "Appearance",
      label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      icon: theme === "dark" ? "sun" : "moon",
      run: toggleTheme
    },
    { id: "tour", group: "Help", label: "Take the guided tour", icon: "sparkles", run: startTour },
    ...Object.keys(CITIES).map((c) => ({
      id: "city-" + c,
      group: "Search area",
      label: `Show events in ${c}`,
      icon: "pin",
      run: () => {
        setCityName(c);
        setActiveTab("map");
      }
    })),
    ...events
      .filter((e) => e.status === "APPROVED_LIVE")
      .map((ev) => ({ id: "ev-" + ev.id, group: "Live events", label: ev.title, hint: ev.city, icon: "bolt", run: () => openEvent(ev) })),
    { id: "export-ledger", group: "Data", label: "Export ledger (CSV)", icon: "download", run: exportLedger },
    { id: "export-all", group: "Data", label: "Export everything (JSON)", icon: "download", run: exportAll },
    { id: "reset", group: "Data", label: "Reset demo data", icon: "refresh", run: resetDemo }
  ];

  return (
    <>
      <div className="aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="dust" aria-hidden="true" />
      <div className="relative z-[1] min-h-screen">
        <Rail tabs={tabs} active={activeTab} onSelect={goTab} onTour={startTour} onReset={resetDemo} />

        <div className="lg:pl-[104px] min-h-screen flex flex-col">
          <TopBar
            title={PAGE_TITLES[activeTab][0]}
            subtitle={PAGE_TITLES[activeTab][1]}
            user={user}
            lvl={lvl}
            theme={theme}
            onTheme={toggleTheme}
            onPalette={() => setPaletteOpen(true)}
            onProfile={() => setActiveTab("dashboard")}
          />

          <main className="flex-1 pb-28 lg:pb-6">
            <div key={activeTab} className="tab-fade">
              {activeTab === "dashboard" && <Dashboard />}
              {activeTab === "map" && <DiscoverTab />}
              {activeTab !== "map" && activeTab !== "dashboard" && (
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 lg:py-7">
                  {activeTab === "host" && <HostManager />}
                  {activeTab === "checkin" && <CheckInPanel key={selectedEventId} />}
                  {activeTab === "leaderboard" && <Leaderboard />}
                  {activeTab === "admin" && adminOk && <AdminConsole />}
                  {activeTab === "admin" && !adminOk && (
                    <Card>
                      <EmptyState icon="lock" title="Admin is locked">
                        Enter your house secretary password to open the console.
                        <p className="text-xs text-mu mt-2">
                          Demo / examiner password: <span className="font-semibold text-tx select-all">Demo@2026</span>
                        </p>
                        <div className="mt-4">
                          <Btn variant="primary" icon="lock" onClick={() => setGateOpen(true)}>
                            Unlock Admin
                          </Btn>
                        </div>
                      </EmptyState>
                    </Card>
                  )}
                  <p className="text-[11px] text-mu text-center mt-8">
                    {apiEnabled()
                      ? "Connected to the CollabSphere API: accounts, secretary unlocks, check-in verification and the ledger are enforced on the server."
                      : "Offline prototype: data is kept in this browser only. Set VITE_USE_API=1 to move approvals, codes, GPS validation and the ledger onto the server."}
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>

        <BottomNav tabs={tabs} active={activeTab} onSelect={goTab} />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
        {gateOpen && <AdminGate onUnlock={unlockAdmin} onClose={() => setGateOpen(false)} />}
        {tour !== null && <TourCard step={tour} onPrev={prevTour} onNext={nextTour} onClose={closeTour} />}
        <Toasts toasts={toasts} />
        {burst ? <Burst key={burst} /> : null}
      </div>
    </>
  );
}
