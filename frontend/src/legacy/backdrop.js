// 3D backdrop: a wire globe with one glowing node per house, linked by pulsing arcs.

    // 3D backdrop: a wire globe with one glowing node per house, linked by arcs that carry pulses, with drifting shards behind it.
    (function () {
      if (!window.THREE) return;
      var T = THREE, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, i;
      var cv = document.createElement("canvas");
      cv.setAttribute("aria-hidden", "true");
      cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none";
      document.body.appendChild(cv);
      var ren;
      try { ren = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); } catch (e) { cv.remove(); return; }
      ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      var scene = new T.Scene(), cam = new T.PerspectiveCamera(42, 1, 0.1, 60), rig = new T.Group(), R = 1.7;
      cam.position.z = 7; scene.add(rig);

      var wireMat = new T.LineBasicMaterial({ transparent: true }), arcMat = new T.LineBasicMaterial({ transparent: true, opacity: 0.4 });
      var ringMat = new T.MeshBasicMaterial({ transparent: true, opacity: 0.16, side: T.DoubleSide });
      rig.add(new T.LineSegments(new T.WireframeGeometry(new T.IcosahedronGeometry(R, 2)), wireMat));

      var dot = document.createElement("canvas"); dot.width = dot.height = 64;
      var g = dot.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      var tex = new T.CanvasTexture(dot);

      // one node per house, spread evenly over the sphere, in the house colours
      var COLORS = ["#22c7a9", "#f2c14e", "#8a7dff", "#ff6b4a", "#e05fd0", "#38bdf8", "#7ddc5a", "#4d8dff", "#ee4b6a"], n = COLORS.length, pos = [];
      for (i = 0; i < n; i++) {
        var y = 1 - (i + 0.5) * 2 / n, r = Math.sqrt(1 - y * y), a = i * 2.39996;
        pos.push(new T.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(R));
      }
      var ng = new T.BufferGeometry().setFromPoints(pos), rgb = [];
      COLORS.forEach(function (h) { var c = new T.Color(h); rgb.push(c.r, c.g, c.b); });
      ng.setAttribute("color", new T.Float32BufferAttribute(rgb, 3));
      var nodeMat = new T.PointsMaterial({ size: 0.5, map: tex, vertexColors: true, transparent: true, depthWrite: false });
      rig.add(new T.Points(ng, nodeMat));

      // cross-house links
      var arcs = [];
      for (i = 0; i < n; i++) [2, 4].forEach(function (k) {
        var A = pos[i], B = pos[(i + k) % n], m = A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.7);
        var cu = new T.QuadraticBezierCurve3(A, m, B); arcs.push(cu);
        rig.add(new T.Line(new T.BufferGeometry().setFromPoints(cu.getPoints(36)), arcMat));
      });
      var pulses = arcs.map(function (c, j) { return { c: c, t: j / arcs.length, s: 0.0035 + (j % 5) * 0.0007 }; });
      var pg = new T.BufferGeometry().setFromPoints(pulses.map(function () { return new T.Vector3(); }));
      var pulseMat = new T.PointsMaterial({ size: 0.22, map: tex, transparent: true, depthWrite: false });
      rig.add(new T.Points(pg, pulseMat));

      var ring1 = new T.Mesh(new T.TorusGeometry(R * 1.45, 0.012, 8, 140), ringMat), ring2 = new T.Mesh(new T.TorusGeometry(R * 1.9, 0.008, 8, 160), ringMat);
      ring1.rotation.x = 1.2; ring2.rotation.set(0.4, 0.6, 0); rig.add(ring1, ring2);

      // drifting shards give the far plane some parallax
      var shards = new T.Group(), eg = new T.EdgesGeometry(new T.OctahedronGeometry(0.22));
      for (i = 0; i < 16; i++) {
        var sh = new T.LineSegments(eg, wireMat);
        sh.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 9, -2 - Math.random() * 6);
        sh.scale.setScalar(0.6 + Math.random() * 1.4); sh.userData.v = (Math.random() - 0.5) * 0.01; shards.add(sh);
      }
      scene.add(shards);

      function theme() {
        var L = document.documentElement.getAttribute("data-theme") === "light", blend = L ? T.NormalBlending : T.AdditiveBlending;
        wireMat.color.set(L ? 0x1d3a99 : 0xbcd2ff); wireMat.opacity = L ? 0.3 : 0.22;
        arcMat.color.set(L ? 0x3a62d8 : 0x9fc8ff); ringMat.color.set(L ? 0x3a62d8 : 0x9fc8ff);
        pulseMat.color.set(L ? 0x1d3a99 : 0xffffff);
        nodeMat.blending = pulseMat.blending = blend; nodeMat.needsUpdate = pulseMat.needsUpdate = true;
      }
      theme();
      new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      var tx = 0, ty = 0, cx = 0, cy = 0;
      function size() {
        var W = innerWidth, H = innerHeight, wide = W >= 900;
        ren.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
        rig.position.set(wide ? 2.6 : 0, wide ? 0.1 : 1.1, 0); rig.scale.setScalar(wide ? 1 : 0.72);
      }
      function draw(t) {
        cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
        rig.rotation.y = t * 0.00008 + cx * 0.6; rig.rotation.x = cy * 0.35;
        ring1.rotation.z = t * 0.00005; ring2.rotation.z = -t * 0.00004;
        shards.children.forEach(function (s) { s.rotation.x += s.userData.v; s.rotation.y += s.userData.v * 1.3; });
        shards.position.set(-cx * 1.2, cy * 0.8, 0);
        cam.position.set(cx * 0.5, -cy * 0.35, 7); cam.lookAt(0, 0, 0);
        var p = pg.attributes.position;
        pulses.forEach(function (u, k) { u.t = (u.t + u.s) % 1; var v = u.c.getPoint(u.t); p.setXYZ(k, v.x, v.y, v.z); });
        p.needsUpdate = true;
        ren.render(scene, cam);
      }
      size();
      addEventListener("resize", function () { size(); if (reduce) draw(0); });
      if (reduce) { draw(0); return; }
      addEventListener("pointermove", function (e) { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
      (function loop(t) { if (!document.hidden) draw(t); requestAnimationFrame(loop); })(0);
    })();
