"use client";

import { useState } from "react";
import Link from "next/link";
import WatchlistButton from "./WatchlistButton";

export default function NetflixBillboard({ item }) {
  const [isMuted, setIsMuted] = useState(true);

  if (!item) return null;

  return (
    <div className="netflix-billboard-hero">
      {/* Background Image or Video Backdrop */}
      <div
        className="billboard-backdrop-img"
        style={{ backgroundImage: `url(${item.backdrop || item.poster})` }}
      />
      
      {/* Cinematic Vignettes and Gradient Overlays */}
      <div className="billboard-vignette-left" />
      <div className="billboard-vignette-bottom" />

      <div className="billboard-content">
        {/* Netflix / Prime Logo Ribbon */}
        <div className="billboard-badge-row">
          <span className="n-series-badge">
            <span className="n-logo-letter">N</span>
            <span className="badge-text">{item.type === "tv" ? "SERIES" : "FILM"}</span>
          </span>
          <span className="top10-ribbon">
            <span className="top10-badge-box">TOP 10</span>
            <span>#1 in Movies Today</span>
          </span>
        </div>

        {/* Title */}
        <h1 className="billboard-title">{item.title}</h1>

        {/* Meta Stats */}
        <div className="billboard-meta-row">
          <span className="match-score">{item.match || "98% Match"}</span>
          <span className="age-rating-pill">{item.age || "16+"}</span>
          <span className="res-badge-pill">{item.quality || "4K Ultra HD"}</span>
          <span className="duration-pill">
            {item.number_of_seasons
              ? `${item.number_of_seasons} Season${item.number_of_seasons > 1 ? 's' : ''}`
              : (item.year || "2024")}
          </span>
        </div>

        {/* Synopsis */}
        <p className="billboard-overview">
          {item.overview?.slice(0, 220)}{item.overview?.length > 220 ? "..." : ""}
        </p>

        {/* Action Buttons */}
        <div className="billboard-actions">
          <Link
            href={`/${item.type || "movie"}/${item.id}`}
            prefetch={true}
            className="btn-netflix-play"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            <span>Play</span>
          </Link>

          <Link
            href={`/${item.type || "movie"}/${item.id}`}
            prefetch={true}
            className="btn-netflix-info"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span>More Info</span>
          </Link>

          <WatchlistButton
            className="btn-netflix-list"
            item={{
              href: `/${item.type || "movie"}/${item.id}`,
              title: item.title,
              poster: item.poster,
              rating: item.rating,
              sub: item.year,
              type: item.type || "movie"
            }}
          />
        </div>
      </div>

      {/* Right Side Age & Audio Badge */}
      <div className="billboard-side-badge">
        <button
          type="button"
          className="btn-billboard-sound"
          onClick={() => setIsMuted(!isMuted)}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          )}
        </button>
        <span className="age-tab">{item.age || "16+"}</span>
      </div>
    </div>
  );
}
