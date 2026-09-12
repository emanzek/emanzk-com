export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addFilter("isoDate", d => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addCollection("posts", c =>
    c.getFilteredByTag("posts").sort((a, b) => b.date - a.date));
  return { dir: { input: "src", output: "dist", includes: "_includes", data: "_data" }, markdownTemplateEngine: false };
}
