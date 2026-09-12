/* emanzk.com — CV as a server rack, v3: blueprint / JARVIS HUD. Holographic wireframe rack; the device you're reading materialises.
   Live camera telemetry to the HUD bar, leader line from device to panel. Three r128. */
(function () {
  const THREE = window.THREE, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('scene');
  const DEBUGCAP = new URLSearchParams(location.search).has('p') && !new URLSearchParams(location.search).has('nopreserve');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: DEBUGCAP }); // debug captures only: keeps the last frame readable on throttled frames
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene(); // no fog: a diagram has no atmosphere
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 200);
  const aisle = new THREE.Object3D(); // unlit scene: every surface is a flat fill, form comes from the edge lines

  const HUD = 0x22d3ee;
  const std = (color, r = .8, m = .4, op = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: op > .3, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }); // invisible line-art bodies must not occlude what's inside them
  const M = { frame: std(0x112a40, .8, .55, 0), body: std(0x0a1c2e, .85, .3, 0), bezel: std(0x0f2740, .7, .45, 0), blank: std(0x0b1c2c, .9, .3, 0), handle: std(0x3f7f9f, .3, .9, 0), port: std(0x04101c, .6, .4, 0), bay: std(0x123049, .7, .45, 0), psu: std(0x102a3f, .7, .5, 0) };
  // blueprint helpers: outlined plane, fan symbol, circle
  const oplane = (w, hh, x, y, z, op = .55) => { const p = plane(w, hh, M.port, x, y, z); edged(p, op); return p; };
  const circle = (r, seg, op) => { const pts = []; for (let i = 0; i <= seg; i++) { const a = i / seg * 6.283; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); } return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: HUD, transparent: true, opacity: op })); };
  const fan = (size, op = .6) => { const g = new THREE.Group(); const sq = new THREE.Mesh(new THREE.PlaneGeometry(size, size), M.port); edged(sq, op); g.add(sq); g.add(circle(size * .42, 28, op)); g.add(circle(size * .08, 10, op)); const bl = []; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .5; bl.push(new THREE.Vector3(Math.cos(a) * size * .1, Math.sin(a) * size * .1, 0), new THREE.Vector3(Math.cos(a + .9) * size * .4, Math.sin(a + .9) * size * .4, 0)); } g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(bl), new THREE.LineBasicMaterial({ color: HUD, transparent: true, opacity: op }))); return g; };
  const tex = (draw, w = 256, h = 256) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
  const perfBase = tex((g, w, h) => { g.fillStyle = '#0f2740'; g.fillRect(0, 0, w, h); g.fillStyle = '#04101c'; for (let y = 8; y < h; y += 16) for (let x = 8 + ((y / 16) % 2) * 8; x < w; x += 16) { g.beginPath(); g.arc(x, y, 4.1, 0, 6.283); g.fill(); } });
  const perf = (rx, ry) => { const t = perfBase.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: .85, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }); };
  const railTex = tex((g, w, h) => { g.fillStyle = '#112a40'; g.fillRect(0, 0, w, h); g.fillStyle = '#02070d'; g.fillRect(20, 20, 24, 24); }, 64, 64);
  const gridTex = tex((g, w, h) => { g.fillStyle = 'rgba(4,16,28,1)'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(34,211,238,.10)'; g.lineWidth = 1; for (let i = 0; i <= 4; i++) { const v = i * 128 + .5; g.beginPath(); g.moveTo(v, 0); g.lineTo(v, h); g.moveTo(0, v); g.lineTo(w, v); g.stroke(); } g.strokeStyle = 'rgba(34,211,238,.26)'; g.strokeRect(.5, .5, w - 1, h - 1); }, 512, 512);
  const label = (text, w = 512, h = 96, fg = '#a9e8f5', bg = '#07182a', size = 40) => tex((g) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(34,211,238,.7)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = fg; g.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`; g.textBaseline = 'middle'; g.fillText(text, 26, h / 2); }, w, h);
  // a name plate that can be rewritten: same look as label(), but the canvas is kept and redrawn
  const dynLabel = (w = 512, h = 72, fg = '#a9e8f5', size = 34) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
    const draw = (text, cursor) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(34,211,238,.7)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
      g.fillStyle = fg; g.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`; g.textBaseline = 'middle'; g.fillText(text, 26, h / 2);
      if (cursor) { const tw = g.measureText(text).width; g.fillRect(28 + tw, h / 2 - size * .44, size * .5, size * .88); }
      t.needsUpdate = true; };
    return { tex: t, draw }; };
  const plane = (w, h, mat, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); p.position.set(x, y, z); return p; };
  const edged = (mesh, op = .4) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: HUD, transparent: true, opacity: op })); mesh.add(l); return l; };
  const OFF = new THREE.Color(0x14304a);
  const haloTex = tex((g, w, h) => { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2, w * .3, 0, 6.283); g.stroke(); }, 128, 128);
  const led = (hex, x, y, z, w = .16, h = .1, blink = 0) => { w *= 1.5; h *= 1.5; const m = new THREE.MeshBasicMaterial({ color: OFF }); m.userData.on = new THREE.Color(hex);
    const p = plane(w, h, m, x, y, z + .01);
    const halo = plane(Math.max(w, h) * 3.2, Math.max(w, h) * 3.2, new THREE.MeshBasicMaterial({ map: haloTex, color: hex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0, -.004); p.add(halo);
    p.userData = { blink, phase: Math.random() * 6.28, halo }; return p; };
  const setLed = (l, k) => { k = Math.min(1, Math.max(0, k)); l.material.color.copy(OFF).lerp(l.material.userData.on, k); l.userData.halo.material.opacity = Math.max(0, k - .15) * .75; };

  // ---- rack ----
  const U = 1, W = 10.8, D = 12, RAIL = .55, CZ = -D / 2;
  const LAYOUT = [['patch', 1], ['gap', 1], ['switch', 1], ['gap', 1],
    ['server', 2], ['gap', .5], ['server', 2], ['gap', .5], ['kvm', 2], ['gap', .5], ['server', 2], ['gap', .5], ['server', 2], ['gap', .5], ['server', 2], ['gap', 1],
    ['ups', 2], ['gap', .5], ['pdu', 1]];
  const totalU = LAYOUT.reduce((a, [, h]) => a + h, 0), TOP = 0, BOTTOM = -totalU;
  const GROUPS = [[0x22d3ee, 3], [0x22d3ee, 7], [0x22d3ee, 5], [0x22d3ee, 5], [0x22d3ee, 3], [0x22d3ee, 9]];
  const SITE = window.SITE || {}, COMPANIES = (SITE.experience || []).map(e => e.plate);
  const POSTS = window.POSTS || [];

  const railMat = new THREE.MeshBasicMaterial({ map: railTex, transparent: true, opacity: .96, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }); railMat.map.repeat.set(1, totalU * 3);
  [-1, 1].forEach(s => {
    [0.1, -D + .3].forEach(z => { const r = new THREE.Mesh(new THREE.BoxGeometry(RAIL, totalU + 1.2, .5), railMat); r.position.set(s * (W / 2 + RAIL / 2 + .04), (TOP + BOTTOM) / 2, z); scene.add(r); edged(r, .75); });
    const side = new THREE.Mesh(new THREE.BoxGeometry(.3, totalU + 1.2, D + .4), M.frame); side.position.set(s * (W / 2 + RAIL + .24), (TOP + BOTTOM) / 2, CZ + .1); scene.add(side); edged(side, .75);
  });
  const cap = (y) => { const c = new THREE.Mesh(new THREE.BoxGeometry(W + 2 * RAIL + .8, .5, D + .6), M.frame); c.position.set(0, y, CZ + .15); scene.add(c); edged(c, .8); };
  cap(TOP + .55); cap(BOTTOM - .55);
  const gridMat = new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: .9 }); gridMat.map.repeat.set(24, 24);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(96, 96), gridMat); floor.rotation.x = -Math.PI / 2; floor.position.y = BOTTOM - .8; scene.add(floor);
  const backGridMat = new THREE.MeshBasicMaterial({ map: gridTex.clone(), transparent: true, opacity: .55 }); backGridMat.map.needsUpdate = true; backGridMat.map.repeat.set(22, 14);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(88, 56), backGridMat); backdrop.position.set(0, (TOP + BOTTOM) / 2 + 4, -D - 14); scene.add(backdrop);
  scene.add(plane(4.2, .5, new THREE.MeshBasicMaterial({ transparent: true, map: label((SITE.meta && SITE.meta.rackLabel) || '', 512, 64, '#22d3ee', '#07182a', 30) }), -2.6, TOP + .55, .47));
  { const x = W / 2 + RAIL + 1.3, z = .3, top = TOP + .55, bot = BOTTOM - .55, dm = new THREE.LineBasicMaterial({ color: HUD, transparent: true, opacity: .55 });
    const pts = [[x, top, z], [x, bot, z], [x - .35, top, z], [x + .35, top, z], [x - .35, bot, z], [x + .35, bot, z]];
    for (let u = 0; u <= totalU; u += 5) { const yy = TOP - u; pts.push([x - .18, yy, z], [x + .18, yy, z]); }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), dm));
    scene.add(plane(1.6, .36, new THREE.MeshBasicMaterial({ transparent: true, map: label(totalU + 'U', 256, 64, '#22d3ee', '#04101c', 34), transparent: true }), x + 1.15, (TOP + BOTTOM) / 2, z)); }
  [-2.2, -3.8].forEach(u => { const f = fan(1.1, .55); f.position.set(W / 2 + RAIL + .41, BOTTOM + 3 + u + 4, CZ + 2.5); f.rotation.y = Math.PI / 2; scene.add(f); });
  { const bx = W / 2 - 1.2, bl = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(bx, TOP + .8, CZ), new THREE.Vector3(bx, TOP + 2.6, CZ)]), new THREE.LineBasicMaterial({ color: HUD, transparent: true, opacity: .6 })); scene.add(bl); const c = circle(.16, 12, .8); c.position.set(bx, TOP + 2.75, CZ); scene.add(c); }
  const chan = new THREE.Mesh(new THREE.BoxGeometry(.9, totalU + .8, .6), M.frame); chan.position.set(-W / 2 + .5, (TOP + BOTTOM) / 2, -D - .35); scene.add(chan); edged(chan, .45);

  const DEV = []; let cursor = TOP, serverIdx = 0;
  const handles = (g, h) => [-1, 1].forEach(s => { const hd = new THREE.Mesh(new THREE.BoxGeometry(.26, Math.min(.7, h - .3), .3), M.handle); hd.position.set(s * (W / 2 - .32), 0, .3); g.add(hd); });
  const rearServer = (dev, g) => { dev.rearMats = dev.rearMats || []; const collect = o => o.traverse(c => { if (c.material && c.material !== M.port) dev.rearMats.push([c.material, c.material.opacity]); });
    [-3.6, -2.4].forEach(x => { const f = fan(.95); f.position.set(x, -.25, -D - .03); f.rotation.y = Math.PI; g.add(f); collect(f); });
    const grille = oplane(3.6, 1.2, 1.2, .1, -D - .02, .4); grille.rotation.y = Math.PI; g.add(grille); collect(grille);
    for (let i = 0; i < 4; i++) { const pt = plane(.34, .3, M.port, 3.6 + i * .42, .45, -D - .02); pt.rotation.y = Math.PI; g.add(pt); }
  };
  for (const [type, hU] of LAYOUT) {
    const h = hU * U, y = cursor - h / 2; cursor -= h;
    if (type === 'gap') { const b = new THREE.Mesh(new THREE.BoxGeometry(W, h - .06, .18), M.blank); b.position.set(0, y, .04); scene.add(b); edged(b, .35); continue; }
    const g = new THREE.Group(); g.position.set(0, y, 0); scene.add(g);
    const dev = { type, hU, h, y, g, focus: 0, leds: [], ports: [], edges: [], mats: [], slideMax: { patch: 0, switch: .8, server: 2.8, kvm: 7.0, ups: .7, pdu: 0 }[type] };
    const bodyMat = M.body.clone(), bezMat = M.bezel.clone();
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, h - .08, D), bodyMat); body.position.z = -D / 2; g.add(body);
    const bez = new THREE.Mesh(new THREE.BoxGeometry(W, h - .08, .26), bezMat); bez.position.z = .12; g.add(bez);
    dev.mats.push([bodyMat, 0, 0], [bezMat, 0, .12]); dev.edges.push(edged(body, .38), edged(bez, .6));
    handles(g, h);
    const Z = .27;
    if (type === 'patch') {
      const cols = [0x22d3ee, 0x22d3ee, 0x22d3ee, 0x22d3ee];
      for (let i = 0; i < 24; i++) { const x = -4.2 + i * .365; g.add(oplane(.28, .3, x, 0, Z)); if (i % 2 === 0 || i > 16) { const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0, Z), new THREE.Vector3(x, -.05, Z + .7)]), new THREE.LineBasicMaterial({ color: HUD, transparent: true, opacity: .8 })); g.add(ln); const cc = circle(.07, 10, .8); cc.position.set(x, -.05, Z + .7); g.add(cc); } }
      dev.leds = [led(0x22d3ee, 4.6, .2, Z, .14, .09), led(0x22d3ee, 4.6, -.15, Z, .14, .09, 1)];
    } else if (type === 'switch') {
      let i = 0; GROUPS.forEach(([col, n]) => { for (let k = 0; k < n; k++, i++) { const row = i % 2, c = Math.floor(i / 2); const x = -4.3 + c * .56, yy = row ? -.24 : .16; g.add(oplane(.42, .3, x, yy, Z)); const l = led(col, x, yy + .2, Z, .1, .06, 1); l.userData.group = i; g.add(l); dev.ports.push(l); } });
      dev.leds = [led(0x22d3ee, 4.7, .2, Z), led(0x22d3ee, 4.7, -.15, Z, .16, .1, 1)];
      // Six buses leaving the switch, each terminating at a real device: one uplink to the patch
      // panel, five downlinks to the five servers. Manhattan routing, fixed 45° chamfers, one lane
      // each. Lanes are ordered by target depth and each turns in at its own device, so none cross.
      const NET = 0xfbbf24; // network yellow: patch-cable convention, reads apart from the rack's cyan
      const traceMat = new THREE.LineBasicMaterial({ color: NET, transparent: true, opacity: .85 });
      const thinMat = new THREE.LineBasicMaterial({ color: NET, transparent: true, opacity: .5 });
      const markMat = new THREE.MeshBasicMaterial({ color: NET, transparent: true, opacity: .95, side: THREE.DoubleSide });
      const tagMat = () => new THREE.MeshBasicMaterial({ transparent: true, opacity: .9 });
      dev.rearMats = [[traceMat, .85], [thinMat, .5], [markMat, .95]];
      dev.billboards = []; dev.pulses = [];
      const ZT = -D - .85, CH = .4, BW = .06, LANE = .46, BUSX = -W / 2 + .55;

      // every device's height, so a bus can end where its target actually sits
      const DEVY = (() => { let c = TOP; const out = []; for (const [t, hh] of LAYOUT) { const h2 = hh * U; if (t !== 'gap') out.push(c - h2 / 2); c -= h2; } return out; })();
      const myY = DEVY[DEV.length];
      // the buses belong to the rack, not to the switch — they must not slide out with it
      const bg = new THREE.Group(); scene.add(bg);   // absolute rack coordinates

      const chamfer = (pts, c) => { const out = [pts[0]];
        for (let k = 1; k < pts.length - 1; k++) { const q = pts[k], a2 = pts[k - 1], b2 = pts[k + 1];
          const d1 = [q[0] - a2[0], q[1] - a2[1]], d2 = [b2[0] - q[0], b2[1] - q[1]];
          const l1 = Math.hypot(d1[0], d1[1]) || 1, l2 = Math.hypot(d2[0], d2[1]) || 1, cc = Math.min(c, l1 / 2, l2 / 2);
          out.push([q[0] - d1[0] / l1 * cc, q[1] - d1[1] / l1 * cc], [q[0] + d2[0] / l2 * cc, q[1] + d2[1] / l2 * cc]); }
        out.push(pts[pts.length - 1]); return out; };
      const offset = (pts, w) => pts.map((q, k) => { let nx = 0, ny = 0;
        if (k > 0) { const dx = q[0] - pts[k - 1][0], dy = q[1] - pts[k - 1][1], L = Math.hypot(dx, dy) || 1; nx += -dy / L; ny += dx / L; }
        if (k < pts.length - 1) { const dx = pts[k + 1][0] - q[0], dy = pts[k + 1][1] - q[1], L = Math.hypot(dx, dy) || 1; nx += -dy / L; ny += dx / L; }
        const L2 = Math.hypot(nx, ny) || 1; return [q[0] + nx / L2 * w, q[1] + ny / L2 * w]; });
      const poly2 = (pts2, z, mat) => { bg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2.map(q => new THREE.Vector3(q[0], q[1], z))), mat)); };

      const marker = (kind, filled, r, x, y, z) => {
        const n = kind === 0 ? 16 : kind === 1 ? 3 : 4, rot = kind === 1 ? Math.PI / 2 : kind === 2 ? Math.PI / 4 : 0, pv = [];
        if (filled) { for (let k = 0; k < n; k++) { const a2 = rot + k * 2 * Math.PI / n; pv.push(new THREE.Vector2(Math.cos(a2) * r, Math.sin(a2) * r)); }
          const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pv)), markMat); m.position.set(x, y, z); bg.add(m); return; }
        for (let k = 0; k <= n; k++) { const a2 = rot + k * 2 * Math.PI / n; pv.push(new THREE.Vector3(x + Math.cos(a2) * r, y + Math.sin(a2) * r, z)); }
        bg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pv), traceMat)); };

      // both ends of a bus are an 8P8C port: body, latch tab, contact pins
      const rj45 = (x, y, z, flip) => { const w2 = .3, h2 = .26, tw = .12, th = .1 * (flip ? -1 : 1), hh = h2 / 2 * (flip ? -1 : 1);
        const pv = [[-w2/2, hh], [w2/2, hh], [w2/2, -hh], [tw/2, -hh], [tw/2, -hh - th], [-tw/2, -hh - th], [-tw/2, -hh], [-w2/2, -hh], [-w2/2, hh]];
        bg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pv.map(q => new THREE.Vector3(x + q[0], y + q[1], z))), traceMat));
        for (let k = 0; k < 4; k++) { const px = x - w2/2 + w2 * (k + 1) / 5;
          bg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
            [new THREE.Vector3(px, y + hh - .02 * (flip ? -1 : 1), z), new THREE.Vector3(px, y + hh - .11 * (flip ? -1 : 1), z)]), thinMat)); } };

      const pktGeo = kind => { if (kind === 0) return new THREE.CircleGeometry(.032, 12);
        const n = kind === 1 ? 3 : 4, rot = kind === 1 ? Math.PI / 2 : Math.PI / 4, pv = [];
        for (let k = 0; k < n; k++) { const a2 = rot + k * 2 * Math.PI / n; pv.push(new THREE.Vector2(Math.cos(a2) * .038, Math.sin(a2) * .038)); }
        return new THREE.ShapeGeometry(new THREE.Shape(pv)); };
      const tag = t => tex(gc => { gc.clearRect(0, 0, 128, 64); gc.fillStyle = '#fbbf24';
        gc.font = '600 44px "JetBrains Mono", ui-monospace, monospace'; gc.textAlign = 'center'; gc.textBaseline = 'middle';
        gc.fillText(t, 64, 34); }, 128, 64);

      // Structured cabling, dressed the way a rack actually is: each link leaves the patch panel,
      // runs out to the vertical manager at the side, down it, and back in to the device's NIC.
      // One conductor per link. Side lanes and exit heights are ordered so nothing ever crosses.
      const XDEST = 3.28;                   // NIC column: between the grille (ends 3.0) and the rear ports (start 3.6)
      const yPatch = DEVY[0];
      const TARGETS = [1, 2, 3, 5, 6, 7];   // the switch's uplink, then the five servers
      const LINKS = [8, 2, 2, 2, 2, 2];
      TARGETS.forEach((ti, gi) => {
        const yT = DEVY[ti], xSrc = -3.6 + gi * 1.2,
              side = XDEST + .62 + gi * .26,          // deeper links sit further out, so branches pass only over finished ones
              yTop = yPatch - .35 - (5 - gi) * .22;   // and leave the panel at their own height
        const path2 = chamfer([[xSrc, yPatch], [xSrc, yTop], [side, yTop], [side, yT], [XDEST, yT]], CH);
        poly2(path2, ZT, traceMat);                    // one line per link
        // z-connectors: patch panel rear → cable plane, and cable plane → the device's rear panel
        bg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
          [new THREE.Vector3(xSrc, yPatch, -D - .05), new THREE.Vector3(xSrc, yPatch, ZT)]), traceMat));
        bg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
          [new THREE.Vector3(XDEST, yT, ZT), new THREE.Vector3(XDEST, yT, -D - .05)]), traceMat));
        rj45(xSrc, yPatch, ZT, false);                 // patch panel port
        rj45(XDEST, yT, -D - .06, false);              // the device's NIC — same position on every device
        // every port is labelled at its top corner: the shape its packets carry, and the link count
        marker(gi % 3, gi >= 3, .07, xSrc - .27, yPatch + .27, ZT);
        const lab = plane(.42, .21, tagMat(), xSrc + .03, yPatch + .27, ZT); lab.material.map = tag('/' + LINKS[gi]);
        bg.add(lab); dev.rearMats.push([lab.material, .9]); dev.billboards.push(lab);
        const P3 = [new THREE.Vector3(xSrc, yPatch, -D - .05)].concat(path2.map(q => new THREE.Vector3(q[0], q[1], ZT)))
          .concat([new THREE.Vector3(XDEST, yT, -D - .06)]);
        const cp = new THREE.CurvePath(); for (let k = 0; k < P3.length - 1; k++) cp.add(new THREE.LineCurve3(P3[k], P3[k + 1]));
        const dot = new THREE.Mesh(pktGeo(gi % 3), new THREE.MeshBasicMaterial({ color: NET, transparent: true, side: THREE.DoubleSide }));
        dot.userData = { path: cp, t: gi / 6, speed: .09 + gi * .01 }; bg.add(dot); dev.pulses.push(dot); dev.billboards.push(dot);
      });
    } else if (type === 'server') {
      { const si = serverIdx++, host = 'HOST ' + String(si + 1).padStart(2, '0'), lab = dynLabel();
        lab.draw(host, false);
        g.add(plane(3.4, .46, new THREE.MeshBasicMaterial({ transparent: true, map: lab.tex }), -2.5, .48, Z + .01));
        dev.label = { draw: lab.draw, host, company: COMPANIES[si], shown: host, want: host, phase: 'idle', acc: 0, dirty: false }; }
      dev.leds = [led(0x22d3ee, -4.6, .55, Z, .2, .13), led(0x22d3ee, -4.6, .2, Z, .2, .13, 1), led(0x22d3ee, -4.6, -.15, Z, .2, .13, 2)];
      for (let b = 0; b < 4; b++) { const bay = new THREE.Mesh(new THREE.BoxGeometry(1.15, .62, .2), M.bay); bay.position.set(2.2 + b * 1.05 - .45, -.42, Z); g.add(bay); dev.edges.push(edged(bay, .45)); const bl = led(0x22d3ee, 2.2 + b * 1.05 - .95, -.42, Z + .11, .05, .1, 2); g.add(bl); dev.leds.push(bl); }
      g.add(oplane(4.6, .5, -1.1, -.45, Z + .005, .45)); for (let i = 0; i < 16; i++) g.add(oplane(.26, .22, -4.0 + i * .3, .12, Z + .005, .4)); rearServer(dev, g);
    } else if (type === 'kvm') {
      // laptop-style console: thin tray that slides fully out, keyboard + trackpad as line-work, thin lid hinged at the REAR, screen on the lid's inner face
      const bar = new THREE.Mesh(new THREE.BoxGeometry(6.5, .14, .22), M.handle); bar.position.set(0, -.6, Z + .1); g.add(bar);
      const TW = W - 1.6, TD = 5.4, ty = -.5;
      const tray = new THREE.Mesh(new THREE.BoxGeometry(TW, .14, TD), std(0x1f5677, .7, .4, 0)); tray.material.depthWrite = true; tray.position.set(0, ty - .07, .1 - TD / 2); g.add(tray); dev.edges.push(edged(tray, .9)); dev.mats.push([tray.material, 0, .5]);
      { const segs = [], kw = .36, kh = .3, gap = .07, cols = 15, rows = 5, x0 = -(cols * (kw + gap)) / 2, z0 = -2.55, y = ty + .01;
        for (let i = 0; i < 26; i++) { const c = circle(.05, 8, .6); c.rotation.x = -Math.PI / 2; c.position.set(-4.0 + i * .32, y, -4.85); g.add(c); dev.edges.push(c); } // speaker grille on the deck between hinge and keys
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = x0 + c * (kw + gap), z = z0 - r * (kh + gap);
          segs.push(new THREE.Vector3(x, y, z), new THREE.Vector3(x + kw, y, z), new THREE.Vector3(x + kw, y, z), new THREE.Vector3(x + kw, y, z - kh), new THREE.Vector3(x + kw, y, z - kh), new THREE.Vector3(x, y, z - kh), new THREE.Vector3(x, y, z - kh), new THREE.Vector3(x, y, z));
          const kt = .09; segs.push(new THREE.Vector3(x, y, z), new THREE.Vector3(x, y + kt, z), new THREE.Vector3(x + kw, y, z), new THREE.Vector3(x + kw, y + kt, z), new THREE.Vector3(x, y + kt, z), new THREE.Vector3(x + kw, y + kt, z)); } // key front faces, so the keyboard reads from the front
        const tp = [[-1.1, -.25], [1.1, -.25], [1.1, -1.25], [-1.1, -1.25]]; for (let i = 0; i < 4; i++) { const p0 = tp[i], p1 = tp[(i + 1) % 4]; segs.push(new THREE.Vector3(p0[0], y, p0[1]), new THREE.Vector3(p1[0], y, p1[1])); }
        const kb = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), new THREE.LineBasicMaterial({ color: HUD, transparent: true, opacity: .55, depthTest: false })); kb.renderOrder = 11; g.add(kb); dev.kb = kb;
        // key caps as one merged quad mesh with a faint fill, so the keyboard reads as a surface when foreshortened
        const kv = [], ki = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = x0 + c * (kw + gap), z = z0 - r * (kh + gap), b = kv.length / 3;
          kv.push(x, y + .005, z, x + kw, y + .005, z, x + kw, y + .005, z - kh, x, y + .005, z - kh); ki.push(b, b + 1, b + 2, b, b + 2, b + 3); }
        const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute(kv, 3)); kg.setIndex(ki);
        const km = new THREE.MeshBasicMaterial({ color: HUD, transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false }); const kmesh = new THREE.Mesh(kg, km); kmesh.renderOrder = 11; g.add(kmesh); dev.mats.push([km, 0, .3]); }
      { const hz = .1 - TD + .12, hm = std(0x1a4a66, .7, .4, 0); hm.depthWrite = true; const hb = new THREE.Mesh(new THREE.BoxGeometry(TW - 1.0, .22, .22), hm); hb.position.set(0, ty + .08, hz); g.add(hb); dev.edges.push(edged(hb, .95)); dev.mats.push([hm, 0, .6]);
        [-1, 1].forEach(sg => { const k = new THREE.Mesh(new THREE.BoxGeometry(.5, .22, .22), hm); k.position.set(sg * (TW / 2 - .55), ty + .06, hz); g.add(k); dev.edges.push(edged(k, .85)); }); } // hinge bar + knuckles: the visible joint between tray and lid
      const hinge = new THREE.Group(); hinge.position.set(0, ty + .02, .1 - TD + .12); g.add(hinge); dev.hinge = hinge;
      const LID = TD - .5, lid = new THREE.Mesh(new THREE.BoxGeometry(TW, .09, LID), M.bezel.clone()); lid.position.set(0, .05, LID / 2); hinge.add(lid); dev.edges.push(edged(lid, .7)); dev.mats.push([lid.material, 0, .08]);
      const scrTex = tex((gc, w, hh) => { gc.fillStyle = '#0d2238'; gc.fillRect(0, 0, w, hh); gc.fillStyle = '#030b14'; gc.fillRect(18, 18, w - 36, hh - 36); // bezel band + display
        gc.strokeStyle = 'rgba(34,211,238,.45)'; gc.lineWidth = 2; gc.strokeRect(18, 18, w - 36, hh - 36);
        gc.font = '400 21px "JetBrains Mono", ui-monospace, monospace'; gc.textBaseline = 'top'; let y = 34; const L = 27, X = 40, line = (t, c = '#9fd8e6') => { gc.fillStyle = c; gc.fillText(t, X, y); y += L; };
        const TT = 58, row = (d, t) => '│ ' + d.padEnd(10) + ' │ ' + t.slice(0, TT).padEnd(TT) + ' │', hr = (l, m, r) => l + '─'.repeat(12) + m + '─'.repeat(TT + 2) + r;
        line('emanzk@rack01:~$ tail -f /var/log/writing', '#22d3ee'); line(hr('┌', '┬', '┐'), '#3b8aa0'); line(row('DATE', 'TITLE'), '#22d3ee'); line(hr('├', '┼', '┤'), '#3b8aa0');
        POSTS.slice(0, 6).forEach(p => line(row(p.date, p.title))); line(hr('└', '┴', '┘'), '#3b8aa0'); line(`${POSTS.length} entries · following · ^C to stop`, '#3b8aa0'); line('');
        line('emanzk@rack01:~$ uptime', '#22d3ee'); line(' 00:12:33 up 212 days,  3 users,  load average: 0.31, 0.28, 0.24'); line('emanzk@rack01:~$ _', '#22d3ee');
        gc.fillStyle = '#22d3ee'; gc.fillRect(18, hh - 52, w - 36, 34); gc.fillStyle = '#03101c'; gc.font = '600 20px "JetBrains Mono", ui-monospace, monospace'; gc.textBaseline = 'middle';
        gc.fillText(' rack01 │ tty1 │ writing │ ' + POSTS.length + ' posts', 30, hh - 35); gc.textAlign = 'right'; gc.fillText('2026-09-12  00:12 ', w - 30, hh - 35); gc.textAlign = 'left'; }, 1024, 520);
      dev.screen = plane(TW - .5, LID - .45, new THREE.MeshBasicMaterial({ map: scrTex, transparent: true, opacity: 0, side: THREE.DoubleSide }), 0, -.005, LID / 2); dev.screen.rotation.x = Math.PI / 2; dev.screen.renderOrder = 10; hinge.add(dev.screen); // drawn after the rack's transparent planes
      dev.leds = [led(0x22d3ee, 4.6, -.6, Z), led(0x22d3ee, 4.3, -.6, Z, .16, .1, 1)];
    } else if (type === 'ups') {
      dev.screen = plane(2.6, .9, new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: .12 }), -3.2, 0, Z); g.add(dev.screen);
      dev.leds = [led(0x22d3ee, 0.6, .35, Z), led(0x22d3ee, 1.0, .35, Z), led(0x22d3ee, 1.4, .35, Z), led(0x22d3ee, 1.8, .35, Z, .16, .1, 1)];
      g.add(oplane(3.2, .9, 3.2, 0, Z, .45));
    } else if (type === 'pdu') {
      for (let i = 0; i < 8; i++) g.add(oplane(.62, .6, -3.9 + i * 1.05, 0, Z));
      dev.leds = [led(0x22d3ee, 4.6, 0, Z, .2, .14)];
      g.add(plane(1.5, .36, new THREE.MeshBasicMaterial({ transparent: true, map: label('MGMT', 256, 64, '#22d3ee', '#07182a', 34) }), 4.55, .45, Z));
    }
    dev.leds.forEach(l => { if (!l.parent) g.add(l); });
    DEV.push(dev);
  }

  // ---- shot list (radius from CZ; front face ~6 nearer, pulled-out server ~9 nearer) ----
  const SHOTS = {
    hero:    [{ a: 18, r: 31, y: 1.2, yl: -2.6 }, { a: 12, r: 28, y: .6, yl: -2.2 }],
    skills:  [{ a: 6, r: 22, y: .4, yl: 0 }, { a: -70, r: 21, y: -1.5, yl: -4 }, { a: -163, r: 34, y: -3.5, yl: -6.5, off: 1.0 }],  // holds the whole run: patch panel at the top down to the lowest NIC
    writing: [{ a: -330, r: 27, y: 4.5, yl: .9, off: 3.0 }, { a: -360, r: 24, y: 7.5, yl: .8, off: 3.4 }], // high enough to see the keyboard on the tray
    exp0:    [{ a: -378, r: 25, y: .5, yl: 0, off: 1.4 }, { a: -381, r: 24.5, y: .4, yl: 0, off: 1.4 }],
    exp1:    [{ a: -338, r: 25, y: .4, yl: 0, off: 1.4 }, { a: -340, r: 24.5, y: .4, yl: 0, off: 1.4 }],
    exp2:    [{ a: -392, r: 25, y: .4, yl: 0, off: 1.4 }, { a: -394, r: 24.5, y: .4, yl: 0, off: 1.4 }],
    exp3:    [{ a: -346, r: 25, y: .4, yl: 0, off: 1.4 }, { a: -348, r: 24.5, y: .4, yl: 0, off: 1.4 }],
    exp4:    [{ a: -376, r: 25, y: .4, yl: 0, off: 1.4 }, { a: -378, r: 24.5, y: .4, yl: 0, off: 1.4 }],
    certs:   [{ a: -336, r: 26, y: -2.8, yl: .3 }, { a: -333, r: 25, y: -3.0, yl: .4 }],
    contact: [{ a: -322, r: 30, y: 9, yl: 3 }, { a: -318, r: 36, y: 13, yl: 5 }],
  };
  const sections = [...document.querySelectorAll('section[data-dev]')];
  let keys = [], VH = 0; const SEC_OF = {}; // device index → section index
  function computeKeys() {
    const max = document.documentElement.scrollHeight - innerHeight; keys = []; VH = innerHeight / max;
    sections.forEach((s, i) => {
      const di = +s.dataset.dev, dev = DEV[di], shots = SHOTS[s.dataset.shot] || SHOTS.exp0; SEC_OF[di] = i;
      const pA = Math.min(1, Math.max(0, s.offsetTop / max)), pB = Math.min(1, Math.max(0, (s.offsetTop + s.offsetHeight - innerHeight) / max));
      dev.pA = pA; dev.pB = pB;
      shots.forEach((sh, j) => { const f = shots.length === 1 ? .5 : j / (shots.length - 1); keys.push({ p: pA + (pB - pA) * f, a: sh.a * Math.PI / 180, r: sh.r, y: dev.y + sh.y, yl: dev.y + sh.yl, off: sh.off || 0 }); });
    });
  }
  const smooth = x => (x = Math.min(1, Math.max(0, x)), x * x * (3 - 2 * x));
  const camQ = new URLSearchParams(location.search).get('cam'); // debug: ?cam=azimuthDeg,radius,y,lookY overrides the shot list
  function shot(p) {
    if (camQ) { const [a, r, y, yl, lz, of] = camQ.split(',').map(Number); return { a: a * Math.PI / 180, r, y, yl, off: isNaN(of) ? 2 : of, lz: isNaN(lz) ? null : lz }; }
    if (p <= keys[0].p) return keys[0]; if (p >= keys[keys.length - 1].p) return keys[keys.length - 1];
    let i = 0; while (p > keys[i + 1].p) i++;
    const A = keys[i], B = keys[i + 1], k = smooth((p - A.p) / Math.max(1e-6, B.p - A.p));
    return { a: A.a + (B.a - A.a) * k, r: A.r + (B.r - A.r) * k, y: A.y + (B.y - A.y) * k, yl: A.yl + (B.yl - A.yl) * k, off: A.off + (B.off - A.off) * k };
  }
  let progress = 0, target = 0, snap = false;
  const readScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; target = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0; };
  let lastScroll = performance.now();
  addEventListener('scroll', () => { readScroll(); lastScroll = performance.now(); }, { passive: true });
  const q = new URLSearchParams(location.search), dbg = parseFloat(q.get('p'));
  if (!isNaN(dbg) && q.has('nopanel')) document.getElementById('hudpanel').style.display = 'none';
  function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); computeKeys(); readScroll(); if (!isNaN(dbg)) { target = progress = dbg; snap = true; } }
  if (!isNaN(dbg) && q.has('dump')) setTimeout(() => { const k = DEV[7]; console.log('DUMP p=' + progress.toFixed(3) + ' VH=' + VH.toFixed(4) + ' spans=' + JSON.stringify(DEV.map(d => [+d.pA.toFixed(3), +d.pB.toFixed(3)])) + ' focus=' + JSON.stringify(DEV.map(d => +d.focus.toFixed(2))) + ' hinge=' + (k.hinge ? k.hinge.rotation.x.toFixed(2) : 'n/a') + ' kvmZ=' + k.g.position.z.toFixed(2) + ' cam=' + camera.position.toArray().map(v => v.toFixed(1)).join(',')); }, 2500);
  addEventListener('resize', resize); resize(); addEventListener('load', resize); setTimeout(() => { resize(); if (!isNaN(dbg)) { target = progress = dbg; snap = true; } }, 900);

  // ---- HUD: telemetry readouts, section rail, leader line ----
  const $ = id => document.getElementById(id);
  const hudSec = $('hud-sec'), hudCam = $('hud-cam'), hudScroll = $('hud-scroll'), bar = $('bar');
  const rail = [...document.querySelectorAll('#rail a')];
  const leader = $('leader'), lPath = $('leader-path'), lDot = $('leader-dot'), lRing = $('leader-ring'), lEnd = $('leader-end'), lText = $('leader-text');
  // ---- summoned description panel: line draws from the device, the panel unfolds from the line ----
  const hp = $('hudpanel'); let curSec = -1, seq = 0, hpY = innerHeight / 2, hpTarget = innerHeight / 2, curBest = null, settledY = -1e9;
  function summon(si) { const my = ++seq; hp.classList.remove('open'); leader.classList.remove('drawn'); const first = curSec < 0; curSec = si;
    setTimeout(() => { if (my !== seq) return; const src = sections[si].querySelector('.panel'); hp.innerHTML = src ? src.outerHTML : ''; hpY = hpTarget;
      hp.style.top = hpY.toFixed(0) + 'px'; settledY = hpY; const rc = hp.getBoundingClientRect(); if (window.HUDLAYOUT) window.HUDLAYOUT.onSection(rc, curBest ? deviceRect(curBest) : null, rackRect(), rackHull(), curSec);
      leader.classList.add('drawn'); setTimeout(() => { if (my !== seq) return; hp.classList.add('open'); if (window.HUDLAYOUT) window.HUDLAYOUT.onSection(hp.getBoundingClientRect(), curBest ? deviceRect(curBest) : null, rackRect(), rackHull(), curSec); }, 300); }, first ? 0 : 220); }
  const NAMES = { hero: 'IDENT', skills: 'SKILLS', exp0: 'EXPERIENCE', exp1: 'EXPERIENCE', exp2: 'EXPERIENCE', exp3: 'EXPERIENCE', exp4: 'EXPERIENCE', writing: 'WRITING', certs: 'CREDENTIALS', contact: 'CONTACT' };
  const anchor = new THREE.Vector3(), anchorL = new THREE.Vector3(), corner = new THREE.Vector3();
  // screen-space bounding box of a device (its raised screen included), so floating instruments keep clear of what you're reading
  function rackHull() { const pts = []; const hw = W / 2 + RAIL + .3;
    for (const [x, y, z] of [[-hw, TOP + .8, .5], [hw, TOP + .8, .5], [-hw, BOTTOM - .8, .5], [hw, BOTTOM - .8, .5], [-hw, TOP + .8, -D - .5], [hw, TOP + .8, -D - .5], [-hw, BOTTOM - .8, -D - .5], [hw, BOTTOM - .8, -D - .5]]) {
      corner.set(x, y, z).project(camera); if (corner.z > 1 || corner.z < -1) return null; pts.push([(corner.x * .5 + .5) * innerWidth, (-corner.y * .5 + .5) * innerHeight]); }
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = []; for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    const up = []; for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); }
  function rackRect() { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const hw = W / 2 + RAIL + .3;
    [[-hw, TOP + .8, .5], [hw, TOP + .8, .5], [-hw, BOTTOM - .8, .5], [hw, BOTTOM - .8, .5], [-hw, TOP + .8, -D - .5], [hw, TOP + .8, -D - .5], [-hw, BOTTOM - .8, -D - .5], [hw, BOTTOM - .8, -D - .5]].forEach(([x, y, z]) => {
      corner.set(x, y, z).project(camera); if (corner.z > 1 || corner.z < -1) return; const sx = (corner.x * .5 + .5) * innerWidth, sy = (-corner.y * .5 + .5) * innerHeight; x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy); });
    return x0 < x1 ? { x: Math.max(0, x0), y: Math.max(0, y0), w: Math.min(innerWidth, x1) - Math.max(0, x0), h: Math.min(innerHeight, y1) - Math.max(0, y0) } : null; }
  function deviceRect(d) { const top = d.h / 2 + (d.type === 'kvm' ? 5.2 : 0), bot = d.type === 'switch' ? -7 : d.type === 'kvm' ? .6 : -d.h / 2, zf = .3 + d.g.position.z; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const pts = [[-W / 2, bot, zf], [W / 2, bot, zf], [-W / 2, top, zf], [W / 2, top, zf]];
    if (d.type === 'switch') pts.push([-W / 2, bot, -D - 1.2], [W / 2, bot, -D - 1.2], [-W / 2, top, -D - 1.2], [W / 2, top, -D - 1.2]);
    pts.forEach(([x, y, z]) => {
      corner.set(x, d.y + y, z).project(camera); if (corner.z > 1 || corner.z < -1) return; const sx = (corner.x * .5 + .5) * innerWidth, sy = (-corner.y * .5 + .5) * innerHeight; x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy); });
    return x0 < x1 ? { x: Math.max(0, x0), y: Math.max(0, y0), w: Math.min(innerWidth, x1) - Math.max(0, x0), h: Math.min(innerHeight, y1) - Math.max(0, y0) } : null; }
  const goal = new THREE.Vector3(), look = new THREE.Vector3();
  const WEDGE_OF = [0, 1, 2, 3, 3, 3, 3, 3, 4, 5];
  let last = performance.now(), t = 0, tick = 0;
  const PERF = q.has('perf') ? { frames: 0, js: 0, render: 0 } : null;
  if (new URLSearchParams(location.search).has('bus')) setTimeout(() => {
    const sw = DEV.find(d => d.type === 'switch');
    console.log('BUS ' + JSON.stringify((sw.pulses || []).map((pd, i) => {
      const pts = pd.userData.path.curves; const last = pts[pts.length - 1].v2, first = pts[0].v1;
      return { bus: i, srcX: +first.x.toFixed(2), dstX: +last.x.toFixed(2), dstY: +last.y.toFixed(2) }; })));
  }, 4000);
  if (PERF) setTimeout(() => { const m = performance.memory || {}, inf = renderer.info; console.log('PERF ' + JSON.stringify({ kvm: (() => { const k = DEV.find(d => d.type === 'kvm'); return k ? { F: +k.focus.toFixed(2), slide: +k.g.position.z.toFixed(2), hinge: +k.hinge.rotation.x.toFixed(2), scrOp: +k.screen.material.opacity.toFixed(2), y: k.y } : null; })(), camPos: camera.position.toArray().map(v => +v.toFixed(2)), camNaN: camera.matrixWorldInverse.elements.some(v => Number.isNaN(v)) || camera.projectionMatrix.elements.some(v => Number.isNaN(v)), lookNaN: [look.x, look.y, look.z].some(v => Number.isNaN(v)), shotNow: (() => { const sh = shot(progress); return [+(sh.a * 180 / Math.PI).toFixed(1), +sh.r.toFixed(1), +sh.y.toFixed(1), +sh.yl.toFixed(1), sh.off]; })(), frames: PERF.frames, avgJsMs: +(PERF.js / PERF.frames).toFixed(2), avgRenderMs_swiftshader: +(PERF.render / PERF.frames).toFixed(2), heapUsedMB: +(m.usedJSHeapSize / 1048576).toFixed(1), heapTotalMB: +(m.totalJSHeapSize / 1048576).toFixed(1), drawCalls: inf.render.calls, triangles: inf.render.triangles, lines: inf.render.lines, geometries: inf.memory.geometries, textures: inf.memory.textures, programs: inf.programs.length, domNodes: document.getElementsByTagName('*').length, dpr: renderer.getPixelRatio(), canvas: [renderer.domElement.width, renderer.domElement.height] })); }, 4500);
  let skip = false;
  function frame(now) {
    // idle throttle: nothing has scrolled for 2s → render every other frame (30fps); scrolling restores 60fps instantly
    if (!reduced && now - lastScroll > 2000 && Math.abs(target - progress) < 1e-4) { skip = !skip; if (skip) { requestAnimationFrame(frame); return; } }
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; tick++; const t0 = PERF ? performance.now() : 0;
    progress += (target - progress) * .1; const p = progress; bar.style.transform = `scaleX(${p})`;
    const s = shot(p), drift = reduced ? 0 : 1;
    const a = s.a + Math.sin(t * .23) * .012 * drift, r = s.r + Math.sin(t * .31) * .12 * drift;
    goal.set(Math.sin(a) * r, s.y + Math.sin(t * .27) * .08 * drift, CZ + Math.cos(a) * r);
    const off = s.off || Math.min(2.4, Math.max(1.2, (r - 6) * .11));
    look.set(Math.cos(a) * off, s.yl, s.lz != null ? s.lz : CZ - Math.sin(a) * off);
    if (snap) { camera.position.copy(goal); snap = false; } else camera.position.lerp(goal, .1);
    camera.lookAt(look);
    aisle.position.set(Math.sin(a) * (r * .45), s.y + 1.6, CZ + Math.cos(a) * (r * .45));

    let best = null, bestF = 0, bestI = -1; const rear = smooth((1 - Math.cos(a)) / 2), rf = .15 + .85 * rear; // 0 at the front, 1 behind the rack
    DEV.forEach((d, i) => {
      const f = d.pA === undefined ? 0 : 1 - smooth((p < d.pA ? d.pA - p : p > d.pB ? p - d.pB : 0) / (VH * .55));
      d.focus += (f - d.focus) * .12; const F = reduced ? (f > .5 ? 1 : 0) : d.focus;
      if (F > bestF) { bestF = F; best = d; bestI = i; }
      d.g.position.z = d.slideMax * F; const glow = .12 + F * .88;
      d.mats.forEach(([m, b, dl]) => { m.opacity = b + F * dl; });
      d.edges.forEach(e => { e.material.opacity = .45 + F * .55; });
      d.leds.forEach(l => { const b = l.userData.blink, pulse = b && !reduced ? (.55 + .45 * Math.sin(t * (b === 1 ? 5 : 13) + l.userData.phase)) : 1; setLed(l, glow * pulse); });
      if (d.label) { const L = d.label; // hysteresis: retype on focus, revert only once the camera has clearly left
        const want = F > .55 ? L.company : F < .25 ? L.host : null;
        if (want && want !== L.want) { L.want = want; L.phase = 'del'; L.acc = 0; }
        if (L.phase === 'del') { L.acc += dt; while (L.acc >= .035 && L.shown.length) { L.acc -= .035; L.shown = L.shown.slice(0, -1); L.dirty = true; } if (!L.shown.length) { L.phase = 'type'; L.acc = 0; } }
        else if (L.phase === 'type') { L.acc += dt; while (L.acc >= .05 && L.shown.length < L.want.length) { L.acc -= .05; L.shown = L.want.slice(0, L.shown.length + 1); L.dirty = true; } if (L.shown.length === L.want.length) { L.phase = 'idle'; L.dirty = true; } }
        if (L.dirty) { L.draw(L.shown, L.phase !== 'idle'); L.dirty = false; } }
      if (d.billboards) d.billboards.forEach(o => o.quaternion.copy(camera.quaternion));
      if (d.rearMats) d.rearMats.forEach(([m, b]) => { m.opacity = b * rf; });
      if (d.type === 'switch' && d.pulses) d.pulses.forEach(pd => { const u = pd.userData; if (!reduced) u.t = (u.t + dt * u.speed * (.2 + F)) % 1; const pt = u.path.getPointAt(Math.min(u.t, .999)); if (pt) pd.position.copy(pt); /* CurvePath.getPointAt can return null at the seam */ pd.material.opacity = (.25 + F * .75) * rf; pd.material.transparent = true; });
      if (d.type === 'switch') d.ports.forEach((l, j) => { const on = smooth(F * 40 - j), pulse = reduced ? 1 : (.7 + .3 * Math.sin(t * 9 + l.userData.phase)); setLed(l, .1 + on * pulse); });
      if (d.type === 'kvm') { const hq = new URLSearchParams(location.search).get('hinge'); d.hinge.rotation.x = hq !== null ? +hq : -smooth(F * 1.15) * 1.62; d.screen.material.opacity = F * .95; d.kb.material.opacity = F * .7; } // lid rises from the rear to ~93°, screen faces the front (?hinge= overrides for debugging)
      if (d.type === 'ups') d.screen.material.opacity = .12 + F * .8;
    });

    const secIdx = bestI >= 0 ? SEC_OF[bestI] : -1; curBest = best;
    // the panel sits at the focused device's height and tracks it gently
    if (best) { const dr = deviceRect(best); if (dr) { const hh = hp.offsetHeight / 2, ct = document.getElementById('charts-top'), cb = document.getElementById('charts-bottom');
      const lo = (ct && ct.offsetWidth ? ct.getBoundingClientRect().bottom + 12 : 70) + hh, hi = (cb && cb.offsetWidth ? cb.getBoundingClientRect().top - 12 : innerHeight - 20) - hh;
      hpTarget = lo <= hi ? Math.min(hi, Math.max(lo, dr.y + dr.h / 2)) : lo; } } // the panel keeps to the band between the chart blocks; if taller than the band it sits below the top block and may cover the bottom charts (it wins by z-index)
    if (secIdx >= 0 && secIdx !== curSec) summon(secIdx);
    hpY += (hpTarget - hpY) * .06; hp.style.top = hpY.toFixed(1) + 'px';
    // self-correcting: re-check overlaps once a second (cheap, idempotent) and whenever the panel has drifted
    if (curSec >= 0 && window.HUDLAYOUT && (tick % 60 === 0 || (tick % 30 === 0 && Math.abs(hpY - settledY) > 24))) { settledY = hpY; window.HUDLAYOUT.onSection(hp.getBoundingClientRect(), best ? deviceRect(best) : null, rackRect(), rackHull(), curSec); }
    // HUD readouts (every 2nd frame is plenty)
    if (tick % 2 === 0) {
      const deg = ((s.a * 180 / Math.PI) % 360 + 540) % 360 - 180;
      hudCam.textContent = `CAM AZ ${deg.toFixed(1).padStart(6)}°  R ${s.r.toFixed(1)}`;
      hudScroll.textContent = `SCROLL ${String(Math.round(p * 100)).padStart(3)}%`;
      const secName = secIdx >= 0 ? NAMES[sections[secIdx].dataset.shot] : '—';
      hudSec.textContent = `SEC ${String(secIdx + 1).padStart(2, '0')}/${String(sections.length).padStart(2, '0')}  ${secName}`;
      rail.forEach((el, i) => el.classList.toggle('on', i === WEDGE_OF[secIdx]));
      const hub = document.getElementById('hub-n'); if (hub) hub.textContent = String(secIdx + 1).padStart(2, '0');
      const arc = document.getElementById('hub-arc'); if (arc) arc.setAttribute('stroke-dasharray', `${(p * 100).toFixed(1)} 100`);
    }
    // indicator line: focused device's near corner → the panel's left edge at its midline
    if (best && bestF > .35 && curSec >= 0) {
      anchor.set(W / 2 - .35, best.y + best.h / 2 - .12, .3 + best.g.position.z).project(camera);
      anchorL.set(-W / 2 + .35, best.y + best.h / 2 - .12, .3 + best.g.position.z).project(camera);
      if (anchorL.x > anchor.x && anchorL.z < 1) anchor.copy(anchorL);
      const ax = (anchor.x * .5 + .5) * innerWidth, ay = (-anchor.y * .5 + .5) * innerHeight, rc = hp.getBoundingClientRect();
      if (anchor.z < 1 && rc.width > 0) {
        const px = rc.left, py = hpY, kx = ax + (px - ax) * .45;
        lPath.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)} L${kx.toFixed(1)},${ay.toFixed(1)} L${px.toFixed(1)},${py.toFixed(1)}`);
        lDot.setAttribute('cx', ax.toFixed(1)); lDot.setAttribute('cy', ay.toFixed(1)); lRing.setAttribute('cx', ax.toFixed(1)); lRing.setAttribute('cy', ay.toFixed(1)); lEnd.setAttribute('x', (px - 3).toFixed(1)); lEnd.setAttribute('y', (py - 3).toFixed(1));
        lText.setAttribute('x', (ax - 9).toFixed(1)); lText.setAttribute('y', (ay - 9).toFixed(1)); lText.setAttribute('text-anchor', 'end');
        const shotName = sections[curSec].dataset.shot, m = /^exp(\d)$/.exec(shotName);
        lText.textContent = `${best.hU}U · ${best.type.toUpperCase()}${m ? ' ' + String(+m[1] + 1).padStart(2, '0') : ''}`;
        leader.style.opacity = Math.min(1, (bestF - .35) * 2.2);
      } else leader.style.opacity = 0;
    } else leader.style.opacity = 0;

    const t1 = PERF ? performance.now() : 0; renderer.render(scene, camera); if (PERF) { PERF.frames++; PERF.js += t1 - t0; PERF.render += performance.now() - t1; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
