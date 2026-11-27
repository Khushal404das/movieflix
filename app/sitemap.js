import { tmdb, getGenreList } from "@/lib/tmdb";
import { SITE_URL, titlePath } from "@/lib/seo";

// Rebuilt at most once a day. Lists the main pages, the genre pages, and a
// title page for each currently trending, popular and top-rated movie and show.
export const revalidate = 86400;

const LISTS = [
  ["movie", "/trending/movie/week", 3],
  ["tv", "/trending/tv/week", 3],
  ["movie", "/movie/popular", 5],
  ["tv", "/tv/popular", 5],
  ["movie", "/movie/top_rated", 3],
  ["tv", "/tv/top_rated", 3],
  ["movie", "/movie/now_playing", 2],
  ["tv", "/tv/on_the_air", 2],
];

export default async function sitemap() {
  const now = new Date();

  const pages = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/home`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/browse/movie`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/browse/tv`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/classics`, changeFrequency: "weekly", priority: 0.6 },
  ].map((p) => ({ ...p, lastModified: now }));

  // Genre pages use TMDB's numeric genre ids, which is what /browse expects.
  const [movieGenres, tvGenres] = await Promise.all([getGenreList("movie"), getGenreList("tv")]);
  for (const [type, list] of [["movie", movieGenres], ["tv", tvGenres]]) {
    for (const g of list) {
      pages.push({
        url: `${SITE_URL}/browse/${type}?genre=${g.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  // Title pages
  const requests = [];
  for (const [type, path, pageCount] of LISTS) {
    for (let page = 1; page <= pageCount; page++) {
      requests.push(tmdb(path, { page }).then((data) => ({ type, results: data?.results || [] })));
    }
  }
  const seen = new Set();
  for (const { type, results } of await Promise.all(requests)) {
    for (const r of results) {
      const key = `${type}:${r.id}`;
      if (!r.id || seen.has(key)) continue;
      seen.add(key);
      pages.push({
        url: SITE_URL + titlePath(type, r.id),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return pages;
}
