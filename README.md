# emanzk.com

The portfolio served at **https://emanzk.com**.

```
public/          <- the site currently live
  index.html  styles.css  script.js  docs/resume-202510.pdf
src/             <- the rack design: built, not yet deployed
  index.html  rack.js  hud.js  content.json  content.js  blog.html  blog.js
nginx.conf       <- local preview of public/ only
docker-compose.yml
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

**All content lives in `content.json`.** Nothing is duplicated: the server name plates, the
KVM screen, the writing list and the blog index all read the same arrays. `content.js` loads
it, builds the panels, then boots the scene.

| key | drives |
|---|---|
| `meta` | nav brand, 3D rack label, page titles |
| `identity` | hero, role line, summary, contact, buttons |
| `skills` | the six groups |
| `experience` | server plates *and* the role panels |
| `credentials` | the UPS section |
| `posts` | writing panel, the KVM screen, the whole blog |
| `sections` | order, which rack device each maps to, scroll height |

### Local preview

```bash
cd src && python3 -m http.server 8100     # http://127.0.0.1:8100/index.html
```

### Not done yet

- **No build step.** The blog is rendered client-side from `content.json`; 11ty would make the
  posts real pages with real URLs.
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
