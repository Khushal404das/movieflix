const BASE = "https://api.themoviedb.org/3";
const DEFAULT_KEY = "844dba0bfd8f3a4f3799f6130ef9e335";
export const REGION = process.env.TMDB_REGION || "US";

export function getApiKey() {
  return process.env.TMDB_API_KEY || DEFAULT_KEY;
}

export async function tmdb(path, params = {}) {
  const key = getApiKey();
  const u = new URL(BASE + path);
  u.searchParams.set("api_key", key);
  u.searchParams.set("language", "en-US");
  
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      u.searchParams.set(k, v);
    }
  }

  try {
    const res = await fetch(u.toString(), {
      next: { revalidate: 1800 }, // 30 minutes dynamic cache
      headers: { Accept: "application/json" }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("TMDB fetch error:", path, err);
    return null;
  }
}

export const img = (p, size = "w500") => {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `https://image.tmdb.org/t/p/${size}${p}`;
};

export const norm = (x, explicitType) => {
  if (!x) return null;
  const type = explicitType || x.media_type || (x.first_air_date ? "tv" : "movie");
  const year = (x.release_date || x.first_air_date || x.year || "").toString().slice(0, 4);
  const vote = x.vote_average ? Number(x.vote_average).toFixed(1) : null;
  const matchPct = vote ? Math.min(99, Math.round(Number(vote) * 10 + 15)) : 95;

  return {
    id: x.id,
    type,
    title: x.title || x.name || "Untitled",
    year,
    rating: vote,
    match: `${matchPct}% Match`,
    age: Number(vote) >= 7.5 ? "16+" : (Number(vote) >= 8.5 ? "18+" : "13+"),
    quality: Number(vote) >= 7.5 ? "4K Ultra HD" : "HD",
    poster: img(x.poster_path, "w500"),
    backdrop: img(x.backdrop_path, "w1280") || img(x.poster_path, "w1280"),
    overview: x.overview || "",
    tagline: x.tagline || "",
    runtime: x.runtime,
    genres: x.genres || (x.genre_ids ? [] : []),
    seasons: x.seasons || [],
    number_of_seasons: x.number_of_seasons || (x.seasons ? x.seasons.length : 1),
    number_of_episodes: x.number_of_episodes,
    cast: x.credits?.cast ? x.credits.cast.slice(0, 8).map(c => c.name) : [],
    trailer: x.videos?.results?.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))?.key
  };
};

/* Real Dynamic Category Fetchers */
export async function getTrending(type = "all", time = "day") {
  const data = await tmdb(`/trending/${type}/${time}`);
  return (data?.results || []).map(x => norm(x, type === "all" ? undefined : type));
}

export async function getTopRated(type = "movie") {
  const data = await tmdb(`/${type}/top_rated`);
  return (data?.results || []).map(x => norm(x, type));
}

export async function getPopular(type = "movie") {
  const data = await tmdb(`/${type}/popular`);
  return (data?.results || []).map(x => norm(x, type));
}

export async function getNowPlaying() {
  const data = await tmdb("/movie/now_playing");
  return (data?.results || []).map(x => norm(x, "movie"));
}

export async function getByGenre(type = "movie", genreId) {
  const data = await tmdb(`/discover/${type}`, {
    with_genres: genreId,
    sort_by: "popularity.desc"
  });
  return (data?.results || []).map(x => norm(x, type));
}

export async function getGenreList(type = "movie") {
  const data = await tmdb(`/genre/${type}/list`);
  return data?.genres || [];
}

export async function getDiscover(type = "movie", genre = "", page = 1, sortBy = "popularity.desc") {
  const params = { page, sort_by: sortBy };
  if (genre) params.with_genres = genre;
  const data = await tmdb(`/discover/${type}`, params);
  return {
    results: (data?.results || []).map(x => norm(x, type)),
    total_pages: data?.total_pages || 1,
    page: data?.page || page
  };
}

export async function getTitle(type, id) {
  const data = await tmdb(`/${type}/${id}`, {
    append_to_response: "videos,credits,similar,recommendations"
  });
  if (!data) return null;
  return data;
}

export async function getSeasonEpisodes(id, seasonNumber) {
  const data = await tmdb(`/tv/${id}/season/${seasonNumber}`);
  if (data?.episodes) return data;
  return {
    season_number: seasonNumber,
    name: `Season ${seasonNumber}`,
    episodes: []
  };
}

export async function searchTitles(query) {
  const q = (query || "").trim();
  if (!q) return [];
  const data = await tmdb("/search/multi", { query: q });
  return (data?.results || [])
    .filter(x => x.media_type !== "person" && (x.poster_path || x.backdrop_path))
    .map(x => norm(x));
}
