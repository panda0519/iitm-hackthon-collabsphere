import { useEffect, useRef } from "react";
import { TILE_SOURCES, houseColor, houseSplit, hostHouses, housesLabel } from "@collabsphere/shared";
import { escapeHtml } from "../../utils/escapeHtml.js";

// Imperative Leaflet wrapper. `L` is the CDN global from index.html.
export function RegionalLeafletMap({
  center,
  radiusKm,
  events,
  peers,
  selectedEventId,
  selectedPeerId,
  focus,
  fitNonce,
  dropMode,
  theme,
  onSelectEvent,
  onSelectPeer,
  onMapClick
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const tileRef = useRef(null); // { layers: [...], idx, theme } for the tile source currently on the map
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const refitRef = useRef(null);
  const sizedRef = useRef(false);
  const cbs = useRef({});
  cbs.current = { onSelectEvent, onSelectPeer, onMapClick, dropMode };

  // Put tile source `idx` on the map for the given theme; if its first tiles all fail
  // to load, move to the next source.
  const applyTiles = (map, idx, th) => {
    const old = tileRef.current;
    if (old) old.layers.forEach((l) => map.removeLayer(l));
    const src = TILE_SOURCES[idx];
    const urls = src.layers[th] || src.layers.dark;
    let loaded = 0,
      failed = 0;
    const layers = urls.map((url, i) => {
      const layer = L.tileLayer(url, {
        attribution: i === 0 ? src.attribution : "",
        maxZoom: 19,
        maxNativeZoom: src.maxNativeZoom,
        zIndex: i + 1
      });
      layer.on("tileload", () => {
        loaded++;
      });
      layer.on("tileerror", () => {
        failed++;
        const live = tileRef.current && tileRef.current.idx === idx; // ignore late errors from a source we already left
        if (i === 0 && live && loaded === 0 && failed >= 3 && idx < TILE_SOURCES.length - 1) {
          applyTiles(map, idx + 1, themeRef.current);
        }
      });
      return layer.addTo(map);
    });
    tileRef.current = { layers, idx, theme: th };
    if (containerRef.current) containerRef.current.classList.toggle("cs-tint-dark", !!src.tint && th === "dark");
  };

  // Create the map once, destroy it on unmount.
  useEffect(() => {
    if (typeof L === "undefined" || !containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView(
      [center.lat, center.lng],
      center.zoom
    );
    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
    applyTiles(map, 0, theme);
    layerRef.current = L.layerGroup().addTo(map);
    map.on("click", (e) => {
      if (cbs.current.dropMode && cbs.current.onMapClick) cbs.current.onMapClick(e.latlng);
    });
    mapRef.current = map;
    // The page styles arrive a moment after React mounts, so the first real size can land late.
    // Fit the search area again once the container actually has a size.
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            map.invalidateSize();
            const el = containerRef.current;
            if (!sizedRef.current && el && el.clientWidth > 0 && el.clientHeight > 0) {
              sizedRef.current = true;
              if (refitRef.current) refitRef.current();
            }
          })
        : null;
    if (ro) ro.observe(containerRef.current);
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => {
      clearTimeout(t);
      if (ro) ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tileRef.current = null;
    };
  }, []);

  // Light/dark base map follows the app theme.
  useEffect(() => {
    const cur = tileRef.current;
    if (mapRef.current && cur && cur.theme !== theme) applyTiles(mapRef.current, cur.idx, theme); // skip the first run: tiles are already in place
  }, [theme]);

  // Crosshair cursor while "drop a pin" is armed.
  useEffect(() => {
    if (containerRef.current) containerRef.current.classList.toggle("cs-drop", !!dropMode);
  }, [dropMode]);

  // Re-fit only when the search area changes (so panning isn't reset by RSVPs etc.).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const circle = L.circle([center.lat, center.lng], {
      color: "#8fc5ff",
      fillColor: "#8fc5ff",
      fillOpacity: 0.09,
      weight: 2,
      dashArray: "6 8",
      radius: radiusKm * 1000,
      interactive: false
    }).addTo(map);
    const dot = L.circleMarker([center.lat, center.lng], {
      radius: 5,
      color: "#fff",
      weight: 2,
      fillColor: "#8fc5ff",
      fillOpacity: 1,
      interactive: false
    }).addTo(map);
    map.fitBounds(circle.getBounds(), { padding: [24, 24], animate: true, duration: 0.5 });
    refitRef.current = () => map.fitBounds(circle.getBounds(), { padding: [24, 24], animate: false });
    return () => {
      circle.remove();
      dot.remove();
      refitRef.current = null;
    };
  }, [center.lat, center.lng, radiusKm, fitNonce]);

  // Glide to whatever the person just picked in the list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 14), { duration: 0.7 });
  }, [focus]);

  // Redraw pins when data changes.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const sel = events.find((e) => e.id === selectedEventId);
    if (sel) {
      L.polyline(
        [
          [center.lat, center.lng],
          [sel.lat, sel.lng]
        ],
        { color: "#8fc5ff", weight: 2, dashArray: "2 8", opacity: 0.9, interactive: false }
      ).addTo(layer);
    }

    events.forEach((ev) => {
      const isSel = ev.id === selectedEventId;
      const html = `<div class="pin ${isSel ? "selected" : ""}" style="background:${houseSplit(
        hostHouses(ev),
        "conic"
      )}"><span>+${ev.xpReward}</span></div>`;
      const icon = L.divIcon({ className: "", html, iconSize: [34, 34], iconAnchor: [17, 17] });
      const marker = L.marker([ev.lat, ev.lng], { icon, zIndexOffset: isSel ? 1000 : 0 }).addTo(layer);
      marker.bindTooltip(`<b>${escapeHtml(ev.title)}</b><br>${escapeHtml(housesLabel(ev))}`, {
        direction: "top",
        offset: [0, -18],
        className: "cs-tip"
      });
      marker.on("click", () => cbs.current.onSelectEvent(ev.id));
    });

    peers.forEach((peer) => {
      const isSel = peer.id === selectedPeerId;
      const html = `<div class="pin-peer ${isSel ? "selected" : ""} ${peer.id === "me" ? "me" : ""}" style="background:${houseColor(
        peer.house
      )}">${escapeHtml(peer.name.charAt(0))}</div>`;
      const icon = L.divIcon({ className: "", html, iconSize: [26, 26], iconAnchor: [13, 13] });
      const marker = L.marker([peer.lat, peer.lng], { icon, zIndexOffset: isSel ? 900 : 0 }).addTo(layer);
      marker.bindTooltip(`<b>${escapeHtml(peer.name)}</b><br>${escapeHtml(peer.status)}`, {
        direction: "top",
        offset: [0, -14],
        className: "cs-tip"
      });
      marker.on("click", () => cbs.current.onSelectPeer(peer.id));
    });
  }, [events, peers, selectedEventId, selectedPeerId, center.lat, center.lng]);

  if (typeof L === "undefined") {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-sm text-mu text-center px-6">
        The map library failed to load. Check your internet connection and reload.
      </div>
    );
  }
  return <div ref={containerRef} className="absolute inset-0" />;
}
