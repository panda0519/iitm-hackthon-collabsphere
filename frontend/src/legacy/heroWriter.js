// Hero headline: "lets collab" in glossy tube letters.
// Extracted verbatim from the original file (section: intro). The two inline base64
// images now load from /assets instead of a data URL.

  // Hero headline: "lets collab" in glossy tube letters, kept at 2960x835 px and drawn at the screen's own pixel density.
  // Every pixel carries the moment it was written in the original recording, so the strokes appear in the same order.
  (function () {
    var cv = document.getElementById("wr-c"); if (!cv) return;
    var W = 2960, H = 835, TW = 1480, TH = 418, TOT = 8.35, END = 6.37, RATE = 120;
    var vis = cv.getContext("2d"), oc = document.createElement("canvas"); oc.width = W; oc.height = H;
    var o = oc.getContext("2d"), ci = new Image(), ti = new Image(), loaded = 0;
    function fit() {
      var w = Math.min(W, Math.max(1, Math.round(cv.clientWidth * (window.devicePixelRatio || 1)))), h = Math.round(w * H / W);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      vis.imageSmoothingEnabled = true; vis.imageSmoothingQuality = "high";
      vis.clearRect(0, 0, w, h); vis.drawImage(oc, 0, 0, w, h);
    }
    if (window.ResizeObserver) new ResizeObserver(fit).observe(cv); else window.addEventListener("resize", fit);
    function go() {
      if (++loaded < 2) return;
      var col, tmd, still = function () { o.clearRect(0, 0, W, H); o.drawImage(ci, 0, 0); fit(); };
      try {
        o.drawImage(ci, 0, 0); col = o.getImageData(0, 0, W, H);
        var tc = document.createElement("canvas"); tc.width = TW; tc.height = TH;
        var t2 = tc.getContext("2d"); t2.drawImage(ti, 0, 0); tmd = t2.getImageData(0, 0, TW, TH).data;
      } catch (e) { still(); return; }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { still(); return; }
      var base = col.data, N = W * H, nb = Math.ceil(END * RATE) + 2;
      var bin = new Uint16Array(N), starts = new Uint32Array(nb + 1), order, i, x, y;
      for (y = 0, i = 0; y < H; y++) {
        var ro = (y >> 1) * TW;
        for (x = 0; x < W; x++, i++) {
          if (base[i * 4 + 3] === 0) { bin[i] = 65535; continue; }
          var q = (ro + (x >> 1)) * 4, b = Math.min(nb - 1, Math.floor((tmd[q] * 256 + tmd[q + 1]) / 65535 * TOT * RATE));
          bin[i] = b; starts[b + 1]++;
        }
      }
      for (i = 0; i < nb; i++) starts[i + 1] += starts[i];
      order = new Uint32Array(starts[nb]); var fill = starts.slice(0, nb);
      for (i = 0; i < N; i++) if (bin[i] !== 65535) order[fill[bin[i]]++] = i;
      var out = o.createImageData(W, H), d = out.data; d.set(base);
      for (i = 0; i < N; i++) d[i * 4 + 3] = 0;
      o.clearRect(0, 0, W, H);
      var t0 = performance.now() + 300, ptr = 0;
      (function step(now) {
        var bk = Math.min(nb - 1, Math.floor(Math.max(0, now - t0) / 1000 * RATE)), lim = starts[bk + 1];
        var x0 = W, x1 = -1, y0 = H, y1 = -1;
        for (; ptr < lim; ptr++) {
          var k = order[ptr], yy = (k / W) | 0, xx = k - yy * W;
          d[k * 4 + 3] = base[k * 4 + 3];
          if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
        }
        if (x1 >= x0) { o.putImageData(out, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1); fit(); }
        if (bk < nb - 1) requestAnimationFrame(step);
      })(performance.now());
    }
    ci.onload = ti.onload = go;
    ci.src = "/assets/hero-collab.webp"; ti.src = "/assets/hero-collab-timing.png";
  })();
