import { useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Segmented } from "../../components/ui/Segmented.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { FIELD } from "../../components/ui/Field.jsx";
import { EventCard } from "../../components/cards/EventCard.jsx";
import { PeerCard } from "../../components/cards/PeerCard.jsx";
import { SelectedEventCard } from "../../components/cards/SelectedEventCard.jsx";
import { SelectedPeerCard } from "../../components/cards/SelectedPeerCard.jsx";
import { RegionalLeafletMap } from "../../components/map/RegionalLeafletMap.jsx";
import { usePersisted } from "../../hooks/usePersisted.js";
import { CATEGORIES, CITIES, HOUSES, haversineDistance, hostHouses, parseEventDate } from "@collabsphere/shared";
import { useApp } from "../../state/AppContext.jsx";

const STATUS_IDEAS = ["Down for co-working", "Open to a study group", "Coffee and code", "Mock viva prep"];

export function DiscoverTab() {
  const {
    user,
    events,
    peers,
    pings,
    selectedEventId,
    setSelectedEventId,
    handleToggleRsvp: onRsvp,
    goCheckIn: onGoCheckIn,
    handlePing: onPing,
    goTab,
    myPeer,
    handleGoLive: onGoLive,
    handleGoOffline: onGoOffline,
    notify,
    theme,
    center,
    cityName,
    setCityName,
    customLoc,
    setCustomLoc
  } = useApp();
  const goHostTab = () => goTab("host");
  const [radiusKm, setRadiusKm] = usePersisted("radius", 15);
  const [category, setCategory] = useState("All");
  const [houseFilter, setHouseFilter] = useState("Any");
  const [sort, setSort] = useState("nearest");
  const [query, setQuery] = useState("");
  const [listTab, setListTab] = useState("events");
  const [selectedPeerId, setSelectedPeerId] = useState(null);
  const [focusKind, setFocusKind] = useState("event");
  const [focus, setFocus] = useState(null);
  const [dropMode, setDropMode] = useState(false);
  const [fitNonce, setFitNonce] = useState(0);
  const [statusText, setStatusText] = useState("Down for co-working");

  // when something else (command palette, Check in button) selects an event, show its card
  useEffect(() => {
    setFocusKind("event");
  }, [selectedEventId]);

  const visibleEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = events
      .filter((ev) => ev.status === "APPROVED_LIVE")
      .filter((ev) => category === "All" || ev.category === category)
      .filter((ev) => houseFilter === "Any" || hostHouses(ev).includes(houseFilter))
      .filter((ev) => !q || `${ev.title} ${ev.venue} ${ev.society} ${ev.city} ${hostHouses(ev).join(" ")}`.toLowerCase().includes(q))
      .map((ev) => ({ ...ev, dist: haversineDistance(center.lat, center.lng, ev.lat, ev.lng) }))
      .filter((ev) => ev.dist <= radiusKm);
    const when = (ev) => (parseEventDate(ev.date) || new Date(8.64e15)).getTime();
    if (sort === "soonest") list.sort((a, b) => when(a) - when(b));
    else if (sort === "xp") list.sort((a, b) => b.xpReward - a.xpReward || a.dist - b.dist);
    else list.sort((a, b) => a.dist - b.dist);
    return list;
  }, [events, center.lat, center.lng, radiusKm, category, houseFilter, query, sort]);

  const visiblePeers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return peers
      .filter((p) => !q || `${p.name} ${p.status} ${p.house} ${p.skills.join(" ")}`.toLowerCase().includes(q))
      .map((p) => ({ ...p, dist: haversineDistance(center.lat, center.lng, p.lat, p.lng) }))
      .filter((p) => p.dist <= radiusKm)
      .sort((a, b) => a.dist - b.dist);
  }, [peers, center.lat, center.lng, radiusKm, query]);

  const selectedEvent = focusKind === "event" ? visibleEvents.find((e) => e.id === selectedEventId) : null;
  const selectedPeer = focusKind === "peer" ? visiblePeers.find((p) => p.id === selectedPeerId) : null;

  const pickEvent = (ev, fly) => {
    setSelectedEventId(ev.id);
    setSelectedPeerId(null);
    setFocusKind("event");
    if (fly) setFocus({ lat: ev.lat, lng: ev.lng, n: Date.now() });
  };
  const pickPeer = (p, fly) => {
    setSelectedPeerId(p.id);
    setFocusKind("peer");
    if (fly) setFocus({ lat: p.lat, lng: p.lng, n: Date.now() });
  };

  const locateMe = () => {
    if (!navigator.geolocation) return notify("This browser has no GPS access.", "error");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "My location" });
        setCityName("Custom");
      },
      () => notify("Location permission denied or unavailable.", "error"),
      { timeout: 8000 }
    );
  };
  const onMapClick = (ll) => {
    setDropMode(false);
    setCustomLoc({ lat: ll.lat, lng: ll.lng, label: "Dropped pin" });
    setCityName("Custom");
    notify("Searching from your dropped pin.");
  };
  const goLive = () => {
    const jitter = () => (Math.random() - 0.5) * 0.02;
    onGoLive({ lat: center.lat + jitter(), lng: center.lng + jitter(), city: center.label, status: statusText.trim() || "Open to co-work" });
  };

  const chip = (active) =>
    `shrink-0 h-8 px-3 rounded-full text-xs font-semibold glass transition inline-flex items-center gap-1.5 ${
      active ? "!bg-pri !text-priink !border-pri" : "text-tx hover:!border-mu/60"
    }`;
  const filterChip = (active) =>
    `shrink-0 h-8 px-3 rounded-full text-xs font-semibold border transition ${
      active ? "bg-pri/15 border-pri/50 text-pritx" : "bg-s2 border-line text-mu hover:text-tx"
    }`;

  return (
    <div className="discover-shell win flex flex-col lg:flex-row mx-3 sm:mx-5 mt-3 mb-3 rounded-[32px] overflow-hidden">
      {/* LEFT: search, filters, results */}
      <aside className="order-2 lg:order-1 lg:w-[400px] lg:shrink-0 flex flex-col lg:min-h-0 border-t lg:border-t-0 lg:border-r border-line bg-s1/70">
        <div className="p-3 space-y-3 border-b border-line">
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-mu absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="event-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${FIELD} pl-9 pr-9`}
              placeholder="Search events, venues, houses, people"
              aria-label="Search events and people"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md text-mu hover:text-tx flex items-center justify-center"
                aria-label="Clear search"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {["All", ...CATEGORIES].map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={filterChip(category === c)} aria-pressed={category === c}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={houseFilter} onChange={(e) => setHouseFilter(e.target.value)} className={FIELD} aria-label="Filter by host house">
              <option value="Any">Any house</option>
              {HOUSES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={FIELD} aria-label="Sort events">
              <option value="nearest">Nearest first</option>
              <option value="soonest">Soonest first</option>
              <option value="xp">Most XP first</option>
            </select>
          </div>
          <Segmented
            className="w-full"
            value={listTab}
            onChange={setListTab}
            options={[
              { value: "events", label: "Events", count: visibleEvents.length },
              { value: "people", label: "People", count: visiblePeers.length }
            ]}
          />
        </div>

        <div className="p-3 space-y-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto scroll-thin">
          {listTab === "events" &&
            (visibleEvents.length === 0 ? (
              <EmptyState icon="map" title="No live events here">
                Widen the radius, clear a filter, or{" "}
                <button type="button" onClick={goHostTab} className="text-pritx underline">
                  propose one with another house
                </button>
                .
              </EmptyState>
            ) : (
              visibleEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  ev={ev}
                  selected={focusKind === "event" && ev.id === selectedEventId}
                  rsvped={ev.rsvps.includes(user.rollNo)}
                  onClick={() => pickEvent(ev, true)}
                />
              ))
            ))}

          {listTab === "people" && (
            <>
              <div className="rounded-2xl border border-line bg-s2/50 p-3">
                {myPeer ? (
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-ok shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-tx">You are visible</div>
                      <div className="text-xs text-ok truncate">{myPeer.status}</div>
                    </div>
                    <Btn size="sm" variant="soft" onClick={onGoOffline}>
                      Go offline
                    </Btn>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-tx">Let peers find you</div>
                    <input
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      maxLength={60}
                      className={FIELD}
                      placeholder="What are you up to?"
                      aria-label="Your status"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_IDEAS.map((s) => (
                        <button key={s} type="button" onClick={() => setStatusText(s)} className={filterChip(statusText === s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <Btn variant="primary" size="sm" icon="radio" className="w-full" onClick={goLive}>
                      Go live on the map
                    </Btn>
                    <p className="text-[11px] text-mu">Your pin is placed near the centre of the search area, not at your exact location.</p>
                  </div>
                )}
              </div>
              {visiblePeers.length === 0 ? (
                <EmptyState icon="users" title="Nobody is sharing here yet">
                  Go live above to be the first, or widen the radius.
                </EmptyState>
              ) : (
                visiblePeers.map((p) => (
                  <PeerCard
                    key={p.id}
                    p={p}
                    selected={focusKind === "peer" && p.id === selectedPeerId}
                    pinged={pings.includes(p.id)}
                    onClick={() => pickPeer(p, true)}
                    onPing={onPing}
                  />
                ))
              )}
            </>
          )}
        </div>
      </aside>

      {/* RIGHT: the map with floating controls */}
      <section className="order-1 lg:order-2 relative h-[64vh] min-h-[440px] lg:h-auto lg:min-h-0 lg:flex-1 overflow-hidden">
        <RegionalLeafletMap
          center={center}
          radiusKm={radiusKm}
          events={visibleEvents}
          peers={visiblePeers}
          selectedEventId={focusKind === "event" ? selectedEventId : null}
          selectedPeerId={focusKind === "peer" ? selectedPeerId : null}
          focus={focus}
          fitNonce={fitNonce}
          dropMode={dropMode}
          theme={theme}
          onSelectEvent={(id) => {
            const ev = visibleEvents.find((e) => e.id === id);
            if (ev) pickEvent(ev, false);
          }}
          onSelectPeer={(id) => {
            const p = visiblePeers.find((x) => x.id === id);
            if (p) pickPeer(p, false);
          }}
          onMapClick={onMapClick}
        />

        <div className="absolute z-10 top-3 left-3 right-16 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {Object.keys(CITIES).map((c) => (
            <button key={c} type="button" onClick={() => setCityName(c)} className={chip(cityName === c)} aria-pressed={cityName === c}>
              {c}
            </button>
          ))}
          {customLoc && (
            <button type="button" onClick={() => setCityName("Custom")} className={chip(cityName === "Custom")} aria-pressed={cityName === "Custom"}>
              <Icon name="pin" className="w-3.5 h-3.5" />
              {customLoc.label}
            </button>
          )}
          <span className="w-px h-5 bg-line shrink-0 mx-0.5" />
          <button type="button" onClick={locateMe} className={chip(false)}>
            <Icon name="crosshair" className="w-3.5 h-3.5" />
            Near me
          </button>
          <button type="button" onClick={() => setDropMode((d) => !d)} className={chip(dropMode)} aria-pressed={dropMode}>
            <Icon name="pin" className="w-3.5 h-3.5" />
            Drop a pin
          </button>
          <button type="button" onClick={() => setFitNonce((n) => n + 1)} className={chip(false)}>
            <Icon name="maximize" className="w-3.5 h-3.5" />
            Show whole area
          </button>
        </div>

        {dropMode && (
          <div className="absolute z-10 top-14 inset-x-0 flex justify-center px-3 pointer-events-none">
            <div className="pointer-events-auto glass rounded-full px-4 py-2 text-xs font-semibold text-tx pop-in flex items-center gap-2" role="status">
              Click anywhere on the map to search from there
              <button type="button" onClick={() => setDropMode(false)} className="text-pritx underline">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="absolute z-10 left-3 right-3 bottom-7 flex flex-col items-start gap-2 pointer-events-none">
          {selectedEvent && (
            <SelectedEventCard
              key={selectedEvent.id}
              ev={selectedEvent}
              user={user}
              notify={notify}
              onClose={() => setFocusKind("none")}
              onRsvp={onRsvp}
              onCheckIn={onGoCheckIn}
            />
          )}
          {selectedPeer && (
            <SelectedPeerCard key={selectedPeer.id} p={selectedPeer} pinged={pings.includes(selectedPeer.id)} onClose={() => setFocusKind("none")} onPing={onPing} />
          )}
          <div className="pointer-events-auto glass rounded-2xl px-4 py-3 w-full max-w-md">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-tx">Search radius: {radiusKm} km</span>
              <span className="text-mu truncate">
                {visibleEvents.length} events, {visiblePeers.length} people
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full mt-1.5"
              aria-label="Search radius in kilometres"
            />
            <p className="hidden sm:block text-[11px] text-mu mt-1">
              Pins split into two colours when two houses host together. Only events approved by every host house appear here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
