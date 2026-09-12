/* emanzk.com HUD instruments: five logs, five charts, floating layout manager. Monochrome cyan. Every feed is synthetic and labelled SIM. */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, q = new URLSearchParams(location.search);
  if (q.has('hover')) document.getElementById('radial').classList.add('hover');
  // seeded RNG when ?seed= is given (reproducible screenshots); Math.random otherwise
  let rnd = Math.random; if (q.has('seed')) { let a = (parseInt(q.get('seed'), 10) || 1) >>> 0; rnd = () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const n = (k = 9) => 1 + Math.floor(rnd() * k), pick = a => a[Math.floor(rnd() * a.length)], pid = () => 1000 + n(8999), hex = () => Math.floor(rnd() * 0xfffff).toString(16).padStart(5, '0');
  const pad = x => String(x).padStart(2, '0'), ts = () => { const d = new Date(); return `<i>[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]</i> `; };
  const CY = '34,211,238';

  // ---------- logs ----------
  const LOGS = {
    fw:   { keep: 6, every: [900, 1600], gen: () => { const blk = rnd() < .35, src = `${pick(['203.0.113', '198.51.100'])}.${n(250)}`, port = pick([22, 443, 80, 5060, 3389, 8443]); return ts() + `<b>${blk ? 'block' : 'pass '}</b> in  wan  ${rnd() < .7 ? 'tcp' : 'udp'}  ${src}:${10000 + n(50000)} → :${port}`; } },
    jr:   { keep: 6, every: [1200, 2200], gen: () => ts() + pick([`systemd[1]: Started <b>caddy.service</b>`, `kernel: eth0: link up 1000Mbps full duplex`, `sshd[${pid()}]: Accepted publickey for emanzk from 100.64.0.${n()}`, `cron[${pid()}]: (root) CMD (gravity-sync)`, `systemd[1]: <b>cloudflared.service</b>: watchdog ok`, `pihole-FTL[${pid()}]: gravity updated · 1.2M domains`, `sudo: emanzk : TTY=pts/0 ; COMMAND=/usr/bin/systemctl reload caddy`]) },
    app:  { keep: 6, every: [700, 1500], gen: () => ts() + `{"lvl":"${pick(['info', 'info', 'info', 'warn'])}","svc":"${pick(['api', 'auth', 'worker'])}","msg":"${pick(['GET /users 200', 'POST /login 401', 'job dequeued', 'cache miss /System/Info', 'GET /health 200', 'token refreshed'])}","ms":${5 + n(80)}}` },
    pipe: { keep: 6, every: [1500, 2600], gen: () => { const st = pick(['●', '●', '●', '○', '✕']), job = pick(['gate:born-clean', 'test:harness', 'build:image', 'scan:gitleaks', 'deploy:worker']); return `${st} <b>#${4800 + n(99)}</b> ${job.padEnd(16)} ${st === '○' ? 'running' : st === '✕' ? 'failed  4s' : 'passed ' + (5 + n(80)) + 's'}`; } },
    ai:   { keep: 5, every: [1800, 3200], gen: () => pick([`<b>agent ▸</b> proposing fix for ${pick(['var_pam_wheel_group_for_su', 'ensure_pam_wheel_group_empty', 'sshd_disable_root_login', 'accounts_umask_etc_login_defs'])}`, `<b>gate ◂</b> rejected · probes failed: unreachable — the fix locked out ssh`, `<b>agent ▸</b> revised remediation · keeping sugroup, tightening pam_wheel`, `<b>gate ◂</b> accepted · target fixed · no regression · survived reboot`, `<b>harness ▸</b> clone 91${n()} → apply → scan → probe → reboot → judge → destroy`, `<b>judge ◂</b> regressed ensure_pam_wheel_group_empty — the ratchet caught it`]) },
  };
  Object.entries(LOGS).forEach(([k, L]) => { const box = document.querySelector(`#w-${k} .lines`); if (!box) return; const lines = [];
    const add = () => { lines.push(`<span class="ln">${L.gen()}</span>`); if (lines.length > L.keep) lines.shift(); box.innerHTML = lines.join(''); if (!reduced) setTimeout(add, L.every[0] + rnd() * (L.every[1] - L.every[0])); };
    for (let i = 0; i < L.keep; i++) lines.push(`<span class="ln">${L.gen()}</span>`); box.innerHTML = lines.join(''); if (!reduced) setTimeout(add, L.every[0]); });

  // ---------- ghost logs: borderless, typed character by character, accumulating downward ----------
  const GHOST = {
    a: ['usb 1-3: new high-speed USB device number %n using xhci_hcd', 'nvme0n1: p1 p2 p3', 'br0: port 2(veth%h) entered forwarding state', 'audit: type=1400 apparmor="ALLOWED" operation="open"', 'systemd-journald[%p]: Journal started', 'docker0: port 1(veth%h) entered blocking state', 'EXT4-fs (dm-0): mounted filesystem with ordered data mode', 'IPv6: ADDRCONF(NETDEV_CHANGE): eth0: link becomes ready', 'kvm: enabled nested virtualization', 'random: crng init done'],
    b: ['default  Normal   Scheduled     pod/api-%h        Successfully assigned default/api-%h to node-0%n', 'default  Normal   Pulled        pod/api-%h        Container image "registry.internal/api:1.4.%n" already present', 'default  Normal   Created       pod/api-%h        Created container api', 'argocd   Normal   ResourceUpdated app/cms-portal    Updated health status: Healthy', 'default  Warning  BackOff       pod/worker-%h     Back-off restarting failed container', 'kube-system Normal LeaderElection lease/kube-scheduler node-0%n became leader', 'default  Normal   Killing       pod/api-%h        Stopping container api', 'monitoring Normal  Sync          app/monitoring    Successfully synced'] };
  const uptime = { t: 1200 + rnd() * 900 };
  Object.entries(GHOST).forEach(([k, pool]) => { const box = document.getElementById('ghost-' + k); if (!box) return; const lines = []; let cur = '', target = '', i = 0;
    const nextLine = () => { uptime.t += .4 + rnd() * 2.3; target = (k === 'a' ? `[${uptime.t.toFixed(6).padStart(12)}] ` : '') + pick(pool).replace(/%h/g, hex()).replace(/%n/g, String(n())).replace(/%p/g, String(pid())); i = 0; cur = ''; };
    const draw = () => { box.innerHTML = [...lines, cur].map(l => `<span class="ln">${l}</span>`).join(''); };
    nextLine(); draw();
    if (!reduced) { const tick = () => { if (i < target.length) { i = Math.min(target.length, i + 2); cur = target.slice(0, i); draw(); setTimeout(tick, 22); } else { lines.push(cur); if (lines.length > 6) lines.shift(); setTimeout(() => { nextLine(); tick(); }, 700 + rnd() * 1600); } }; tick(); } else { lines.push(target); draw(); } });

  // ---------- charts ----------
  const canvas = (id) => { const cv = document.querySelector(`#w-${id} canvas`); if (!cv) return null; const w = +cv.dataset.w, h = +cv.dataset.h, dpr = Math.min(devicePixelRatio, 2); cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; const g = cv.getContext('2d'); g.scale(dpr, dpr); return { g, w, h }; };
  const grid = (g, w, h, sx, sy) => { g.strokeStyle = `rgba(${CY},.13)`; g.lineWidth = 1; for (let x = 0; x <= w; x += sx) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, h); g.stroke(); } for (let y = 0; y <= h; y += sy) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke(); } };
  const loop = (fn, ms) => { fn(); if (!reduced) setInterval(fn, ms); };
  // sparkline
  (() => { const c = canvas('tele'); if (!c) return; const { g, w, h } = c; const N = 90, A = [], B = []; let t = 0;
    const next = () => { t += .07; A.push(30 + 18 * Math.sin(t * 1.3) + 9 * Math.sin(t * 3.7) + rnd() * 6); B.push(50 + 22 * Math.sin(t * .7 + 1) + 8 * Math.sin(t * 2.9) + rnd() * 8); if (A.length > N) { A.shift(); B.shift(); } };
    for (let i = 0; i < N; i++) next();
    loop(() => { next(); g.clearRect(0, 0, w, h); grid(g, w, h, 23, 21);
      const line = (arr, al, lw) => { g.strokeStyle = `rgba(${CY},${al})`; g.lineWidth = lw; g.beginPath(); arr.forEach((v, i) => { const x = i / (N - 1) * w, y = h - v / 100 * h; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
      line(B, .4, 1); line(A, .95, 1.5); const la = A[A.length - 1], lb = B[B.length - 1]; g.fillStyle = '#22d3ee'; g.fillRect(w - 4, h - la / 100 * h - 2, 4, 4);
      const v = document.querySelector('#w-tele .vals'); if (v) v.innerHTML = `<span>cpu<b>${la.toFixed(0)}%</b></span><span>net<b>${(lb / 40).toFixed(2)} Mb/s</b></span><span>load<b>${(la / 25).toFixed(2)}</b></span>`; }, 120); })();
  // heatmap 7 x 24
  (() => { const c = canvas('heat'); if (!c) return; const { g, w, h } = c; const cols = 24, rows = 7, cw = w / cols, ch = h / rows; const M = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, cc) => Math.max(0, Math.min(1, .25 + .5 * Math.sin(cc / 3.8 + r) + rnd() * .3))));
    loop(() => { for (let k = 0; k < 6; k++) { const r = Math.floor(rnd() * rows), cc = Math.floor(rnd() * cols); M[r][cc] = Math.max(0, Math.min(1, M[r][cc] + (rnd() - .5) * .35)); }
      g.clearRect(0, 0, w, h); for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) { const v = M[r][cc]; g.fillStyle = `rgba(${CY},${(.06 + v * .8).toFixed(3)})`; g.fillRect(cc * cw + 1, r * ch + 1, cw - 2, ch - 2); } }, 1000); })();
  // bars
  (() => { const c = canvas('bars'); if (!c) return; const { g, w, h } = c; const N = 14, V = Array.from({ length: N }, () => 20 + rnd() * 70);
    loop(() => { for (let i = 0; i < N; i++) V[i] = Math.max(6, Math.min(98, V[i] + (rnd() - .5) * 14)); g.clearRect(0, 0, w, h); grid(g, w, h, w / 7, h / 4);
      const bw = w / N; V.forEach((v, i) => { const bh = v / 100 * (h - 6), x = i * bw + 3; g.fillStyle = `rgba(${CY},${i === N - 1 ? .95 : .45})`; g.fillRect(x, h - bh, bw - 6, bh); g.strokeStyle = `rgba(${CY},.9)`; g.lineWidth = 1; g.strokeRect(x + .5, h - bh + .5, bw - 7, bh - 1); });
      const v = document.querySelector('#w-bars .vals'); if (v) v.innerHTML = `<span>req/s<b>${(V[N - 1] * 3.2).toFixed(0)}</b></span><span>p95<b>${(40 + V[N - 1]).toFixed(0)}ms</b></span>`; }, 600); })();
  // gauges: one drawing routine, three instruments
  const gauge = (id, initial, step, fmt, sub) => { const c = canvas(id); if (!c) return; const { g, w, h } = c; let v = initial; const cx = w / 2, cy = h - 10, R = Math.min(w / 2 - 8, h - 18);
    loop(() => { v = step(v); g.clearRect(0, 0, w, h);
      g.lineWidth = 1; g.strokeStyle = `rgba(${CY},.35)`; g.beginPath(); g.arc(cx, cy, R, Math.PI, 2 * Math.PI); g.stroke(); g.beginPath(); g.arc(cx, cy, R - 14, Math.PI, 2 * Math.PI); g.stroke();
      for (let i = 0; i <= 20; i++) { const a = Math.PI + i / 20 * Math.PI, big = i % 5 === 0, r1 = R - (big ? 8 : 4); g.strokeStyle = `rgba(${CY},${big ? .9 : .45})`; g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
      const { frac, text, foot } = fmt(v); g.lineWidth = 10; g.strokeStyle = `rgba(${CY},.85)`; g.beginPath(); g.arc(cx, cy, R - 7, Math.PI, Math.PI + Math.max(0, Math.min(1, frac)) * Math.PI); g.stroke();
      g.fillStyle = 'rgba(230,241,255,.92)'; g.font = `700 ${h < 75 ? 13 : 17}px "JetBrains Mono", monospace`; g.textAlign = 'center'; g.fillText(text, cx, cy - 3); g.fillStyle = 'rgba(120,150,180,.9)'; g.font = '7px "JetBrains Mono", monospace'; g.fillText(foot || sub, cx, cy + 7); }, 300); };
  gauge('gauge', 62, v => Math.max(3, Math.min(97, v + (rnd() - .5) * 9)), v => ({ frac: v / 100, text: v.toFixed(0) + '%' }), 'ERROR BUDGET LEFT');
  gauge('sli', 99.93, v => Math.max(99.80, Math.min(99.99, v + (rnd() - .5) * .02)), v => ({ frac: (v - 99.5) / .5, text: v.toFixed(2) + '%' }), '30D ROLLING');
  gauge('sla', 99.94, v => Math.max(99.85, Math.min(100, v + (rnd() - .5) * .015)), v => ({ frac: (v - 99.5) / .5, text: v.toFixed(2) + '%', foot: +v.toFixed(2) >= 99.9 ? 'TARGET 99.9 · MET' : 'TARGET 99.9 · AT RISK' }), '');
  // honeycomb
  (() => { const c = canvas('hex'); if (!c) return; const { g, w, h } = c; const cols = 7, rows = 4, r = Math.min(w / (cols * 1.75 + .9), h / (rows * 1.55 + .6)); const S = Array.from({ length: rows * cols }, () => rnd() < .78 ? 1 : 0); let alert = Math.floor(rnd() * S.length), blink = 0;
    const hex = (x, y, rr) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; const px = x + rr * Math.cos(a), py = y + rr * Math.sin(a); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); };
    loop(() => { if (rnd() < .5) { const i = Math.floor(rnd() * S.length); S[i] = S[i] ? 0 : 1; } if (rnd() < .12) alert = Math.floor(rnd() * S.length); blink = !blink; g.clearRect(0, 0, w, h);
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) { const i = row * cols + col, x = r * 1.05 + col * r * 1.75 + (row % 2) * r * .875, y = r * 1.05 + row * r * 1.52; hex(x, y, r * .9);
        if (i === alert) { g.fillStyle = `rgba(${CY},${blink ? .95 : .25})`; g.fill(); } else if (S[i]) { g.fillStyle = `rgba(${CY},.55)`; g.fill(); } g.strokeStyle = `rgba(${CY},.7)`; g.lineWidth = 1; g.stroke(); }
      const v = document.querySelector('#w-hex .vals'); if (v) v.innerHTML = `<span>pods<b>${S.reduce((a, b) => a + b, 0)}/${S.length}</b></span><span>alert<b>1</b></span>`; }, 900); })();

  // ---------- floating layout manager ----------
  const W = [...document.querySelectorAll('.fl')]; if (!W.length) return; const isPin = el => el.classList.contains('ghost'); // ghosts are placed but never capped or rotated
  const capped = () => [...placed.keys()].filter(el => !isPin(el)).length;
  const PAD = 12, placed = new Map(), NOMOVE = q.has('nomove'), MAXVIS = 3; // three floating logs on screen at a time; each section change retires the oldest and brings in the longest-hidden
  const shownAt = new Map(), hiddenAt = new Map(); let clock = 0;
  const inter = (a, b, p = PAD) => !(a.x + a.w + p <= b.x || b.x + b.w + p <= a.x || a.y + a.h + p <= b.y || b.y + b.h + p <= a.y);
  let panelRect = null, deviceRect = null, rackRect = null, rackHull = null; const HUDLOG = q.has('hudlog');
  // rect vs convex polygon (separating axis) — the rack's silhouette is a hard keep-out
  const hits = (r, poly, pad = 8) => { if (!poly || poly.length < 3) return false; const rp = [[r.x - pad, r.y - pad], [r.x + r.w + pad, r.y - pad], [r.x + r.w + pad, r.y + r.h + pad], [r.x - pad, r.y + r.h + pad]];
    const axes = []; [rp, poly].forEach(P => { for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; axes.push([-(b[1] - a[1]), b[0] - a[0]]); } });
    for (const [ax, ay] of axes) { let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity; for (const [x, y] of rp) { const d = x * ax + y * ay; a0 = Math.min(a0, d); a1 = Math.max(a1, d); } for (const [x, y] of poly) { const d = x * ax + y * ay; b0 = Math.min(b0, d); b1 = Math.max(b1, d); } if (a1 < b0 || b1 < a0) return false; } return true; };
  const exclusions = () => { const vw = innerWidth, vh = innerHeight, ex = [{ x: 0, y: 0, w: vw, h: 58 }, { x: 0, y: vh / 2 - 235, w: 235, h: 470 }, { x: 0, y: vh - 16, w: vw, h: 16 }];
    ex.push(panelRect ? { x: panelRect.left - 24, y: panelRect.top - 24, w: panelRect.width + 48, h: panelRect.height + 48 } : { x: vw * .6, y: vh * .18, w: vw * .4, h: vh * .64 });
    if (deviceRect) ex.push({ x: deviceRect.x - 10, y: deviceRect.y - 10, w: deviceRect.w + 20, h: deviceRect.h + 20 });
    document.querySelectorAll('.static').forEach(el => { const b = el.getBoundingClientRect(); if (b.width) ex.push({ x: b.left, y: b.top, w: b.width, h: b.height }); }); return ex; };
  const rectOf = el => ({ w: el.offsetWidth, h: el.offsetHeight });
  const freeSpot = (el, avoidSelf, extra) => { const { w, h } = rectOf(el), ex = exclusions().concat(extra || []), others = [...placed.entries()].filter(([k]) => k !== el).map(([, r]) => r);
    let fallback = null;
    for (let i = 0; i < 260; i++) { const x = 18 + rnd() * Math.max(1, innerWidth - w - 36), y = 62 + rnd() * Math.max(1, innerHeight - h - 82), r = { x, y, w, h };
      if (ex.some(e => inter(r, e, 6)) || others.some(o => inter(r, o))) continue; if (avoidSelf && inter(r, avoidSelf, -40)) continue;
      if (hits(r, rackHull)) continue; return r; }
    for (let y = 62; y <= innerHeight - h - 20; y += 8) for (let x = 18; x <= innerWidth - w - 18; x += 16) { const r = { x, y, w, h };
      if (ex.some(e => inter(r, e, 6)) || others.some(o => inter(r, o))) continue; if (avoidSelf && inter(r, avoidSelf, -40)) continue;
      if (hits(r, rackHull)) continue; return r; }
    return null; };
  const put = (el, r, instant) => { if (!placed.has(el)) shownAt.set(el, ++clock); placed.set(el, r); if (instant || NOMOVE) { el.style.transition = 'none'; } el.style.transform = `translate(${r.x.toFixed(0)}px,${r.y.toFixed(0)}px)`; el.style.visibility = 'visible'; if (instant || NOMOVE) { void el.offsetHeight; el.style.transition = ''; } };
  const hide = (el) => { if (placed.has(el)) hiddenAt.set(el, ++clock); placed.delete(el); el.style.visibility = 'hidden'; };
  function layout() { placed.clear(); W.forEach(el => { if (!isPin(el) && capped() >= MAXVIS) { hide(el); return; } const r = freeSpot(el); r ? put(el, r, true) : hide(el); }); }
  // hysteresis: placement keeps an 8px margin from every keep-out, but a placed widget is only evicted on a real overlap (so camera drift never churns the layout)
  function settle() { const ex = exclusions(); W.forEach(el => { const r = placed.get(el); if (r && (ex.some(e => inter(r, e, -4)) || hits(r, rackHull, -4))) { const nr = freeSpot(el); nr ? put(el, nr) : hide(el); } });
    // refill: bring hidden instruments back until the cap is reached, so a section with a large keep-out doesn't leave the screen sparse
    [...W].filter(el => !placed.has(el)).sort((p, q2) => (hiddenAt.get(p) || 0) - (hiddenAt.get(q2) || 0)).forEach(el => { if (!isPin(el) && capped() >= MAXVIS) return; const r = freeSpot(el); if (r) put(el, r, true); }); }
  function rotate() { const hid = W.filter(el => !placed.has(el) && !isPin(el)); if (!hid.length || capped() < MAXVIS) return; const oldest = [...placed.keys()].filter(el => !isPin(el)).sort((p, q2) => (shownAt.get(p) || 0) - (shownAt.get(q2) || 0))[0]; if (oldest) hide(oldest); }
  layout(); addEventListener('resize', () => { settle(); }); // a resize re-checks what's placed and refills; it never scrambles the layout
  if (HUDLOG) setTimeout(() => console.log('HUDFINAL ' + JSON.stringify({ vis: [...placed.entries()].map(([el, r]) => [el.id, Math.round(r.x), Math.round(r.y)]), hull: rackHull && rackHull.map(p => p.map(Math.round)), dom: W.filter(el => el.style.visibility === 'visible').map(el => { const b = el.getBoundingClientRect(); return [el.id, Math.round(b.left), Math.round(b.top)]; }), panel: panelRect && [Math.round(panelRect.left), Math.round(panelRect.top), Math.round(panelRect.width), Math.round(panelRect.height)] })), 5500);
  // panel-path eviction: a description panel scrolling toward its pinned spot pushes any instrument out of its column before it gets there
  function onPanels(rects) { if (!rects || !rects.length) return; const vh = innerHeight;
    rects.forEach(rc => { const pinnedTop = (vh - rc.height) / 2, pinnedBot = pinnedTop + rc.height;
      const y0 = Math.min(rc.top, pinnedTop) - 24, y1 = Math.max(rc.bottom, pinnedBot) + 24, band = { x: rc.left - 24, y: y0, w: rc.width + 48, h: y1 - y0 }, column = { x: rc.left - 24, y: 0, w: rc.width + 48, h: vh };
      W.forEach(el => { const r = placed.get(el); if (!r || !inter(r, band, 0)) return; const nr = freeSpot(el, null, [column]); nr ? put(el, nr) : hide(el); }); }); }
  let lastPanelKey = '';
  window.HUDLAYOUT = { onPanels, onSection(rect, dev, rack, hull, sec) { panelRect = rect && rect.width && rect.bottom > 0 && rect.top < innerHeight ? rect : panelRect; deviceRect = dev || null; rackRect = rack || null; if (hull !== undefined) rackHull = hull;
    const key = sec === undefined ? '' : String(sec); if (key && key !== lastPanelKey) { lastPanelKey = key; rotate(); } settle(); // rotate only when the section actually changes
    if (HUDLOG) console.log('HUDLOG ' + JSON.stringify({ sizes: W.map(el => [el.id, el.offsetWidth, el.offsetHeight]), vis: [...placed.entries()].map(([el, r]) => [el.id, Math.round(r.x), Math.round(r.y)]), panel: panelRect && [Math.round(panelRect.left), Math.round(panelRect.top), Math.round(panelRect.width), Math.round(panelRect.height)], dev: deviceRect && [Math.round(deviceRect.x), Math.round(deviceRect.y), Math.round(deviceRect.w), Math.round(deviceRect.h)], rack: rackRect && [Math.round(rackRect.x), Math.round(rackRect.y), Math.round(rackRect.w), Math.round(rackRect.h)] })); } };
})();
