"use client";

import { useState } from "react";
import Link from "next/link";

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
  isWide = false
}) {
  const [imgError, setImgError] = useState(false);
  const [hoverImgError, setHoverImgError] = useState(false);

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

  return (
    <div className={`netflix-card-item ${isWide ? "wide-card" : ""}`}>
      <Link href={href} prefetch={true} className="netflix-card-link">
        {/* Base Card Display */}
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

          {/* Top Badges (Audio/Dub + Top Rated) */}
          <div className="netflix-card-badge-top">

            {rating && Number(rating) >= 7.5 && (
              <span className="top-rated-tag">TOP RATED</span>
            )}
          </div>
        </div>

        {/* Floating Quick Action Pop-up Overlay on Hover */}
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

            {rating && Number(rating) >= 7.5 && (
              <span className="hover-badge-top">TOP 10</span>
            )}
            {type && (
              <span className="hover-type-badge">{type === "tv" ? "SERIES" : "MOVIE"}</span>
            )}
          </div>

          <div className="hover-info-body">
            <div className="hover-action-row">
              <div className="hover-btn-play" title="Play Now">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              </div>
              <div className="hover-btn-circle" title="Add to My List">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div className="hover-btn-circle" title="Like">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              </div>
            </div>

            <div className="hover-meta-row">
              <span className="hover-match">{matchScore}% Match</span>
              <span className="hover-age">{Number(rating) >= 7.5 ? "16+" : "13+"}</span>
              <span className="hover-res">{quality || "4K Ultra HD"}</span>
            </div>

            <div className="hover-title-row">
              <span className="hover-title" title={title}>{title}</span>
              {sub && <span className="hover-sub">{sub}</span>}
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
      sub={[item.year, item.runtime ? `${item.runtime}m` : (item.number_of_seasons ? `${item.number_of_seasons} Season${item.number_of_seasons > 1 ? "s" : ""}` : null)].filter(Boolean).join(" • ")}
    />
  );
}

export const tmdbCard = (x) => <TmdbCard key={(x.type || "m") + x.id} item={x} />;
