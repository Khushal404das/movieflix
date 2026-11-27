// Shared SEO helpers: site address, title-page metadata and structured data
// (JSON-LD) for movies and TV shows.

import { img } from "@/lib/tmdb";

export const SITE_URL = "https://movieflix.stream";
export const SITE_NAME = "MovieFlix";

export const titlePath = (type, id) => `/${type === "tv" ? "tv" : "movie"}/${id}`;

export function playPath(type, id, season, episode) {
  const base = `/play?id=${encodeURIComponent(id)}&type=${type === "tv" ? "tv" : "movie"}`;
  return type === "tv" ? `${base}&season=${season || 1}&episode=${episode || 1}` : base;
}

const clip = (text, max) => {
  const s = (text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(" ", max - 1) > 80 ? s.lastIndexOf(" ", max - 1) : max - 1) + "…";
};

const yearOf = (d) => (d.release_date || d.first_air_date || "").slice(0, 4);
const nameOf = (d) => d.title || d.name || "Untitled";

// <title>, description, canonical and social cards for a title page.
export function titleMetadata(type, d) {
  const isTv = type === "tv";
  const name = nameOf(d);
  const year = yearOf(d);
  const genres = (d.genres || []).map((g) => g.name).slice(0, 3).join(", ");
  const heading = `${name}${year ? ` (${year})` : ""}`;
  const fallback = `${heading}${genres ? `: ${genres}` : ""} ${isTv ? "series" : "movie"} on MovieFlix.`;
  const description = clip(d.overview || fallback, 158);
  const path = titlePath(type, d.id);
  const image = img(d.backdrop_path, "w1280") || img(d.poster_path, "w780");

  return {
    // Matches how people search ("watch <title> online"); the layout adds "| MovieFlix".
    title: `Watch ${heading} Online – ${isTv ? "TV Series" : "Movie"}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: isTv ? "video.tv_show" : "video.movie",
      url: path,
      title: heading,
      description,
      ...(image ? { images: [{ url: image, width: 1280, height: 720, alt: heading }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: heading,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

// schema.org Movie / TVSeries plus a breadcrumb trail, for search engines
// and AI answer engines.
export function titleJsonLd(type, d) {
  const isTv = type === "tv";
  const url = SITE_URL + titlePath(type, d.id);
  const cast = (d.credits?.cast || []).slice(0, 8).map((c) => ({ "@type": "Person", name: c.name }));
  const directors = (d.credits?.crew || [])
    .filter((c) => c.job === "Director")
    .slice(0, 3)
    .map((c) => ({ "@type": "Person", name: c.name }));
  const creators = (d.created_by || []).slice(0, 3).map((c) => ({ "@type": "Person", name: c.name }));
  const trailer = d.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer");

  const work = {
    "@type": isTv ? "TVSeries" : "Movie",
    "@id": `${url}#title`,
    name: nameOf(d),
    url,
    description: d.overview || undefined,
    image: img(d.poster_path, "w780") || undefined,
    genre: (d.genres || []).map((g) => g.name),
    inLanguage: d.original_language || undefined,
    ...(isTv
      ? {
          startDate: d.first_air_date || undefined,
          numberOfSeasons: d.number_of_seasons || undefined,
          numberOfEpisodes: d.number_of_episodes || undefined,
          ...(creators.length ? { creator: creators } : {}),
        }
      : {
          datePublished: d.release_date || undefined,
          ...(d.runtime ? { duration: `PT${d.runtime}M` } : {}),
          ...(directors.length ? { director: directors } : {}),
        }),
    ...(cast.length ? { actor: cast } : {}),
    ...(d.vote_count > 0 && d.vote_average > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(d.vote_average).toFixed(1),
            bestRating: "10",
            worstRating: "0",
            ratingCount: d.vote_count,
          },
        }
      : {}),
    ...(trailer
      ? {
          trailer: {
            "@type": "VideoObject",
            name: `${nameOf(d)} – Trailer`,
            embedUrl: `https://www.youtube.com/embed/${trailer.key}`,
            thumbnailUrl: `https://i.ytimg.com/vi/${trailer.key}/hqdefault.jpg`,
            uploadDate: trailer.published_at || d.release_date || d.first_air_date || undefined,
            description: `Official trailer for ${nameOf(d)}.`,
          },
        }
      : {}),
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: isTv ? "TV Shows" : "Movies",
        item: `${SITE_URL}/browse/${isTv ? "tv" : "movie"}`,
      },
      { "@type": "ListItem", position: 3, name: nameOf(d), item: url },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [work, breadcrumb] };
}

// JSON for a <script type="application/ld+json">, safe to put in HTML.
export const jsonLdString = (data) => JSON.stringify(data).replace(/</g, "\\u003c");
