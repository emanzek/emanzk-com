# emanzk.com

The portfolio served at **https://emanzk.com**.

```
public/                  <- the site currently live (no build step, uploaded out-of-band)
src/                     <- the rack design, built by Eleventy
  _data/site.json          identity, skills, experience, credentials, section map
  _includes/               base layout, post layout, page chrome
  assets/                  rack.css  blog.css  rack.js  hud.js
  index.njk                the rack page
  blog/index.njk           the writing index
  blog/posts/*.md          one markdown file per post
dist/                    <- build output (gitignored)
eleventy.config.js
```

## How it is actually hosted

A **Cloudflare Worker** named `emanzk-portfolio`, serving static assets, with `emanzk.com` and
`www.emanzk.com` attached to it as custom domains.

> Earlier revisions of this file said Cloudflare Pages. That was wrong and is corrected here —
> the account has no Pages project at all. Checked against the API on 2026-09-11.

There is **no deploy configuration in this repository**: no `wrangler.toml`, no workflow. The
Worker was uploaded out-of-band, so nothing here records how live got to be live. The content
happens to match `public/` byte for byte today, which is luck rather than a guarantee. Adding
`wrangler.jsonc` and Workers Builds is the first thing to do before this repo can be trusted as
the source of truth.

## Why this is its own repository

It used to live inside `code_vault`, the homelab infrastructure repo, and deploy to S3 from a
GitHub Action. Both halves of that changed.

**The repository** moved out because a git-connected build system reads the *whole* repository,
not just the directory it publishes. `code_vault` holds the estate's exact values — addresses,
MAC addresses, service inventory, and credentials reachable in its history — and is private
permanently for that reason. Granting a third-party build system read access to all of it in
order to serve four static files was the wrong trade.

## `src/` — the rack design

A scroll-driven blueprint of a server rack, in which each section of the CV is a device:
the switch carries the skills, a pull-out KVM console carries the writing, five servers carry
the roles, the UPS carries credentials, the PDU carries contact. The camera runs a shot list —
one angle per section — and the description panel is summoned on an indicator line drawn from
the device.

### Content

Everything on the site comes from data. Nothing is duplicated: the server name plates, the KVM
screen, the writing list and the blog index all read the same source.

| source | drives |
|---|---|
| `_data/site.json` | brand, rack label, hero, skills, experience (plates *and* panels), credentials, section order |
| `blog/posts/*.md` | the writing panel, the KVM screen, the blog index, and one page per post |

Adding a role is one object in `site.json` — the name plate, its typing animation and the panel
all follow. Adding a post is one markdown file.

### Build

```bash
npm install
npm run build      # → dist/
npm run serve      # http://localhost:8100 with live reload
```

Eleventy renders every panel at build time, so the markup ships complete — the scene boots into
a page that is already there, and the posts are real, indexable URLs (`/blog/the-ratchet/`)
rather than client-side routing.

> Markdown templating is deliberately **off** (`markdownTemplateEngine: false`) so that braces
> inside code blocks stay literal. Post permalinks are therefore computed in
> `blog/posts/posts.11tydata.js` rather than from a `{{ }}` string.

### Not done yet

- **`dist/` is not deployed.** `public/` is still what's live. Cutting over means pointing the
  Worker at the build — which needs the `wrangler.jsonc` and Workers Builds wiring that this
  repo still lacks. Until then live is uploaded out-of-band and this repo is not the source of
  truth.
- **Debug switches are still in the scripts** — `?p=`, `cam`, `hinge`, `seed`, `nomove`,
  `hudlog`, `perf`. Development scaffolding; strip before deploying.
- **~500 draw calls per frame.** Fine on a desktop, marginal on a mid-range phone. Instancing
  the repeated geometry brings it to roughly 200.
- **Untested below 1100px**, where the instruments and radial menu currently hide entirely.
- **The committed content is anonymised** — invented employer names and an invented identity,
  for sharing screenshots. Real values go back in when this is wired up for deployment.

## Local preview of the live site

```bash
docker compose up -d    # http://localhost:8080 — serves public/ only
```
