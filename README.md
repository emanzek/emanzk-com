# emanzk.com

The static portfolio served at **https://emanzk.com**, deployed by Cloudflare Pages.

```
public/          <- everything Pages publishes. Nothing else in this repo is served.
  index.html
  styles.css
  script.js
  docs/resume-202510.pdf
nginx.conf       <- local preview only
docker-compose.yml
```

## Why this is its own repository

It used to live inside `code_vault`, the homelab infrastructure repo, and deploy to S3 from
a GitHub Action. Both halves of that changed:

**Hosting** moved to Cloudflare Pages, so the S3 bucket and its workflow retire with it.

**The repository** moved out because Pages' Git integration grants Cloudflare read access to
the *whole* connected repository, not just the directory it publishes. `code_vault` holds the
estate's exact values — addresses, MAC addresses, service inventory, and credentials reachable
in its history — and is private permanently for that reason. Connecting it to a third-party
build system to serve four static files was the wrong trade. Here, Cloudflare reads four static
files and nothing else.

## The `public/` split

Pages excludes only `node_modules`, `.DS_Store` and `.git` by default — everything else in the
publish root ships. Keeping the site in `public/` means the preview tooling at the repo root
cannot be served by accident, no exclusion list has to stay correct forever, and the directory
Pages publishes is exactly the directory you preview locally.

## Local preview

```bash
docker compose up -d    # http://localhost:8080
```

Only `public/` is mounted, so what you see locally is what ships.

## Deploying

Push to the default branch. Pages builds from `public/` with no build command — these are
static files with no toolchain.
