const BASE = "https://api.themoviedb.org/3";
const DEFAULT_KEY = "844dba0bfd8f3a4f3799f6130ef9e335";
export const REGION = process.env.TMDB_REGION || "US";

export const SUPPORTED_LANGUAGES = [
  { code: "all", label: "All Languages", flag: "🌐" },
  { code: "hi", label: "Hindi (हिन्दी)", flag: "🇮🇳", desc: "Bollywood & Hindi Dubbed" },
  { code: "en", label: "English / Dual Audio", flag: "🇺🇸", desc: "Hollywood & Dual Audio" },
  { code: "ja", label: "Anime (Dub + Sub)", flag: "🇯🇵", desc: "Japanese Anime Series & Films" },
  { code: "ko", label: "K-Drama (Korean/Dub)", flag: "🇰🇷", desc: "Korean Dramas & Movies" },
  { code: "te", label: "Telugu (తెలుగు)", flag: "🇮🇳", desc: "Tollywood Hits & Hindi Dubs" },
  { code: "ta", label: "Tamil (தமிழ்)", flag: "🇮🇳", desc: "Kollywood Cinema & Hindi Dubs" },
  { code: "es", label: "Spanish (Español)", flag: "🇪🇸", desc: "Spanish Cinema & Latin Dubs" },
  { code: "fr", label: "French (Français)", flag: "🇫🇷", desc: "French Series & European Cinema" },
  { code: "de", label: "German (Deutsch)", flag: "🇩🇪", desc: "German Cinema & Dubs" }
];

export const OTT_PLATFORMS = [
  { id: "all", name: "All OTTs", icon: "🎬" },
  { id: "8", name: "Netflix", icon: "🔴", color: "#E50914" },
  { id: "119", name: "Prime Video", icon: "🔵", color: "#00A8E1" },
  { id: "337", name: "Disney+", icon: "⭐", color: "#113CCF" },
  { id: "350", name: "Apple TV+", icon: "🍏", color: "#A2AAAD" },
  { id: "384", name: "HBO Max", icon: "🟣", color: "#5822B4" },
  { id: "283", name: "Crunchyroll", icon: "🟠", color: "#F47521" }
];

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

export const getAudioBadge = (lang = "en", vote = 0, pop = 0) => {
  switch (lang) {
    case "hi":
      return "Hindi Audio 🇮🇳";
    case "te":
      return "Telugu • Hindi Dub";
    case "ta":
      return "Tamil • Hindi Dub";
    case "ja":
      return "Anime Dub + Sub 🇯🇵";
    case "ko":
      return "K-Drama Multi-Audio 🇰🇷";
    case "es":
      return "Spanish • Dubbed 🇪🇸";
    case "fr":
      return "French • Dubbed 🇫🇷";
    case "de":
      return "German • Dubbed 🇩🇪";
    case "en":
      if (Number(pop) > 25 || Number(vote) >= 7.0) {
        return "Dual Audio [Hin+Eng] 🎧";
      }
      return "Ultra HD 5.1";
    default:
      return "Multi-Audio 🌐";
  }
};

export const norm = (x, explicitType) => {
  if (!x) return null;
  const type = explicitType || x.media_type || (x.first_air_date ? "tv" : "movie");
  const year = (x.release_date || x.first_air_date || x.year || "").toString().slice(0, 4);
  const vote = x.vote_average ? Number(x.vote_average).toFixed(1) : null;
  const matchPct = vote ? Math.min(99, Math.round(Number(vote) * 10 + 15)) : 95;
  const origLang = x.original_language || "en";
  const audioBadge = getAudioBadge(origLang, vote || 0, x.popularity || 0);

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
    trailer: x.videos?.results?.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))?.key,
    original_language: origLang,
    audioBadge,
    isDubbed: origLang !== "en" || Number(x.popularity) > 25
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

export async function getByLanguage(type = "movie", langCode = "hi", page = 1) {
  const data = await tmdb(`/discover/${type}`, {
    with_original_language: langCode,
    sort_by: "popularity.desc",
    page
  });
  return (data?.results || []).map(x => norm(x, type));
}

export async function getDubbedHollywood(type = "movie", page = 1) {
  // Hollywood blockbusters that have global Hindi & dual audio dubs
  const data = await tmdb(`/discover/${type}`, {
    with_original_language: "en",
    sort_by: "popularity.desc",
    "vote_count.gte": 1000,
    page
  });
  return (data?.results || []).map(x => {
    const item = norm(x, type);
    item.audioBadge = "Dual Audio [Hin+Eng] 🎧";
    item.isDubbed = true;
    return item;
  });
}

export async function getSouthIndianDubbed(page = 1) {
  // Tollywood and Kollywood hits popular in dubbed format
  const [telugu, tamil] = await Promise.all([
    tmdb("/discover/movie", { with_original_language: "te", sort_by: "popularity.desc", page }),
    tmdb("/discover/movie", { with_original_language: "ta", sort_by: "popularity.desc", page })
  ]);
  const combined = [...(telugu?.results || []), ...(tamil?.results || [])]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  return combined.map(x => {
    const item = norm(x, "movie");
    item.audioBadge = "South • Hindi Dubbed 🎬";
    item.isDubbed = true;
    return item;
  });
}

export async function getAnimeDubbed(page = 1) {
  // Top Japanese Anime series and movies with dual-audio and English/Hindi subs/dubs
  const data = await tmdb("/discover/tv", {
    with_genres: "16",
    with_original_language: "ja",
    sort_by: "popularity.desc",
    page
  });
  return (data?.results || []).map(x => {
    const item = norm(x, "tv");
    item.audioBadge = "Anime Dual-Audio 🇯🇵";
    item.isDubbed = true;
    return item;
  });
}

export async function getKDramas(page = 1) {
  const data = await tmdb("/discover/tv", {
    with_original_language: "ko",
    sort_by: "popularity.desc",
    page
  });
  return (data?.results || []).map(x => {
    const item = norm(x, "tv");
    item.audioBadge = "K-Drama Multi-Audio 🇰🇷";
    item.isDubbed = true;
    return item;
  });
}

export async function getOttCatalog(type = "movie", ottProviderId = "8", page = 1) {
  const params = {
    sort_by: "popularity.desc",
    watch_region: "US",
    page
  };
  if (ottProviderId && ottProviderId !== "all") {
    params.with_watch_providers = ottProviderId;
  }
  const data = await tmdb(`/discover/${type}`, params);
  return {
    results: (data?.results || []).map(x => norm(x, type)),
    total_pages: data?.total_pages || 1,
    page: data?.page || page
  };
}

export async function getGenreList(type = "movie") {
  const data = await tmdb(`/genre/${type}/list`);
  return data?.genres || [];
}

export async function getDiscover(type = "movie", genre = "", page = 1, sortBy = "popularity.desc", language = "", ott = "") {
  const params = { page, sort_by: sortBy };
  if (genre && genre !== "all") params.with_genres = genre;
  if (language && language !== "all") {
    if (language === "dual") {
      params.with_original_language = "en";
      params["vote_count.gte"] = 500;
    } else {
      params.with_original_language = language;
    }
  }
  if (ott && ott !== "all") {
    params.with_watch_providers = ott;
    params.watch_region = "US";
  }
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
