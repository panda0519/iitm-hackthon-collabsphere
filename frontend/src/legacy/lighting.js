// Spatial lighting: glass surfaces catch a highlight that follows the pointer.

    // Spatial lighting: glass windows catch a highlight that follows the pointer, the environment shifts with it.
    (function () {
      if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var r = document.documentElement;
      addEventListener("pointermove", function (e) {
        r.style.setProperty("--px", (e.clientX / innerWidth - 0.5).toFixed(3));
        r.style.setProperty("--py", (e.clientY / innerHeight - 0.5).toFixed(3));
        var el = e.target && e.target.closest && e.target.closest('[class*="bg-s1/"],.glass,.neon,.neon-anim,.win');
        if (el) { var b = el.getBoundingClientRect(); el.style.setProperty("--sx", (e.clientX - b.left) + "px"); el.style.setProperty("--sy", (e.clientY - b.top) + "px"); }
        var d = e.target && e.target.closest && e.target.closest(".depth");
        if (d) {
          var q = d.getBoundingClientRect(), k = Math.min(1, 560 / Math.max(q.width, q.height));
          d.style.setProperty("--rx", ((0.5 - (e.clientY - q.top) / q.height) * 6 * k).toFixed(2) + "deg");
          d.style.setProperty("--ry", (((e.clientX - q.left) / q.width - 0.5) * 8 * k).toFixed(2) + "deg");
        }
      }, { passive: true });
    })();
