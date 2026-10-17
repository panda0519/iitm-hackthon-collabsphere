import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../../components/ui/Card.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Field, FIELD } from "../../components/ui/Field.jsx";
import { Ring } from "../../components/ui/Ring.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { qrDataUrl } from "../../utils/qr.js";
import { copyText } from "../../services/clipboard.js";
import {
  GEOFENCE_M,
  MAX_PHOTO_BYTES,
  TOTP_STEP,
  haversineDistance,
  hostHouses,
  housesLabel,
  photoFingerprint,
  prettyDate,
  sliceAt,
  totpFor,
  verifyTotp
} from "@collabsphere/shared";
import { apiEnabled, client } from "../../services/client.js";
import { localTotpSecret } from "../../services/session-secret.js";
import { useApp } from "../../state/AppContext.jsx";
import { GeoRadar } from "./GeoRadar.jsx";
import { GateRow } from "./GateRow.jsx";

export function CheckInPanel() {
  const { events, user, ledger, selectedEventId: preferredId, handleToggleRsvp: onRsvp, handleClaimCheckIn: onClaim, notify } = useApp();
  const liveEvents = events.filter((e) => e.status === "APPROVED_LIVE");
  const [eventId, setEventId] = useState(() => {
    const pick = liveEvents.find((e) => e.id === preferredId) || liveEvents[0];
    return pick ? pick.id : "";
  });
  const [now, setNow] = useState(Date.now());
  const [enteredCode, setEnteredCode] = useState("");
  const [distanceM, setDistanceM] = useState(42);
  const [gpsSource, setGpsSource] = useState("simulated");
  const [photo, setPhoto] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [errKey, setErrKey] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [projector, setProjector] = useState(false);
  const [coords, setCoords] = useState(null); // real device position, when GPS is used
  const [serverCode, setServerCode] = useState(null); // the API's current code (server mode)
  const scanTimer = useRef(null);
  const secretRef = useRef(null);
  if (secretRef.current === null) secretRef.current = localTotpSecret();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  // Server mode: the rotating code is fetched from the API, so the secret never reaches
  // the browser. The host screen is meant to display it, so a signed-in member may read it.
  useEffect(() => {
    if (!apiEnabled() || !eventId) return;
    let alive = true;
    const pull = () =>
      client
        .eventCode(eventId)
        .then((r) => { if (alive) setServerCode(r); })
        .catch(() => {});
    pull();
    const t = setInterval(pull, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [eventId]);
  useEffect(() => () => clearTimeout(scanTimer.current), []);
  useEffect(() => {
    if (!projector) return;
    const onKey = (e) => {
      if (e.key === "Escape") setProjector(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projector]);

  const ev = liveEvents.find((e) => e.id === eventId);
  const slice = sliceAt(now);
  const code = !ev ? "" : apiEnabled() ? (serverCode ? serverCode.code : "") : totpFor(ev.id, slice, secretRef.current);
  const msLeft = TOTP_STEP * 1000 - (now % (TOTP_STEP * 1000));
  const secondsLeft = Math.ceil(msLeft / 1000);
  const qrUrl = useMemo(() => (ev && code ? qrDataUrl(`collabsphere://checkin?event=${ev.id}&code=${code}`) : null), [ev && ev.id, code]);

  if (!ev) {
    return (
      <Card>
        <EmptyState icon="shield" title="No live events to check in to">
          Once a house secretary approves a proposal in the Admin tab, it appears here.
        </EmptyState>
      </Card>
    );
  }

  const rsvped = ev.rsvps.includes(user.rollNo);
  const already = ev.checkedIn.includes(user.rollNo);
  const photoReused = photo ? ledger.some((l) => l.photoHash === photo.hash) : false;
  const currentCode = () => (apiEnabled() ? (serverCode ? serverCode.code : "") : totpFor(ev.id, sliceAt(Date.now()), secretRef.current));
  const codeMatches = (c) => (apiEnabled() ? !!code && c === code : verifyTotp(ev.id, c, Date.now(), secretRef.current));
  const eligState = already || rsvped ? "pass" : "wait";
  const codeState = !enteredCode ? "wait" : codeMatches(enteredCode) ? "pass" : "fail";
  const placeState = distanceM <= GEOFENCE_M ? "pass" : "fail";
  const photoState = !photo ? "wait" : photoReused ? "fail" : "pass";
  const allPass = rsvped && !already && codeState === "pass" && placeState === "pass" && photoState === "pass";
  const passed = already ? 4 : [rsvped, codeState === "pass", placeState === "pass", photoState === "pass"].filter(Boolean).length;

  const fail = (msg) => {
    setError(msg);
    setErrKey((k) => k + 1);
  };
  const replacePhoto = (next) =>
    setPhoto((prev) => {
      if (prev && prev.preview) {
        try {
          URL.revokeObjectURL(prev.preview);
        } catch (e) {}
      }
      return next;
    });
  const changeEvent = (id) => {
    clearTimeout(scanTimer.current);
    setScanning(false);
    setEventId(id);
    setEnteredCode("");
    replacePhoto(null);
    setReceipt(null);
    setError("");
  };

  const scanHostQr = () => {
    if (scanning) return;
    setScanning(true);
    setError("");
    scanTimer.current = setTimeout(() => {
      setEnteredCode(currentCode());
      setScanning(false);
    }, 1100);
  };
  const useStaleCode = () =>
    apiEnabled() ? setEnteredCode(code === "000000" ? "111111" : "000000") : setEnteredCode(totpFor(ev.id, sliceAt(Date.now()) - 3, secretRef.current));

  const readDeviceGps = () => {
    if (!navigator.geolocation) return fail("This browser has no GPS access.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDistanceM(Math.round(haversineDistance(pos.coords.latitude, pos.coords.longitude, ev.lat, ev.lng) * 1000));
        setGpsSource(`device GPS (±${Math.round(pos.coords.accuracy)} m)`);
        setError("");
      },
      () => fail("Location permission denied or unavailable."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  const setSimulated = (m) => {
    setCoords(null);
    setDistanceM(m);
    setGpsSource("simulated");
  };

  const onPhotoFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_PHOTO_BYTES) return fail("That photo is too large (max 6 MB). Take a smaller one.");
    try {
      const hash = await photoFingerprint(f); // hashes the image bytes, not the file name
      replacePhoto({ hash, at: new Date().toLocaleTimeString(), preview: URL.createObjectURL(f), source: "camera / upload" });
    } catch (err) {
      fail("Could not read that image.");
    }
  };
  const demoPhoto = async () => {
    const hash = await photoFingerprint(`demo|${Date.now()}|${Math.random()}`);
    replacePhoto({ hash, at: new Date().toLocaleTimeString(), preview: null, source: "simulated snapshot" });
  };

  const handleVerify = async () => {
    setError("");
    setReceipt(null);
    if (already) return fail("You have already checked in to this event.");
    if (!rsvped) return fail("RSVP to this event first, then check in.");
    if (!enteredCode) return fail("Enter or scan the live code from the host's screen.");
    if (!codeMatches(enteredCode))
      return fail("That code is wrong or has expired. Codes change every 15 seconds, so scan the host screen again.");
    if (distanceM > GEOFENCE_M) return fail(`Geofence violation: you are ${distanceM} m from ${ev.venue}. You must be within ${GEOFENCE_M} m.`);
    if (!photo) return fail("Add a venue photo first. It is hashed into the ledger as proof of presence.");
    if (photoReused) return fail("This photo was already used for an earlier check-in. Take a new one at the venue.");
    // The device position is sent to the server, which re-checks the geofence itself.
    const claimCoords = coords || { lat: ev.lat + distanceM / 111320, lng: ev.lng };
    try {
      const entry = await onClaim({ ev, distanceM, photoHash: photo.hash, code: enteredCode, lat: claimCoords.lat, lng: claimCoords.lng });
      setReceipt(entry);
      setEnteredCode("");
      replacePhoto(null);
    } catch (err) {
      /* the action already surfaced the reason as a toast */
    }
  };

  const copyHash = async (h) => {
    const ok = await copyText(h);
    notify(ok ? "Hash copied." : "Couldn't copy the hash.", ok ? "ok" : "error");
  };

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      {/* HOST SCREEN */}
      <div className="lg:col-span-2 space-y-4">
        <Card
          title="Host screen at the venue"
          right={
            <Btn size="sm" icon="maximize" onClick={() => setProjector(true)}>
              Show full screen
            </Btn>
          }
        >
          <Field label="Event" className="mb-3">
            <select value={ev.id} onChange={(e) => changeEvent(e.target.value)} className={FIELD}>
              {liveEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({housesLabel(e)})
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-col items-center rounded-2xl bg-bg/60 border border-line p-4">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`Check-in QR code, current code ${code}`}
                className="w-44 h-44 rounded-xl bg-white p-1.5"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <div className="w-44 h-44 rounded-xl bg-s2 flex items-center justify-center text-xs text-mu text-center px-4">
                The QR library did not load. Use the 6-digit code.
              </div>
            )}
            <div className="flex items-center gap-4 mt-4">
              <Ring pct={(msLeft / (TOTP_STEP * 1000)) * 100} size={52} stroke={4} color={secondsLeft <= 4 ? "rgb(var(--bad))" : "rgb(var(--pri))"}>
                <span className="text-sm font-display font-bold tabular-nums text-tx">{secondsLeft}</span>
              </Ring>
              <div>
                <div className="font-mono text-3xl font-semibold tracking-[0.22em] text-tx tabular-nums">{code}</div>
                <div className="text-[11px] text-mu">New code in {secondsLeft}s</div>
              </div>
            </div>
            <p className="text-[11px] text-mu mt-3 text-center">
              The code comes from the event and the current 15-second window, so a screenshot is useless a few seconds later.
            </p>
          </div>
          <div className="text-xs text-mu mt-3 grid gap-1.5">
            <div className="flex items-center gap-2">
              <Icon name="pin" className="w-3.5 h-3.5 shrink-0" />
              {ev.venue}
            </div>
            <div className="flex items-center gap-2">
              <Icon name="clock" className="w-3.5 h-3.5 shrink-0" />
              {prettyDate(ev.date)}
            </div>
            <div className="text-ok font-semibold">
              +{ev.xpReward} XP credited to {hostHouses(ev).join(" and ")}
            </div>
          </div>
        </Card>
      </div>

      {/* ATTENDEE */}
      <div className="lg:col-span-3 space-y-4">
        <Card
          title={`Checking in as ${user.name}`}
          right={
            <div className="flex items-center gap-3">
              {!rsvped && !already && (
                <Btn size="sm" variant="primary" icon="plus" onClick={() => onRsvp(ev.id)}>
                  RSVP now
                </Btn>
              )}
              <Ring pct={(passed / 4) * 100} size={44} stroke={4} color="rgb(var(--ok))">
                <span className="text-[11px] font-bold tabular-nums text-tx">{passed}/4</span>
              </Ring>
            </div>
          }
        >
          {already && !receipt && (
            <div className="mb-3 rounded-2xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-tx flex items-center gap-3">
              <Icon name="check" className="w-5 h-5 text-ok shrink-0" />
              You are already checked in to this event. Pick another event on the left to keep going.
            </div>
          )}

          <div className="space-y-2.5">
            <GateRow
              state={eligState}
              title="Eligibility"
              detail={already ? "You are checked in to this event." : rsvped ? "RSVP confirmed and not yet checked in." : "RSVP required before check-in."}
            >
              {!rsvped && !already && (
                <Btn size="sm" variant="primary" icon="plus" onClick={() => onRsvp(ev.id)}>
                  RSVP to this event
                </Btn>
              )}
            </GateRow>

            <GateRow
              state={codeState}
              title="Proof of time: live code"
              detail={
                codeState === "wait"
                  ? "Scan the host QR or type the 6-digit code."
                  : codeState === "pass"
                    ? "Code matches the current window."
                    : "Code is wrong or expired."
              }
            >
              {scanning && (
                <div className="relative h-24 rounded-xl border border-pri/40 bg-bg/70 overflow-hidden mb-3 flex items-center justify-center text-xs text-mu" role="status">
                  <Icon name="qr" className="w-8 h-8 text-pri/70" />
                  <span className="scan-line" />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="6-digit code"
                  aria-label="6-digit check-in code"
                  className={`${FIELD} font-mono tracking-[0.25em] tabular-nums flex-1`}
                />
                <Btn icon="qr" onClick={scanHostQr} disabled={scanning}>
                  {scanning ? "Scanning" : "Scan host QR"}
                </Btn>
              </div>
              <p className="text-[11px] text-mu mt-1.5">This demo fills the code in for you instead of opening the camera.</p>
            </GateRow>

            <GateRow state={placeState} title="Proof of place: geofence" detail={`${distanceM} m from the venue (limit ${GEOFENCE_M} m), read from ${gpsSource}.`}>
              <Btn size="sm" icon="crosshair" onClick={readDeviceGps}>
                Use my device GPS
              </Btn>
            </GateRow>

            <GateRow
              state={photoState}
              title="Proof of presence: venue photo"
              detail={!photo ? "No photo yet." : photoReused ? "This photo was already used in an earlier check-in." : `Hashed ${photo.hash} at ${photo.at}.`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 h-8 px-3 rounded-xl text-xs font-semibold bg-s2 border border-line hover:border-mu/60 cursor-pointer transition">
                  <Icon name="camera" className="w-4 h-4" />
                  Take or upload photo
                  <input type="file" accept="image/*" capture="environment" onChange={onPhotoFile} className="sr-only" />
                </label>
                <Btn size="sm" onClick={demoPhoto}>
                  Use demo snapshot
                </Btn>
                {photo && photo.preview && <img src={photo.preview} alt="Venue proof" className="w-10 h-10 object-cover rounded-lg border border-line" />}
              </div>
            </GateRow>
          </div>

          <Btn variant={allPass ? "ok" : "primary"} size="lg" icon="shield" onClick={handleVerify} className={`w-full mt-4 ${allPass ? "ready-glow" : ""}`}>
            Verify and claim +{ev.xpReward} XP
          </Btn>
          {error && (
            <div key={errKey} role="alert" className="shake mt-3 text-xs text-bad bg-bad/10 border border-bad/30 rounded-xl px-3 py-2.5">
              {error}
            </div>
          )}
        </Card>

        {receipt && (
          <section className="pop-in rounded-2xl border border-ok/50 bg-ok/10 p-4" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-ok text-bg flex items-center justify-center">
                  <Icon name="check" className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-display font-bold text-tx">Check-in verified</div>
                  <div className="text-xs text-mu">Ledger entry #{receipt.idx}</div>
                </div>
              </div>
              <span className="font-display font-bold text-2xl text-ok">+{receipt.xp} XP</span>
            </div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-mu">Event</dt>
              <dd className="text-tx">{receipt.eventTitle}</dd>
              <dt className="text-mu">Student</dt>
              <dd className="text-tx">
                {receipt.name} ({receipt.rollNo})
              </dd>
              <dt className="text-mu">Credited</dt>
              <dd className="text-tx">{receipt.houses.join(" and ")}</dd>
              <dt className="text-mu">Distance</dt>
              <dd className="text-tx">{receipt.distanceM} m from the venue</dd>
              <dt className="text-mu">Photo hash</dt>
              <dd className="font-mono text-tx">{receipt.photoHash}</dd>
              <dt className="text-mu">Entry hash</dt>
              <dd className="flex items-start gap-2 min-w-0">
                <span className="font-mono text-tx break-all">{receipt.hash}</span>
                <button
                  type="button"
                  onClick={() => copyHash(receipt.hash)}
                  className="shrink-0 w-6 h-6 rounded-md text-mu hover:text-tx hover:bg-s2 flex items-center justify-center"
                  aria-label="Copy entry hash"
                >
                  <Icon name="copy" className="w-3.5 h-3.5" />
                </button>
              </dd>
            </dl>
          </section>
        )}

        <Card
          title="Rehearsal controls"
          right={<Badge tone="pri">Not in production</Badge>}
        >
          <p className="text-xs text-mu mb-3">A real app reads GPS from the device only. These controls let you rehearse each failure case on stage.</p>
          <div className="flex flex-wrap items-center gap-5">
            <GeoRadar distanceM={distanceM} limit={GEOFENCE_M} onChange={setSimulated} />
            <div className="flex-1 min-w-[200px] space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-mu">
                  <span>Distance from venue</span>
                  <span className="font-semibold text-tx">{distanceM} m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="10"
                  value={distanceM}
                  onChange={(e) => setSimulated(Number(e.target.value))}
                  className="w-full"
                  aria-label="Simulated distance from the venue in metres"
                />
                <p className="text-[11px] text-mu">Drag the dot on the radar or use the slider.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn size="sm" onClick={() => setSimulated(42)}>
                  At venue (42 m)
                </Btn>
                <Btn size="sm" onClick={() => setSimulated(4200)}>
                  Spoofed (4,200 m)
                </Btn>
                <Btn size="sm" onClick={useStaleCode}>
                  Enter an expired code
                </Btn>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* FULL-SCREEN HOST DISPLAY */}
      {projector && (
        <div
          className="fixed inset-0 z-[900] bg-bg flex flex-col items-center justify-center p-6 text-center cursor-pointer"
          onClick={() => setProjector(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Host check-in display"
        >
          <div className="font-display font-bold text-2xl sm:text-4xl text-tx max-w-3xl">{ev.title}</div>
          <div className="text-mu mt-1">{housesLabel(ev)}</div>
          {qrUrl && (
            <img
              src={qrUrl}
              alt={`Check-in QR code, current code ${code}`}
              className="mt-6 rounded-2xl bg-white p-3"
              style={{ width: "min(56vh, 80vw)", height: "min(56vh, 80vw)", imageRendering: "pixelated" }}
            />
          )}
          <div className="font-mono text-5xl sm:text-7xl font-semibold tracking-[0.2em] text-tx mt-6 tabular-nums">{code}</div>
          <div className="w-full max-w-md h-1.5 rounded-full bg-line mt-5 overflow-hidden">
            <div className="h-full bg-pri" style={{ width: `${(msLeft / (TOTP_STEP * 1000)) * 100}%`, transition: "width .5s linear" }} />
          </div>
          <div className="text-xs text-mu mt-3">New code in {secondsLeft}s. Press Esc or click anywhere to close.</div>
        </div>
      )}
    </div>
  );
}
