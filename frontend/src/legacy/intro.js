// Intro overlay: 3D globe hero + login/sign-up gate.
// Extracted verbatim from the original file. Creates window.__csGate, which main.jsx
// awaits before mounting the React app.
//
// Auth differs by mode. In server mode (VITE_USE_API=1) credentials are checked by the
// API and the browser only stores an opaque session token. In offline mode accounts are
// kept in this browser, but passwords are now PBKDF2-HMAC-SHA256 with a per-account
// random salt (no plaintext, no fast hash, and no silent fallback if WebCrypto is
// unavailable).

import { apiEnabled, client, setToken } from "../services/client.js";

(function () {
  var apiMode = apiEnabled();
  var root = document.getElementById("cs-intro"); if (!root) return;
  var gateRes; window.__csGate = new Promise(function (r) { gateRes = r; });
  try {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, de = document.documentElement, i;
  de.style.overflow = "hidden";
  var stage = 0, lock = false, cur = 0, hover = false, ix = 0, iy = 0, mx = 0, my = 0, k = 0, rot;

  // carousel
  var CARDS = [
    ["Discover", "2", "Find co-working, joint and regional meetups on a live map near you.", "#4a8bff88"],
    ["Host", "3", "Propose an event with another house. It goes live when both sign off.", "#a56bff88"],
    ["Check in", "4", "GPS and code verified attendance that earns XP for every host house.", "#17c3b288"],
    ["Ledger", "5", "House leaderboards on a hash-chained, tamper-evident record.", "#ff6fae88"],
    ["Home", "1", "Your member pass, level, XP and announcements in one place.", "#ffb14a77"]
  ], n = CARDS.length, car = root.querySelector(".car");
  var PV = ["<svg viewBox=\"0 0 174 96\" aria-hidden=\"true\"><rect width=\"174\" height=\"96\" rx=\"14\" fill=\"rgba(6,9,28,.5)\" stroke=\"rgba(255,255,255,.18)\"/><path d=\"M0 24H174M0 48H174M0 72H174M43 0V96M87 0V96M131 0V96\" stroke=\"rgba(255,255,255,.07)\"/><path d=\"M-4 72C30 64 44 40 78 42S130 20 178 14\" fill=\"none\" stroke=\"rgba(120,190,255,.42)\" stroke-width=\"7\" stroke-linecap=\"round\"/><circle cx=\"92\" cy=\"52\" r=\"34\" fill=\"rgba(143,197,255,.07)\" stroke=\"#8fc5ff\" stroke-opacity=\".85\" stroke-dasharray=\"4 5\"/><circle cx=\"92\" cy=\"52\" r=\"3.5\" fill=\"#fff\"/><circle class=\"pu\" cx=\"110\" cy=\"38\" r=\"11\" fill=\"none\" stroke=\"#ff7a59\"/><circle cx=\"110\" cy=\"38\" r=\"9\" fill=\"#06091c\" stroke=\"#ff7a59\" stroke-width=\"2.5\"/><text x=\"110\" y=\"41\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"8\" font-weight=\"700\" fill=\"#fff\" text-anchor=\"middle\">+50</text><circle cx=\"74\" cy=\"64\" r=\"7\" fill=\"#06091c\" stroke=\"#3be3c4\" stroke-width=\"2.5\"/><text x=\"74\" y=\"67\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"8\" font-weight=\"700\" fill=\"#fff\" text-anchor=\"middle\">A</text><circle cx=\"130\" cy=\"66\" r=\"6\" fill=\"#06091c\" stroke=\"#4aa3ff\" stroke-width=\"2.5\"/><circle cx=\"130\" cy=\"66\" r=\"2\" fill=\"#4aa3ff\"/></svg>", "<svg viewBox=\"0 0 174 96\" aria-hidden=\"true\"><rect width=\"174\" height=\"96\" rx=\"14\" fill=\"rgba(6,9,28,.5)\" stroke=\"rgba(255,255,255,.18)\"/><circle cx=\"66\" cy=\"34\" r=\"19\" fill=\"#ff7a59\" fill-opacity=\".85\"/><circle cx=\"108\" cy=\"34\" r=\"19\" fill=\"#3be3c4\" fill-opacity=\".8\"/><text x=\"66\" y=\"39\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"14\" font-weight=\"800\" fill=\"#fff\" text-anchor=\"middle\">B</text><text x=\"108\" y=\"39\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"14\" font-weight=\"800\" fill=\"#04102a\" text-anchor=\"middle\">S</text><circle cx=\"80\" cy=\"53\" r=\"8\" fill=\"#56e2a8\" stroke=\"#06091c\" stroke-width=\"2\"/><path d=\"M76.5 53l2.6 2.6 4.6-5\" fill=\"none\" stroke=\"#04102a\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"98\" cy=\"53\" r=\"8\" fill=\"#2a3170\" stroke=\"#06091c\" stroke-width=\"2\"/><circle cx=\"98\" cy=\"53\" r=\"4\" fill=\"none\" stroke=\"#cfd8ff\" stroke-width=\"1.4\"/><path d=\"M98 50.6V53l1.8 1\" fill=\"none\" stroke=\"#cfd8ff\" stroke-width=\"1.4\" stroke-linecap=\"round\"/><rect x=\"20\" y=\"68\" width=\"134\" height=\"6\" rx=\"3\" fill=\"rgba(255,255,255,.16)\"/><rect x=\"20\" y=\"68\" width=\"67\" height=\"6\" rx=\"3\" fill=\"#56e2a8\"/><text x=\"87\" y=\"88\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"9\" fill=\"rgba(235,240,255,.8)\" text-anchor=\"middle\">1 of 2 houses approved</text></svg>", "<svg viewBox=\"0 0 174 96\" aria-hidden=\"true\"><rect width=\"174\" height=\"96\" rx=\"14\" fill=\"rgba(6,9,28,.5)\" stroke=\"rgba(255,255,255,.18)\"/><path d=\"M35 15h6v6h-6zM42 15h6v6h-6zM35 22h6v6h-6zM49 22h6v6h-6zM35 29h6v6h-6zM49 29h6v6h-6zM14 36h6v6h-6zM21 36h6v6h-6zM28 36h6v6h-6zM35 36h6v6h-6zM49 36h6v6h-6zM56 36h6v6h-6zM21 43h6v6h-6zM35 43h6v6h-6zM49 43h6v6h-6zM56 43h6v6h-6zM63 43h6v6h-6zM70 43h6v6h-6zM21 50h6v6h-6zM42 50h6v6h-6zM56 50h6v6h-6zM63 50h6v6h-6zM70 50h6v6h-6zM42 57h6v6h-6zM49 57h6v6h-6zM63 57h6v6h-6zM70 57h6v6h-6zM49 64h6v6h-6zM42 71h6v6h-6zM56 71h6v6h-6zM63 71h6v6h-6z\" fill=\"rgba(255,255,255,.92)\"/><rect x=\"14.75\" y=\"15.75\" width=\"19.5\" height=\"19.5\" rx=\"3\" fill=\"none\" stroke=\"#fff\" stroke-width=\"1.5\"/><rect x=\"21\" y=\"22\" width=\"7\" height=\"7\" rx=\"1.5\" fill=\"#fff\"/><rect x=\"56.75\" y=\"15.75\" width=\"19.5\" height=\"19.5\" rx=\"3\" fill=\"none\" stroke=\"#fff\" stroke-width=\"1.5\"/><rect x=\"63\" y=\"22\" width=\"7\" height=\"7\" rx=\"1.5\" fill=\"#fff\"/><rect x=\"14.75\" y=\"57.75\" width=\"19.5\" height=\"19.5\" rx=\"3\" fill=\"none\" stroke=\"#fff\" stroke-width=\"1.5\"/><rect x=\"21\" y=\"64\" width=\"7\" height=\"7\" rx=\"1.5\" fill=\"#fff\"/><rect class=\"sc\" x=\"10\" y=\"14\" width=\"71\" height=\"2\" rx=\"1\" fill=\"#56e2a8\"/><text x=\"130\" y=\"26\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"8\" fill=\"rgba(235,240,255,.7)\" text-anchor=\"middle\">Rotating code</text><text x=\"130\" y=\"44\" font-family=\"JetBrains Mono,ui-monospace,monospace\" font-size=\"13\" font-weight=\"600\" fill=\"#fff\" text-anchor=\"middle\">482 913</text><rect x=\"102\" y=\"52\" width=\"56\" height=\"4\" rx=\"2\" fill=\"rgba(255,255,255,.16)\"/><rect x=\"102\" y=\"52\" width=\"34\" height=\"4\" rx=\"2\" fill=\"#8fd0ff\"/><rect x=\"102\" y=\"64\" width=\"56\" height=\"18\" rx=\"9\" fill=\"rgba(86,226,168,.2)\" stroke=\"#56e2a8\" stroke-opacity=\".7\"/><text x=\"130\" y=\"76\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"9\" font-weight=\"700\" fill=\"#7cf0c2\" text-anchor=\"middle\">Within 150 m</text></svg>", "<svg viewBox=\"0 0 174 96\" aria-hidden=\"true\"><rect width=\"174\" height=\"96\" rx=\"14\" fill=\"rgba(6,9,28,.5)\" stroke=\"rgba(255,255,255,.18)\"/><rect x=\"10\" y=\"8\" width=\"46\" height=\"30\" rx=\"7\" fill=\"rgba(255,255,255,.1)\" stroke=\"rgba(255,255,255,.35)\"/><text x=\"33\" y=\"21\" font-family=\"JetBrains Mono,ui-monospace,monospace\" font-size=\"8\" font-weight=\"600\" fill=\"#ffd0e6\" text-anchor=\"middle\">#9c4e</text><text x=\"33\" y=\"32\" font-family=\"JetBrains Mono,ui-monospace,monospace\" font-size=\"6\" fill=\"rgba(255,255,255,.55)\" text-anchor=\"middle\">prev 71ab</text><rect x=\"64\" y=\"8\" width=\"46\" height=\"30\" rx=\"7\" fill=\"rgba(255,255,255,.1)\" stroke=\"rgba(255,255,255,.35)\"/><text x=\"87\" y=\"21\" font-family=\"JetBrains Mono,ui-monospace,monospace\" font-size=\"8\" font-weight=\"600\" fill=\"#ffd0e6\" text-anchor=\"middle\">#b13f</text><text x=\"87\" y=\"32\" font-family=\"JetBrains Mono,ui-monospace,monospace\" font-size=\"6\" fill=\"rgba(255,255,255,.55)\" text-anchor=\"middle\">prev 9c4e</text><rect x=\"118\" y=\"8\" width=\"46\" height=\"30\" rx=\"7\" fill=\"rgba(255,255,255,.1)\" stroke=\"rgba(255,255,255,.35)\"/><text x=\"141\" y=\"21\" font-family=\"JetBrains Mono,ui-monospace,monospace\" font-size=\"8\" font-weight=\"600\" fill=\"#ffd0e6\" text-anchor=\"middle\">#e07d</text><text x=\"141\" y=\"32\" font-family=\"JetBrains Mono,ui-monospace,monospace\" font-size=\"6\" fill=\"rgba(255,255,255,.55)\" text-anchor=\"middle\">prev b13f</text><path d=\"M56 23h8M110 23h8\" stroke=\"#ff9ac8\" stroke-width=\"2\" stroke-linecap=\"round\"/><circle cx=\"20\" cy=\"54\" r=\"3\" fill=\"#3be3c4\"/><rect x=\"30\" y=\"51\" width=\"124\" height=\"6\" rx=\"3\" fill=\"rgba(255,255,255,.14)\"/><rect x=\"30\" y=\"51\" width=\"100\" height=\"6\" rx=\"3\" fill=\"#3be3c4\"/><circle cx=\"20\" cy=\"66\" r=\"3\" fill=\"#ff7a59\"/><rect x=\"30\" y=\"63\" width=\"124\" height=\"6\" rx=\"3\" fill=\"rgba(255,255,255,.14)\"/><rect x=\"30\" y=\"63\" width=\"76\" height=\"6\" rx=\"3\" fill=\"#ff7a59\"/><circle cx=\"20\" cy=\"78\" r=\"3\" fill=\"#a56bff\"/><rect x=\"30\" y=\"75\" width=\"124\" height=\"6\" rx=\"3\" fill=\"rgba(255,255,255,.14)\"/><rect x=\"30\" y=\"75\" width=\"48\" height=\"6\" rx=\"3\" fill=\"#a56bff\"/></svg>", "<svg viewBox=\"0 0 174 96\" aria-hidden=\"true\"><rect width=\"174\" height=\"96\" rx=\"14\" fill=\"rgba(6,9,28,.5)\" stroke=\"rgba(255,255,255,.18)\"/><circle cx=\"38\" cy=\"34\" r=\"22\" fill=\"none\" stroke=\"rgba(255,255,255,.18)\" stroke-width=\"5\"/><circle cx=\"38\" cy=\"34\" r=\"22\" fill=\"none\" stroke=\"#ffcf6b\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-dasharray=\"97 138\" transform=\"rotate(-90 38 34)\"/><circle cx=\"38\" cy=\"34\" r=\"15\" fill=\"#ff7a59\"/><text x=\"38\" y=\"39\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"14\" font-weight=\"800\" fill=\"#fff\" text-anchor=\"middle\">B</text><text x=\"74\" y=\"24\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"9\" fill=\"rgba(235,240,255,.7)\">Bandipur member</text><text x=\"74\" y=\"40\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"13\" font-weight=\"800\" fill=\"#fff\">Explorer</text><text x=\"74\" y=\"54\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"9\" font-weight=\"700\" fill=\"#56e2a8\">210 XP</text><rect x=\"14\" y=\"70\" width=\"146\" height=\"18\" rx=\"9\" fill=\"rgba(255,255,255,.1)\" stroke=\"rgba(255,255,255,.22)\"/><circle cx=\"26\" cy=\"79\" r=\"3.5\" fill=\"#ffb14a\"/><text x=\"35\" y=\"82\" font-family=\"Figtree,system-ui,sans-serif\" font-size=\"8.5\" fill=\"rgba(240,244,255,.9)\">New: Kanpur Algorithm Jam</text></svg>"];
  car.innerHTML = CARDS.map(function (c, j) { return '<button class="cd" data-k="' + c[1] + '" style="--c:' + c[3] + '"><em>0' + (j + 1) + "</em><s>&nearr;</s><span class=\"pv\">" + PV[j] + "</span><b>" + c[0] + "</b><small>" + c[2] + "</small></button>"; }).join("");
  var cds = car.children;
  function layout() {
    var sp = Math.min(215, innerWidth * .2);
    for (var j = 0; j < n; j++) {
      var d = ((j - cur) % n + n) % n; if (d > n / 2) d -= n; var ad = Math.abs(d), el = cds[j];
      el.style.transform = "translateX(" + d * sp + "px) translateZ(" + -ad * 150 + "px) rotateY(" + -d * 24 + "deg) scale(" + (d === 0 ? 1.08 : .92) + ")";
      el.style.opacity = ad > 2 ? 0 : 1 - ad * .26; el.style.zIndex = 10 - ad;
    }
  }
  layout(); addEventListener("resize", layout);
  car.addEventListener("mouseenter", function () { hover = true; });
  car.addEventListener("mouseleave", function () { hover = false; });
  if (!reduce) rot = setInterval(function () { if (!hover && stage === 1) { cur = (cur + 1) % n; layout(); } }, 3200);

  // scene switching: wheel, swipe, keys, buttons
  function go(v) { if (v === stage || lock) return; stage = v; lock = true; root.classList.toggle("st1", !!v); setTimeout(function () { lock = false; }, 1100); }
  root.addEventListener("wheel", function (e) { if (auth) return; e.preventDefault(); if (Math.abs(e.deltaY) > 8) go(e.deltaY > 0 ? 1 : 0); }, { passive: false });
  var ty = 0;
  root.addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; }, { passive: true });
  root.addEventListener("touchend", function (e) { if (auth) return; var d = ty - e.changedTouches[0].clientY; if (Math.abs(d) > 40) go(d > 0 ? 1 : 0); }, { passive: true });
  function onKey(e) {
    if (!root.isConnected) return removeEventListener("keydown", onKey);
    if (auth) { if (e.key === "Escape") back(); return; }
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(0); }
    else if (e.key === "ArrowRight") { cur = (cur + 1) % n; layout(); }
    else if (e.key === "ArrowLeft") { cur = (cur + n - 1) % n; layout(); }
    else if (e.key === "Escape") toAuth("1");
  }
  addEventListener("keydown", onKey);
  var gv = [0, 0, 1, 0, 0], zc = document.getElementById("zc");
  root.addEventListener("pointermove", function (e) {
    ix = e.clientX / innerWidth - .5; iy = e.clientY / innerHeight - .5;
    var gx = (e.clientX - gv[0]) / gv[2], gy = (gv[1] - e.clientY) / gv[2], d2 = gx * gx + gy * gy;
    if (d2 > 1 || stage) { zc.textContent = "\u2014"; return; }
    var gz = Math.sqrt(1 - d2), cb = Math.cos(gv[4]), sb = Math.sin(gv[4]), ca = Math.cos(gv[3]), sa = Math.sin(gv[3]),
      y0 = gy * cb + gz * sb, z1 = -gy * sb + gz * cb, x0 = gx * ca + z1 * sa, z0 = -gx * sa + z1 * ca, la = Math.asin(y0) * 180 / Math.PI, lo = Math.atan2(x0, z0) * 180 / Math.PI;
    zc.textContent = Math.abs(la).toFixed(2) + "\u00b0" + (la >= 0 ? "N" : "S") + " " + Math.abs(lo).toFixed(2) + "\u00b0" + (lo >= 0 ? "E" : "W");
  });

  // login / sign up sits between the intro and the app (prototype: accounts live in this browser)
  var auth = false, want = "1", mode = "in", LS = "collabsphere_v3_", za = document.getElementById("za"), ze = document.getElementById("ze"), zf = document.getElementById("zf");
  function jget(n) { try { return JSON.parse(localStorage.getItem(LS + n)); } catch (e) { return null; } }
  function jset(n, v) { try { localStorage.setItem(LS + n, JSON.stringify(v)); } catch (e) {} }
  // Offline-mode credential hashing: PBKDF2-HMAC-SHA256, per-account random salt.
  // Fails closed when WebCrypto is missing (no weak hash fallback).
  var PBKDF2_ITERS = 210000;
  function toHex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function newSalt() { var b = new Uint8Array(16); crypto.getRandomValues(b); return toHex(b); }
  function hasCrypto() { return !!(window.crypto && crypto.subtle && crypto.subtle.importKey); }
  function pbkdf2(pw, salt, iters) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"])
      .then(function (key) { return crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: iters, hash: "SHA-256" }, key, 256); })
      .then(toHex);
  }
  function showAuth() { auth = true; lock = false; stage = 0; root.classList.remove("st1"); root.classList.add("au"); setMode(mode); setTimeout(function () { var f = zf.elements[mode === "up" ? "fn" : "roll"]; if (auth && f) f.focus(); }, 1000); }
  function bad(msg, ok) { ze.textContent = msg; ze.className = ok ? "err ok" : "err"; }
  function good(msg) { ze.textContent = msg; ze.className = "err ok"; }
  function setMode(m) {
    mode = m; za.className = "au-card mode-" + m; ze.textContent = ""; ze.className = "err";
    za.querySelector("h3").innerHTML = m === "in" ? "Welcome <em>back</em>" : "Create your <em>account</em>";
    za.querySelector(".sub").textContent = m === "in" ? "Log in with your IITM BS roll number to pick up where you left off." : "Pick your house and start earning XP on cross-house meetups.";
    document.getElementById("zsub").innerHTML = m === "in" ? "Log in &rarr;" : "Create account &rarr;";
    zf.elements.pw.autocomplete = m === "in" ? "current-password" : "new-password";
    Array.prototype.forEach.call(za.querySelectorAll(".tabs button"), function (b) { b.classList.toggle("on", b.dataset.t === m); });
  }
  function toAuth(key) {
    want = key || "1";
    if (apiMode) {
      var tok = null; try { tok = sessionStorage.getItem("cs_session"); } catch (e) {}
      if (tok) {
        // A token is only trusted if the server still recognises it.
        client.me()
          .then(function (u) { if (u && u.rollNo) { jset("user", u); enter(want); } else showAuth(); })
          .catch(function () { try { sessionStorage.removeItem("cs_session"); } catch (e) {} showAuth(); });
        return;
      }
      return showAuth();
    }
    var ok = null; try { ok = sessionStorage.getItem("cs_session"); } catch (e) {}
    if (ok) return enter(want);
    showAuth();
  }
  function back() { auth = false; root.classList.remove("au"); }
  function finishSession(u) { jset("user", u); good("Welcome, " + u.name.split(" ")[0] + ". Opening CollabSphere\u2026"); setTimeout(function () { enter(want); }, 700); }
  zf.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = zf.elements.fn.value.trim(), roll = zf.elements.roll.value.trim().toLowerCase(), house = zf.elements.house.value, pw = zf.elements.pw.value;
    if (!/^\d{2}[a-z]\d{5,8}$/.test(roll)) return bad("Enter your roll number, like 24f200142.");
    if (mode === "up") { if (name.length < 2) return bad("Enter your full name."); if (!house) return bad("Choose your house."); }
    if (pw.length < 8) return bad("Password needs at least 8 characters.");

    if (apiMode) {
      var call = mode === "up" ? client.signup({ name: name, rollNo: roll, house: house, password: pw }) : client.login({ rollNo: roll, password: pw });
      call.then(function (res) { setToken(res.token); finishSession(res.user); })
        .catch(function (err) { bad(err && err.message ? err.message : "Could not sign in."); });
      return;
    }

    if (!hasCrypto()) return bad("This browser cannot store passwords securely. Open the app over localhost or https.");
    var acc = jget("accounts") || {}, a = acc[roll];
    var work = mode === "up"
      ? (a ? Promise.reject({ message: "That roll number already has an account. Log in instead." })
          : (function () {
              var salt = newSalt();
              return pbkdf2(pw, salt, PBKDF2_ITERS).then(function (hash) {
                acc[roll] = { name: name, house: house, pw: { salt: salt, iters: PBKDF2_ITERS, hash: hash } };
                jset("accounts", acc);
                return { name: name, house: house };
              });
            })())
      : (!a || !a.pw ? Promise.reject({ message: "Roll number or password is incorrect." })
          : pbkdf2(pw, a.pw.salt, a.pw.iters).then(function (hash) {
              if (hash !== a.pw.hash) throw { message: "Roll number or password is incorrect." };
              return { name: a.name, house: a.house };
            }));
    work.then(function (who) {
      var cur = jget("user"), prev = cur && cur.rollNo === roll;
      setToken("local:" + roll);
      finishSession({ rollNo: roll, name: who.name, house: who.house, xp: prev ? cur.xp : 0 });
    }).catch(function (err) { bad(err && err.message ? err.message : "Could not sign in."); });
  });

  // leave the intro; open the chosen tab once the app has mounted
  function enter(key) {
    gateRes();
    root.classList.add("out"); de.style.overflow = ""; clearInterval(rot);
    setTimeout(function () { root.remove(); }, 1200);
    if (key && key !== "1") {
      var t = 0, w = setInterval(function () {
        if (document.querySelector(".aurora")) { clearInterval(w); setTimeout(function () { dispatchEvent(new KeyboardEvent("keydown", { key: key })); }, 150); }
        else if (++t > 150) clearInterval(w);
      }, 100);
    }
  }
  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-k],[data-go],[data-t],[data-eye],[data-guest],[data-back]"); if (!b) return;
    var d = b.dataset;
    if (d.go) go(+d.go); else if (d.t) setMode(d.t); else if (d.back !== undefined) back();
    else if (d.guest !== undefined) {
      if (apiMode) {
        bad("Starting a guest session\u2026");
        client.guest({ house: "Bandipur" })
          .then(function (res) { setToken(res.token); jset("user", res.user); enter(want); })
          .catch(function (err) { bad(err && err.message ? err.message : "Could not start a guest session."); });
      } else enter(want);
    }
    else if (d.eye !== undefined) { var p = zf.elements.pw; p.type = p.type === "password" ? "text" : "password"; b.textContent = p.type === "password" ? "Show" : "Hide"; }
    else if (d.k) toAuth(d.k);
  });

  // 3D globe: continents as dots, graticule, lighting, orbit rings, city nodes and route pulses
  var cv = root.querySelector("canvas"), c = cv.getContext("2d"), W, H, D = Math.min(devicePixelRatio || 1, 2);
  var zs = document.getElementById("zs"), zr = document.getElementById("zr");
  function place() {
    var cx0 = W * .69, cy0 = H * .58, r0 = Math.min(W * .3, H * .4), hr = root.querySelector(".hero").getBoundingClientRect().right;
    zs.style.left = (cx0 + r0 * .78) + "px"; zs.style.top = (cy0 - r0 * .85) + "px"; zs.style.visibility = cx0 + r0 * .78 + 236 > W - 12 ? "hidden" : "";
    zr.style.left = (cx0 - r0 * 1.28) + "px"; zr.style.top = (cy0 + r0 * .5) + "px"; zr.style.visibility = cx0 - r0 * 1.28 < hr + 16 ? "hidden" : "";
  }
  function rs() { W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; if (cv2) { cv2.width = W * D; cv2.height = H * D; } if (gl) rg(); place(); } rs(); addEventListener("resize", rs); setTimeout(place, 700);
  var PI = Math.PI, ST = [];
  for (i = 0; i < 90; i++) ST.push([Math.random(), Math.random(), Math.random() * 6]);
  // coarse coastlines, [lat,lng,...]
  var LAND = [
    [65,-168,68,-163,71,-156,70,-145,69,-135,69,-125,68,-110,70,-98,68,-90,64,-90,59,-94,55,-85,52,-82,52,-79,55,-77,58,-78,62,-78,60,-70,58,-62,53,-56,47,-53,46,-60,44,-66,42,-70,38,-75,35,-76,32,-80,28,-80,25,-80,25,-82,30,-85,30,-89,29,-94,26,-97,22,-98,19,-96,18,-92,21,-90,21,-87,16,-88,15,-83,11,-83,9,-82,9,-79,8,-77,8,-83,13,-91,16,-95,17,-101,20,-105,23,-106,26,-109,31,-114,28,-113,23,-110,32,-117,35,-121,38,-123,43,-124.5,48,-124.5,54,-130,58,-136,60,-145,60,-150,56,-158,55,-162,60,-165,63,-165],
    [83,-35,80,-20,70,-22,60,-43,62,-50,70,-55,76,-70,82,-60],
    [12,-72,11,-62,8,-60,5,-52,0,-50,-5,-35,-9,-35,-13,-38,-23,-41,-28,-48,-35,-54,-39,-58,-41,-63,-46,-67,-52,-69,-55,-68,-54,-72,-47,-75,-40,-73,-30,-71,-18,-70,-15,-76,-6,-81,-2,-80,3,-78,8,-77,11,-74],
    [36,-6,37,10,33,12,31,20,32,30,30,32,22,37,15,40,12,43,11,51,2,46,-4,40,-10,40,-16,40,-25,35,-34,26,-34,19,-29,16,-18,12,-12,14,-5,12,4,9,5,-2,5,-8,9,-13,14,-17,21,-17,28,-12,33,-8],
    [37,-9,43,-9,44,-1,48,-5,51,2,54,8,57,8,62,5,70,20,71,28,69,33,67,41,68,60,72,70,76,95,77,105,73,113,71,130,70,140,69,170,66,180,62,175,59,163,52,156,59,150,54,138,49,141,43,132,40,129,35,129,38,127,35,126,39,125,40,122,38,118,35,119,31,122,27,120,22,114,21,108,16,108,10,107,9,105,13,100,8,100,2,104,6,100,8,98,16,97,20,94,22,91,21,87,16,82,13,80,8,77,10,76,15,74,20,72.5,23,69,25,66,25,57,27,56,30,48,24,51,24,56,22,59,17,55,13,45,17,41,22,38,28,34,30,33,31,34,36,36,37,30,36,27,40,26,37,23,36,22,39,20,41,19,45,13,42,14,40,18,38,16,38,15,41,12,44,9,43,3,41,1,37,-1,36,-5],
    [50,-5,51,1,53,0,55,-2,58,-3,58,-6,55,-5,53,-4], [52,-10,55,-8,54,-6,52,-6], [31,131,34,135,37,137,41,140,44,145,42,143,35,140,33,132],
    [5,95,1,98,-5,105,-6,103,0,96], [7,117,1,119,-4,116,1,110,5,114], [-6,106,-6,112,-8,114,-8,108], [-2,132,-3,141,-9,148,-9,141,-4,135],
    [9.5,80,6,80,7,82], [-12,49,-25,47,-22,43,-16,44], [-35,174,-41,176,-47,167,-41,172], [66,-24,66,-14,64,-14,63,-20],
    [-11,132,-12,142,-18,146,-25,153,-33,152,-38,146,-38,140,-35,136,-32,133,-32,125,-35,117,-26,113,-22,114,-17,122,-14,127]
  ], SEAS = [[41,28,46,30,46,37,42,41,41,35], [37,54,40,50,43,47,47,50,46,53,41,54]];
  // real Earth: satellite texture on a WebGL sphere, lit from the upper left, with clouds and an atmosphere rim.
  // The 2D layers sit behind (stars, glow, rings) and in front (routes, cities, labels) of it.
  var B = c, F, cv2 = document.createElement("canvas"), glc = document.createElement("canvas"), gl = null, cam, mesh, mat, scene;
  cv.after(glc); glc.after(cv2); F = cv2.getContext("2d");
  function drawEarth() { // offline fallback: a coloured map drawn from the coastlines above
    var cn = document.createElement("canvas"); cn.width = 1024; cn.height = 512; var g = cn.getContext("2d");
    function P(p, f) { g.beginPath(); for (var u = 0; u < p.length; u += 2) { var X = (p[u + 1] + 180) / 360 * 1024, Y = (90 - p[u]) / 180 * 512; u ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.closePath(); g.fillStyle = f; g.fill(); }
    var o = g.createLinearGradient(0, 0, 0, 512); o.addColorStop(0, "#0b3563"); o.addColorStop(.5, "#0e5896"); o.addColorStop(1, "#0b3563"); g.fillStyle = o; g.fillRect(0, 0, 1024, 512);
    var l = g.createLinearGradient(0, 0, 0, 512);
    [[0, "#e6edf0"], [.09, "#cfd9d2"], [.15, "#7f9a7e"], [.26, "#4a8546"], [.33, "#b4a15e"], [.41, "#7f9748"], [.47, "#2c7a38"], [.53, "#2c7a38"], [.6, "#a99a58"], [.7, "#5a8c4a"], [.82, "#8da58f"], [.9, "#e6edf0"]].forEach(function (s) { l.addColorStop(s[0], s[1]); });
    g.shadowColor = "rgba(90,210,235,.85)"; g.shadowBlur = 12; LAND.forEach(function (p) { P(p, l); }); g.shadowBlur = 0; SEAS.forEach(function (p) { P(p, "#0e5290"); });
    g.fillStyle = "#f2f6fa"; g.fillRect(0, 512 * 160 / 180, 1024, 512); g.fillStyle = "rgba(235,242,248,.85)"; g.fillRect(0, 0, 1024, 512 * 12 / 180);
    return cn;
  }
  function rg() { gl.setSize(W, H, false); cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2; cam.updateProjectionMatrix(); }
  try {
    gl = new THREE.WebGLRenderer({ canvas: glc, alpha: true, antialias: true }); gl.setPixelRatio(D); gl.setClearColor(0, 0);
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 8000); cam.position.z = 4000;
    mat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: new THREE.CanvasTexture(drawEarth()) }, t: { value: 0 }, dim: { value: 1 } },
      vertexShader: "varying vec2 vUv;varying vec3 vN;varying vec3 vP;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: [
        "precision highp float;uniform sampler2D tex;uniform float t;uniform float dim;varying vec2 vUv;varying vec3 vN;varying vec3 vP;",
        "float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}",
        "float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}",
        "void main(){vec3 N=normalize(vN);float l=dot(N,normalize(vec3(-.5,.45,.75)));float day=smoothstep(-.12,.42,l);",
        "vec3 c=texture2D(tex,vUv).rgb*1.18;",
        "vec3 q=vP*3.4+vec3(t*.02,0.,t*.012);float f=n(q)*.55+n(q*2.1)*.3+n(q*4.4)*.15;c=mix(c,vec3(1.),smoothstep(.52,.8,f)*.7);",
        "c*=.13+.95*day;c+=vec3(.01,.025,.06)*(1.-day);",
        "c+=vec3(.9,.45,.15)*smoothstep(-.02,.12,l)*(1.-smoothstep(.12,.32,l))*.1;",
        "c+=vec3(.25,.55,1.)*pow(1.-max(N.z,0.),2.6)*(.5+.6*day);",
        "gl_FragColor=vec4(c*dim,1.);}"
      ].join("")
    });
    mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mat); scene = new THREE.Scene(); scene.add(mesh); rg();
    var URLS = ["https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg", "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"];
    (function tryLoad(u) {
      if (u >= URLS.length) return;
      new THREE.TextureLoader().setCrossOrigin("anonymous").load(URLS[u], function (tx) { mat.uniforms.tex.value = tx; document.getElementById("zl").textContent = "Satellite 2K"; }, undefined, function () { tryLoad(u + 1); });
    })(0);
  } catch (err) { gl = null; }
  rs();
  function V(la, lo) { la *= PI / 180; lo *= PI / 180; return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]; }
  function R(v, a, b) { var x = v[0] * Math.cos(a) - v[2] * Math.sin(a), z = v[0] * Math.sin(a) + v[2] * Math.cos(a); return [x, v[1] * Math.cos(b) - z * Math.sin(b), v[1] * Math.sin(b) + z * Math.cos(b)]; }
  var ACT = { 0: 1, 1: 1, 3: 1, 4: 1 }; // cities that are live in the app
  // [name, lat, lng, label dx, dy, align]
  var CT = [["Kanpur", 26.45, 80.35, 14, -6, "left"], ["Delhi", 28.6, 77.2, -10, -8, "right"], ["Mumbai", 19.08, 72.88, -10, 4, "right"], ["Bengaluru", 12.97, 77.59, -10, 15, "right"], ["Chennai", 13.08, 80.27, 12, 15, "left"], ["Kolkata", 22.57, 88.36, 12, 9, "left"], ["Guwahati", 26.14, 91.74, 12, -2, "left"], ["Hyderabad", 17.38, 78.48, 12, 4, "left"]],
    FAR = [[51.5, -.1], [1.35, 103.8], [25.2, 55.3], [35.7, 139.7], [-33.9, 151.2], [40.7, -74], [-1.3, 36.8]],
    NODES = CT.map(function (x) { return V(x[1], x[2]); }).concat(FAR.map(function (x) { return V(x[0], x[1]); })),
    PAIRS = [[0, 1], [0, 2], [0, 4], [0, 5], [0, 6], [1, 5], [3, 4], [2, 3], [7, 0], [4, 9], [2, 10], [1, 8], [5, 11], [3, 12], [1, 13], [2, 14]],
    ARCS = PAIRS.map(function (p) {
      var A = NODES[p[0]], B = NODES[p[1]], d = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]))), pts = [];
      for (var s = 0; s <= 40; s++) { var f = s / 40, v = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f], l = Math.hypot(v[0], v[1], v[2]), h = (1 + (.04 + .2 * d / PI) * Math.sin(PI * f)) / l; pts.push([v[0] * h, v[1] * h, v[2] * h]); }
      return pts;
    });
  // graticule: a line every 30 degrees
  var GR = []; (function () { for (var lo = -180; lo < 180; lo += 30) { var m = []; for (var la = -90; la <= 90; la += 6) m.push(V(la, lo)); GR.push(m); } for (var la = -60; la <= 60; la += 30) { var m = []; for (var lo = -180; lo <= 180; lo += 6) m.push(V(la, lo)); GR.push(m); } })();
  function lerp(a, b, t) { return a + (b - a) * t; }
  function frame(now) {
    if (!root.isConnected) return;
    c = B;
    var t = reduce ? 0 : now / 1000, m = W < 760; k = reduce ? stage : k + (stage - k) * .045; mx += (ix - mx) * .05; my += (iy - my) * .05;
    var R0 = m ? W * .42 : Math.min(W * .3, H * .4), R1 = m ? W * .95 : Math.min(W * .62, H * 1.1), r = lerp(R0, R1, k),
      cx = lerp(m ? W * .5 : W * .69, W * .5, k), cy = lerp(m ? H * .3 : H * .58, H + R1 * .62, k),
      a = 1.396 + Math.sin(t * .15) * .3 + t * .02 * k - mx * .5, b = .31 + k * .1 - my * .2, dim = 1 - k * .3,
      ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    gv = [cx, cy, r, a, b]; c.setTransform(D, 0, 0, D, 0, 0); c.clearRect(0, 0, W, H);
    ST.forEach(function (s) { c.fillStyle = "rgba(255,255,255," + (.25 + .35 * Math.sin(t + s[2])) + ")"; c.fillRect(s[0] * W, s[1] * H, 1.4, 1.4); });
    var g = c.createRadialGradient(cx, cy, r * .85, cx, cy, r * 1.4); g.addColorStop(0, "rgba(110,170,255,.45)"); g.addColorStop(1, "rgba(110,170,255,0)");
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.4, 0, 6.3); c.fill();
    if (!m && k < .95) {
      c.save(); c.translate(cx, cy); c.rotate(t * .03); var ta = (1 - k) * .5 * dim;
      for (var dg = 0; dg < 360; dg += 5) {
        var mj = dg % 30 === 0, th = dg * PI / 180, r1 = r * 1.05, r2 = r1 + (mj ? 10 : 5), sn2 = Math.sin(th), cs2 = -Math.cos(th);
        c.strokeStyle = "rgba(160,200,255," + (mj ? ta : ta * .5) + ")"; c.lineWidth = mj ? 1.3 : .8; c.beginPath(); c.moveTo(sn2 * r1, cs2 * r1); c.lineTo(sn2 * r2, cs2 * r2); c.stroke();
        if (mj) { c.save(); c.translate(sn2 * (r2 + 13), cs2 * (r2 + 13)); c.rotate(th); c.fillStyle = "rgba(190,215,255," + ta * 1.3 + ")"; c.font = "500 9px Figtree,sans-serif"; c.textAlign = "center"; c.fillText(dg + "\u00b0", 0, 3); c.restore(); }
      }
      c.restore();
    }
    // orbit rings: back half behind the globe, front half over it, with satellites
    function ring(rx, ry, rot, sp, front) {
      c.strokeStyle = "rgba(160,200,255," + (.22 * dim) + ")"; c.lineWidth = 1; c.setLineDash([2, 6]); c.beginPath();
      c.ellipse(cx, cy, rx, ry, rot, front ? 0 : PI, front ? PI : 2 * PI); c.stroke(); c.setLineDash([]);
      var th = t * sp, sn = Math.sin(th); if ((sn > 0) !== front) return;
      var ex = rx * Math.cos(th), ey = ry * sn, X = cx + ex * Math.cos(rot) - ey * Math.sin(rot), Y = cy + ex * Math.sin(rot) + ey * Math.cos(rot);
      c.fillStyle = "#fff"; c.shadowColor = "#8fd0ff"; c.shadowBlur = 12; c.beginPath(); c.arc(X, Y, 3, 0, 6.3); c.fill(); c.shadowBlur = 0;
    }
    var rA = [r * 1.32, r * .34, -.42, .5], rB = [r * 1.18, r * .24, .5, -.35];
    ring(rA[0], rA[1], rA[2], rA[3], false); ring(rB[0], rB[1], rB[2], rB[3], false);
    if (gl) { mesh.scale.setScalar(r); mesh.position.set(cx - W / 2, H / 2 - cy, 0); mesh.rotation.set(b, -a - PI / 2, 0); mat.uniforms.t.value = t; mat.uniforms.dim.value = dim; gl.render(scene, cam); }
    else { g = c.createRadialGradient(cx - r * .3, cy - r * .35, r * .1, cx, cy, r); g.addColorStop(0, "#1d5a9a"); g.addColorStop(1, "#04101f"); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 6.3); c.fill(); }
    c = F; c.setTransform(D, 0, 0, D, 0, 0); c.clearRect(0, 0, W, H);
    // graticule
    c.lineWidth = .7; c.strokeStyle = "rgba(140,185,255," + (.1 * dim) + ")";
    GR.forEach(function (ln) { var on = false; c.beginPath(); ln.forEach(function (v) { var o = R(v, a, b); if (o[2] < .01) { on = false; return; } var X = cx + o[0] * r, Y = cy - o[1] * r; on ? c.lineTo(X, Y) : c.moveTo(X, Y); on = true; }); c.stroke(); });
    // routes
    c.lineWidth = 1.3; c.shadowColor = "#8fd0ff";
    ARCS.forEach(function (pts, q) {
      var P = pts.map(function (p) { return R(p, a, b); }), on = false; c.strokeStyle = "rgba(143,208,255," + (.55 * dim) + ")"; c.shadowBlur = 0; c.beginPath();
      P.forEach(function (o) { if (o[2] < .02) { on = false; return; } var X = cx + o[0] * r, Y = cy - o[1] * r; on ? c.lineTo(X, Y) : c.moveTo(X, Y); on = true; }); c.stroke();
      var f = (t * .16 + q * .137) % 1, o = P[Math.floor(f * 40)]; if (o[2] > .02) { c.fillStyle = "#fff"; c.shadowBlur = 14; c.beginPath(); c.arc(cx + o[0] * r, cy - o[1] * r, 2.4, 0, 6.3); c.fill(); }
    });
    // city nodes: live cities pulse, planned ones are dim; Kanpur ("you") gets a callout
    var me = null;
    NODES.forEach(function (v, j) {
      var o = R(v, a, b); if (o[2] < .05) return; var X = cx + o[0] * r, Y = cy - o[1] * r, near = j < 8, mine = j === 0, on = !!ACT[j], col = mine ? "255,207,107" : "143,208,255";
      if (near && on) { var ph = (t * .7 + j * .31) % 1; c.shadowBlur = 0; c.strokeStyle = "rgba(" + col + "," + (1 - ph) * .75 * dim + ")"; c.lineWidth = 1.2; c.beginPath(); c.arc(X, Y, 4 + ph * (mine ? 24 : 16), 0, 6.3); c.stroke(); }
      c.shadowColor = mine ? "#ffcf6b" : "#8fd0ff"; c.shadowBlur = on ? 14 : 5; c.fillStyle = !near ? "#b79cff" : mine ? "#ffcf6b" : on ? "#fff" : "rgba(160,170,205,.65)";
      c.beginPath(); c.arc(X, Y, !near ? 2.2 : mine ? 4.4 : on ? 3.2 : 2.4, 0, 6.3); c.fill(); c.shadowBlur = 0;
      if (near && !m && k < .5 && o[2] > .3) {
        var al = .9 * (1 - k * 2); if (mine) { me = [X, Y, al]; return; }
        var L = CT[j]; c.font = "500 11px Figtree,sans-serif"; c.textAlign = L[5]; c.lineWidth = 3; c.strokeStyle = "rgba(5,7,15," + al * .8 + ")";
        c.strokeText(L[0], X + L[3], Y + L[4]); c.fillStyle = on ? "rgba(255,255,255," + al + ")" : "rgba(170,180,215," + al * .75 + ")"; c.fillText(L[0], X + L[3], Y + L[4]);
      }
    });
    if (me) {
      var X = me[0], Y = me[1], al = me[2]; c.strokeStyle = "rgba(255,207,107," + al * .8 + ")"; c.lineWidth = 1; c.beginPath(); c.moveTo(X + 5, Y - 5); c.lineTo(X + 46, Y - 46); c.lineTo(X + 200, Y - 46); c.stroke();
      c.textAlign = "left"; c.lineWidth = 3; c.strokeStyle = "rgba(5,7,15," + al * .8 + ")";
      c.font = "700 12px Figtree,sans-serif"; c.strokeText("KANPUR \u00b7 YOU", X + 52, Y - 54); c.fillStyle = "rgba(255,214,130," + al + ")"; c.fillText("KANPUR \u00b7 YOU", X + 52, Y - 54);
      c.font = "500 11px Figtree,sans-serif"; c.strokeText("26.45\u00b0N 80.35\u00b0E \u00b7 home area", X + 52, Y - 32); c.fillStyle = "rgba(255,255,255," + al * .8 + ")"; c.fillText("26.45\u00b0N 80.35\u00b0E \u00b7 home area", X + 52, Y - 32);
    }
    ring(rA[0], rA[1], rA[2], rA[3], true); ring(rB[0], rB[1], rB[2], rB[3], true);
    c.shadowBlur = 0; requestAnimationFrame(frame);
  }
  var tid = setInterval(function () { if (!root.isConnected) return clearInterval(tid); try { document.getElementById("zt").textContent = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" }); } catch (e) {} }, 1000);
  requestAnimationFrame(frame);
  } catch (err) { gateRes(); root.remove(); document.documentElement.style.overflow = ""; }
})();
