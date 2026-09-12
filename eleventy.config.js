import markdownIt from "markdown-it";
import { createHash } from "node:crypto";
import fs from "node:fs";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });   // Cloudflare static-assets headers
  eleventyConfig.addFilter("isoDate", d => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("bust", f => `${f}?v=${Math.floor(fs.statSync("src/assets/" + f).mtimeMs)}`);
  eleventyConfig.addFilter("pad", (n, w = 2) => String(n).padStart(w, "0")); // nunjucks has no printf-style format
  eleventyConfig.addCollection("posts", c =>
    c.getFilteredByTag("posts").sort((a, b) => b.date - a.date));

  const md = markdownIt({ html: true, linkify: true, breaks: false });

  // ```mermaid fences become <pre class="mermaid"> so mermaid.js picks them up
  const fence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, i, opts, env, self) => {
    if (tokens[i].info.trim() === "mermaid") {
      const src = tokens[i].content.trimEnd();
      const hash = createHash("sha256").update(src).digest("hex").slice(0, 12);
      const svg = `src/assets/img/diagrams/${hash}.svg`;
      // pre-rendered by `npm run diagrams`; if it is missing, ship the source and let the browser draw it
      if (fs.existsSync(svg)) return `<figure class="diagram">${fs.readFileSync(svg, "utf8")}</figure>\n`;
      return `<figure class="diagram"><pre class="mermaid">${md.utils.escapeHtml(src)}</pre></figure>\n`;
    }
    // the <pre> scrolls horizontally, so anything pinned to a corner has to hang off a wrapper
    const out = `<div class="codebox">${fence(tokens, i, opts, env, self).trimEnd()}</div>\n`;
    // long configs get clamped to ~20 lines and expanded by the reader; the clamp is
    // applied in JS so a no-JS reader still gets the whole file
    const lines = tokens[i].content.trimEnd().split("\n").length;
    if (lines <= 20) return out;
    return `<div class="fold" data-lines="${lines}">${out}</div>\n`;
  };

  // a paragraph that is nothing but an image becomes a <figure>, alt text as the caption
  md.core.ruler.push("figure", state => {
    const t = state.tokens;
    for (let i = 0; i < t.length - 2; i++) {
      if (t[i].type !== "paragraph_open" || t[i + 1].type !== "inline" || t[i + 2].type !== "paragraph_close") continue;
      const kids = t[i + 1].children.filter(c => !(c.type === "text" && !c.content.trim()));
      if (kids.length !== 1 || kids[0].type !== "image") continue;
      const alt = kids[0].content || "";
      t[i].type = "html_block"; t[i].content = "<figure>"; t[i].tag = "";
      t[i + 2].type = "html_block"; t[i + 2].content = alt ? `<figcaption>${md.utils.escapeHtml(alt)}</figcaption></figure>\n` : "</figure>\n"; t[i + 2].tag = "";
    }
  });

  eleventyConfig.setLibrary("md", md);
  return { dir: { input: "src", output: "dist", includes: "_includes", data: "_data" }, markdownTemplateEngine: false };
}
