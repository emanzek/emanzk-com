/* Pre-render ```mermaid fences to SVG, so the built pages ship complete.
   Uses the headless browser already on this machine — no puppeteer, no runtime JS.
   Each diagram is keyed by a hash of its source, so unchanged diagrams are skipped. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// snap-confined browsers cannot read /tmp or hidden dirs — stage the page somewhere they can
const STAGE = "diagram-build";

const MERMAID = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
const POSTS = "src/blog/posts";
const OUT = "src/assets/img/diagrams";
const THEME = {
  background: "#04101c", primaryColor: "#0d2238", primaryTextColor: "#E6F1FF", primaryBorderColor: "#22D3EE",
  secondaryColor: "#112a40", tertiaryColor: "#0a1c2e", lineColor: "#22D3EE", textColor: "#D6E6F6",
  mainBkg: "#0d2238", nodeBorder: "#22D3EE", clusterBkg: "rgba(34,211,238,.06)", clusterBorder: "rgba(34,211,238,.3)",
  edgeLabelBackground: "#04101c", fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "13px",
};

function browser() {
  for (const b of ["/snap/bin/chromium", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"])
    if (fs.existsSync(b)) return b;
  throw new Error("no chromium found — install one, or keep the client-side fallback");
}

function render(src, hash) {
  fs.mkdirSync(STAGE, { recursive: true });
  const page = path.join(STAGE, "render.html");
  fs.writeFileSync(page, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#04101c">
<pre class="mermaid">${src.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</pre>
<script type="module">
import mermaid from "${MERMAID}";
mermaid.initialize({ startOnLoad: true, securityLevel: "strict", theme: "base", themeVariables: ${JSON.stringify(THEME)} });
</script>`);
  const dom = execFileSync(browser(), ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader",
    "--virtual-time-budget=8000", "--dump-dom", `file://${path.resolve(page)}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  fs.rmSync(page, { force: true });

  // take the svg mermaid put *inside the pre* — a bare /<svg.../ also matches strings in the library source
  const block = dom.match(/<pre class="mermaid"[^>]*>([\s\S]*?)<\/pre>/);
  const m = block && block[1].match(/<svg[\s\S]*<\/svg>/);
  if (!m) throw new Error("mermaid produced no svg — check the diagram syntax");
  // mermaid ids are per-render; rewrite to the content hash so several diagrams can share a page
  const idMatch = m[0].match(/id="(mermaid-[^"]+)"/);
  let svg = m[0];
  if (idMatch) svg = svg.split(idMatch[1]).join("d" + hash);
  return svg.replace(/<svg /, '<svg role="img" ');
}

fs.mkdirSync(OUT, { recursive: true });
let made = 0, kept = 0;
for (const file of fs.readdirSync(POSTS).filter(f => f.endsWith(".md"))) {
  const body = fs.readFileSync(path.join(POSTS, file), "utf8");
  for (const match of body.matchAll(/```mermaid\n([\s\S]*?)```/g)) {
    const src = match[1].trimEnd();
    const hash = createHash("sha256").update(src).digest("hex").slice(0, 12);
    const dest = path.join(OUT, `${hash}.svg`);
    if (fs.existsSync(dest)) { kept++; continue; }
    process.stdout.write(`  rendering ${hash}  (${file})\n`);
    fs.writeFileSync(dest, render(src, hash));
    made++;
  }
}
// drop SVGs whose source no longer exists anywhere
const live = new Set();
for (const file of fs.readdirSync(POSTS).filter(f => f.endsWith(".md")))
  for (const m of fs.readFileSync(path.join(POSTS, file), "utf8").matchAll(/```mermaid\n([\s\S]*?)```/g))
    live.add(createHash("sha256").update(m[1].trimEnd()).digest("hex").slice(0, 12) + ".svg");
let gone = 0;
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".svg") && !live.has(f)) { fs.unlinkSync(path.join(OUT, f)); gone++; }
console.log(`diagrams: ${made} rendered, ${kept} unchanged, ${gone} removed`);
