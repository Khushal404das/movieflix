export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/verify",
          "/verify2",
          "/profile",
        ],
      },
    ],
    sitemap: "https://movieflix.stream/sitemap.xml",
  };
}
