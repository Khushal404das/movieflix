"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10765: "Sci-Fi & Fantasy"
};

export default function Card({
  href,
  title,
  sub,
  poster,
  backdrop,
  rating,
  quality = "HD",
  type,
  audioBadge,
  isWide = false,
  genres = [],
  runtime,
  seasons = [],
  number_of_seasons,
  item = null
}) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [hoverImgError, setHoverImgError] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Check if item is already in watchlist
  useEffect(() => {
    if (!href) return;
    try {
      const list = JSON.parse(localStorage.getItem("rh-list") || "[]");
      setInWatchlist(list.some((x) => x.href === href));
      const liked = JSON.parse(localStorage.getItem("rh-liked") || "[]");
      setIsLiked(liked.includes(href));
    } catch (_) {}
  }, [href]);

  const handleToggleWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const list = JSON.parse(localStorage.getItem("rh-list") || "[]");
      const exists = list.some((x) => x.href === href);
      const next = exists
        ? list.filter((x) => x.href !== href)
        : [{ href, title, poster: poster || backdrop, rating, type, year: sub }, ...list];
      localStorage.setItem("rh-list", JSON.stringify(next));
      setInWatchlist(!exists);
    } catch (_) {}
  };

  const handleToggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const liked = JSON.parse(localStorage.getItem("rh-liked") || "[]");
      const exists = liked.includes(href);
      const next = exists ? liked.filter((x) => x !== href) : [...liked, href];
      localStorage.setItem("rh-liked", JSON.stringify(next));
      setIsLiked(!exists);
    } catch (_) {}
  };

  const handleMoreInfoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (href) router.push(href);
  };

  const getGradient = (str = "") => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const hues = [
      "linear-gradient(145deg, #380d19, #120509)",
      "linear-gradient(145deg, #101d3b, #070e1e)",
      "linear-gradient(145deg, #2a153d, #0d0614)",
      "linear-gradient(145deg, #302008, #140d03)",
      "linear-gradient(145deg, #0d2e24, #04120e)"
    ];
    return hues[Math.abs(hash) % hues.length];
  };

  const matchScore = rating ? Math.min(99, Math.round(Number(rating) * 10 + 15)) : 94;
  const previewMediaUrl = backdrop || poster;

  // Resolve duration label
  const resolveDuration = () => {
    if (type === "tv") {
      const sCount = number_of_seasons || (Array.isArray(seasons) && seasons.length > 0 ? seasons.length : 1);
      return `${sCount} Season${sCount > 1 ? "s" : ""}`;
    }
    if (runtime && Number(runtime) > 0) {
      const h = Math.floor(Number(runtime) / 60);
      const m = Number(runtime) % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    return "1h 48m";
  };

  // Resolve maturity rating
  const resolveMaturity = () => {
    const r = Number(rating) || 7.0;
    if (r >= 8.0) return "A 18+";
    if (r >= 7.0) return "U/A 16+";
    return "U/A 13+";
  };

  // Resolve genre tags
  const resolveGenres = () => {
    if (Array.isArray(genres) && genres.length > 0) {
      return genres
        .map((g) => (typeof g === "string" ? g : g.name || GENRE_MAP[g]))
        .filter(Boolean)
        .slice(0, 4);
    }
    if (Array.isArray(item?.genre_ids) && item.genre_ids.length > 0) {
      return item.genre_ids
        .map((id) => GENRE_MAP[id])
        .filter(Boolean)
        .slice(0, 4);
    }
    if (type === "tv") {
      return ["Drama", "Series", "Mystery", "Action"];
    }
    return ["Action", "Adventure", "Drama", "Sci-Fi"];
  };

  const genreList = resolveGenres();

  return (
    <div className={`netflix-card-item ${isWide ? "wide-card" : ""}`}>
      <Link href={href} prefetch={true} className="netflix-card-link">
        {/* Base Card Poster Display */}
        <div className="netflix-card-media">
          {poster && !imgError ? (
            <img
              src={poster}
              alt={title}
              loading="lazy"
              decoding="async"
              className="netflix-poster-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="netflix-fallback-poster" style={{ background: getGradient(title) }}>
              <div className="fallback-inner-content">
                <span className="fallback-media-icon">{type === "tv" ? "📺" : "🎬"}</span>
                <span className="fallback-media-title">{title}</span>
                {sub && <span className="fallback-media-sub">{sub}</span>}
              </div>
            </div>
          )}

          {/* Top Badges */}
          <div className="netflix-card-badge-top">
            {rating && Number(rating) >= 7.5 && (
              <span className="top-rated-tag">TOP RATED</span>
            )}
          </div>
        </div>

        {/* Floating Quick Preview Pop-up Overlay on Hover */}
        <div className="netflix-card-hover-overlay">
          <div className="hover-media-box">
            {previewMediaUrl && !hoverImgError ? (
              <img
                src={previewMediaUrl}
                alt={title}
                loading="lazy"
                decoding="async"
                className="hover-media-img"
                onError={() => setHoverImgError(true)}
              />
            ) : (
              <div className="hover-media-fallback" style={{ background: getGradient(title) }}>
                <span className="hover-fallback-icon">{type === "tv" ? "📺" : "🎬"}</span>
                <span className="hover-fallback-title">{title}</span>
              </div>
            )}
            <div className="hover-media-overlay-gradient"></div>

            {/* Title Overlay on Media */}
            <div className="hover-media-title-overlay">
              <span className="hover-preview-title">{title}</span>
            </div>

            {rating && Number(rating) >= 7.8 && (
              <span className="hover-badge-top">TOP 10</span>
            )}
            {type && (
              <span className="hover-type-badge">{type === "tv" ? "SERIES" : "MOVIE"}</span>
            )}
          </div>

          <div className="hover-info-body">
            {/* Action Buttons Row */}
            <div className="hover-action-row">
              <div className="hover-action-left">
                {/* Play Button */}
                <div className="hover-btn-play" title="Play Now">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6 3 20 12 6 21 6 3"/>
                  </svg>
                </div>

                {/* Add to Watchlist Button */}
                <button
                  type="button"
                  className={`hover-btn-circle ${inWatchlist ? "active" : ""}`}
                  title={inWatchlist ? "In Your Watchlist" : "Add to My List"}
                  onClick={handleToggleWatchlist}
                >
                  {inWatchlist ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  )}
                </button>

                {/* Like Button */}
                <button
                  type="button"
                  className={`hover-btn-circle ${isLiked ? "active" : ""}`}
                  title={isLiked ? "Liked" : "I like this"}
                  onClick={handleToggleLike}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                </button>
              </div>

              {/* Chevron Down Arrow Button for More Info (like Netflix / NetMirror) */}
              <button
                type="button"
                className="hover-btn-more-arrow"
                title="Episodes & info"
                onClick={handleMoreInfoClick}
                aria-label="More Information"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>

            {/* Metadata Tags Row */}
            <div className="hover-meta-row">
              <span className="hover-match">{matchScore}% match</span>
              <span className="hover-age-badge">{resolveMaturity()}</span>
              <span className="hover-duration">{resolveDuration()}</span>
              <span className="hover-res-badge">HD</span>
            </div>

            {/* Genres Tag List Row */}
            <div className="hover-genres-row">
              {genreList.map((g, idx) => (
                <span key={idx} className="hover-genre-item">
                  <span>{g}</span>
                  {idx < genreList.length - 1 && <span className="hover-genre-dot">•</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function TmdbCard({ item, isWide = false }) {
  if (!item) return null;
  const isClassics = item.type === "classics";
  const targetHref = isClassics ? `/classics/${item.id}` : `/${item.type || "movie"}/${item.id}`;

  return (
    <Card
      key={(item.type || "m") + item.id}
      href={targetHref}
      title={item.title}
      poster={item.poster}
      backdrop={item.backdrop}
      rating={item.rating}
      quality={item.quality}
      type={item.type}
      audioBadge={item.audioBadge}
      isWide={isWide}
      genres={item.genres}
      runtime={item.runtime}
      seasons={item.seasons}
      number_of_seasons={item.number_of_seasons}
      item={item}
      sub={[
        item.year,
        item.runtime ? `${item.runtime}m` : (item.number_of_seasons ? `${item.number_of_seasons} Season${item.number_of_seasons > 1 ? "s" : ""}` : null)
      ].filter(Boolean).join(" • ")}
    />
  );
}

export const tmdbCard = (x) => <TmdbCard key={(x.type || "m") + x.id} item={x} />;
