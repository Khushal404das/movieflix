export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /play is crawlable on purpose: it carries a noindex tag, and crawlers
        // must be able to fetch it to see that.
        disallow: ["/api/", "/verify", "/verify2", "/profile", "/list"],
      },
    ],
    sitemap: "https://movieflix.stream/sitemap.xml",
    host: "https://movieflix.stream",
  };
}
