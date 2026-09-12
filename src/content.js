/* content.js — every value on the site comes from content.json.
   Loads the data, builds the description panels, then boots the scene (rack page only). */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inline = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // minimal markdown: ## heading, ``` fence, - list, > quote, blank-line paragraphs
  function md(src) {
    const out = []; let i = 0, list = null, para = [];
    const flush = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
    const endList = () => { if (list) { out.push('<ul>' + list.map(t => '<li>' + inline(t) + '</li>').join('') + '</ul>'); list = null; } };
    const lines = String(src).split('\n');
    while (i < lines.length) {
      const ln = lines[i];
      if (ln.startsWith('```')) { flush(); endList(); const buf = []; i++;
        while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]); i++;
        out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>'); continue; }
      if (ln.startsWith('## ')) { flush(); endList(); out.push('<h2>' + inline(ln.slice(3)) + '</h2>'); i++; continue; }
      if (ln.startsWith('> ')) { flush(); endList(); out.push('<blockquote>' + inline(ln.slice(2)) + '</blockquote>'); i++; continue; }
      if (ln.startsWith('- ')) { flush(); (list = list || []).push(ln.slice(2)); i++; continue; }
      if (!ln.trim()) { flush(); endList(); i++; continue; }
      endList(); para.push(ln.trim()); i++;
    }
    flush(); endList(); return out.join('');
  }
  window.MD = md;

  const panel = inner => '<div class="sticky"><div class="panel">' + inner + '</div></div>';
  const item = (title, when, body) => '<div class="item"><div class="row"><h3>' + esc(title) + '</h3>' +
    (when ? '<span class="when">' + esc(when) + '</span>' : '') + '</div>' + (body || '') + '</div>';

  function build(S, sec) {
    const I = S.identity, K = sec.k ? '<p class="k">' + esc(sec.k) + '</p>' : '';
    let inner = '';
    if (sec.kind === 'hero') {
      inner = '<p class="boot">▸ ' + esc(I.boot).replace('ONLINE', '<b>ONLINE</b>') + '</p>' + K +
        '<h1>' + esc(I.first) + '<br>' + esc(I.last) + '</h1>' +
        '<p class="role">' + esc([I.title].concat(I.roles).join(' · ')) + '</p>' +
        '<p>' + esc(I.summary) + '</p>' +
        '<p class="meta">' + esc(I.location + ' · ' + I.timezone) + '</p>' +
        '<div class="cta">' + I.links.map(l => '<a' + (l.primary ? ' class="solid"' : '') + ' href="' + esc(l.href) + '">' + esc(l.label) + '</a>').join('') + '</div>';
    } else if (sec.kind === 'skills') {
      inner = K + '<h2>' + esc(sec.title) + '</h2><div class="groups">' + S.skills.map(g =>
        '<div class="grp"><b style="--c:#22d3ee">' + esc(g.group) + '</b><span>' + esc(g.items.join(' · ')) + '</span></div>').join('') + '</div>';
    } else if (sec.kind === 'writing') {
      inner = K + '<h2>' + esc(sec.title) + '</h2>' + S.posts.map(p => item(p.title, p.date)).join('') +
        '<p class="meta" style="margin-top:12px">Full posts at <a href="blog.html" style="color:var(--hud)">/blog</a></p>';
    } else if (sec.kind === 'experience') {
      const e = S.experience[sec.index];
      inner = '<p class="k">2U · server ' + (sec.index + 1) + ' of ' + S.experience.length + '</p>' +
        '<h3>' + esc(e.role) + '</h3><p class="meta">' + esc(e.company + ' · ' + e.period) + '</p>' +
        '<ul>' + e.bullets.map(b => '<li>' + esc(b) + '</li>').join('') + '</ul>';
    } else if (sec.kind === 'credentials') {
      inner = K + '<h2>' + esc(sec.title) + '</h2>' + S.credentials.map(c => item(c.title, c.when, '<p>' + esc(c.detail) + '</p>')).join('');
    } else if (sec.kind === 'contact') {
      inner = K + '<h2>' + esc(sec.title) + '</h2>' +
        '<p class="meta">' + esc(I.email + ' · ' + I.location + ' · ' + I.timezone) + '</p>' +
        '<div class="cta">' + I.links.filter(l => !l.primary).map(l => '<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>').join('') + '</div>';
    }
    return '<section class="ch" data-dev="' + sec.dev + '" data-shot="' + sec.shot + '" id="' + sec.id + '" style="--h:' + sec.h + '">' + panel(inner) + '</section>';
  }

  fetch('content.json').then(r => r.json()).then(S => {
    window.SITE = S;
    window.POSTS = S.posts.map(p => ({ date: p.date, title: p.title }));
    document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = S.meta.brand; });
    const main = document.querySelector('main');
    if (main) main.innerHTML = S.sections.map(sec => build(S, sec)).join('');
    document.dispatchEvent(new CustomEvent('site-ready', { detail: S }));
    // the 3D scene exists only on the rack page; async=false preserves execution order
    if (document.getElementById('scene')) ['hud.js', 'rack.js'].forEach(src => {
      const t = document.createElement('script'); t.src = src; t.async = false; document.body.appendChild(t);
    });
  }).catch(e => console.error('content.json failed:', e));
})();
