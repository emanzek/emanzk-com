// permalink as a function: markdown templating is off (code blocks must stay literal),
// so the slug cannot come from a {{ }} string.
export default {
  layout: "post.njk",
  tags: "posts",
  permalink: data => `/blog/${data.page.fileSlug}/index.html`,
};
