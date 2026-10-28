export default function sitemap() {
  const baseUrl = "https://movieflix.stream";
  const now = new Date().toISOString();

  const routes = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/home`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/browse/movie`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/browse/tv`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/download`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/classics`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const genres = [
    "action", "adventure", "animation", "comedy", "crime", "documentary",
    "drama", "family", "fantasy", "history", "horror", "music",
    "mystery", "romance", "science-fiction", "tv-movie", "thriller", "war", "western"
  ];

  genres.forEach((genre) => {
    routes.push({
      url: `${baseUrl}/browse/movie?genre=${genre}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
    routes.push({
      url: `${baseUrl}/browse/tv?genre=${genre}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  });

  return routes;
}
