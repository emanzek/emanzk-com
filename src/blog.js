/* blog.js — index and post views, both rendered from content.json. Hash routing: #slug. */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const main = document.querySelector('main');

  const tags = p => (p.tags || []).map(t => '<span class="tag">' + esc(t) + '</span>').join('');

  function index(S) {
    document.title = 'Writing — ' + S.meta.domain;
    return '<p class="k">' + esc(S.meta.rackLabel) + ' · /blog</p>' +
      '<h1>Writing</h1>' +
      '<p class="lede">Findings from building and running the estate — the things that were only obvious afterwards.</p>' +
      '<ul class="post-list">' + S.posts.map(p =>
        '<li><a href="#' + esc(p.slug) + '"><h2>' + esc(p.title) + '</h2>' +
        '<p>' + esc(p.summary) + '</p>' +
        '<div class="meta"><span>' + esc(p.date) + '</span>' + tags(p) + '</div></a></li>').join('') +
      '</ul>';
  }

  function post(S, p, i) {
    document.title = p.title + ' — ' + S.meta.domain;
    const prev = S.posts[i - 1], next = S.posts[i + 1];
    return '<article><p class="k">' + esc(S.meta.rackLabel) + ' · /blog</p>' +
      '<h1>' + esc(p.title) + '</h1>' +
      '<div class="meta" style="margin-bottom:34px"><span>' + esc(p.date) + '</span>' + tags(p) + '</div>' +
      window.MD(p.body) + '</article>' +
      '<hr class="rule">' +
      '<div class="pager">' +
      (prev ? '<a href="#' + esc(prev.slug) + '"><span>← newer</span>' + esc(prev.title) + '</a>' : '<a href="#"><span>←</span>all posts</a>') +
      (next ? '<a href="#' + esc(next.slug) + '" style="text-align:right"><span>older →</span>' + esc(next.title) + '</a>' : '') +
      '</div>';
  }

  function render() {
    const S = window.SITE; if (!S) return;
    const slug = location.hash.replace(/^#/, '');
    const i = S.posts.findIndex(p => p.slug === slug);
    main.innerHTML = i >= 0 ? post(S, S.posts[i], i) : index(S);
    scrollTo(0, 0);
  }

  document.addEventListener('site-ready', render);
  addEventListener('hashchange', render);
  if (window.SITE) render();
})();
