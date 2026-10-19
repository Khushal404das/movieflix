"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import WatchlistButton from "./WatchlistButton";

const LANG_AUDIO_MAP = {
  hi: { label: "Hindi Audio 🇮🇳", badge: "हिन्दी" },
  te: { label: "Telugu · Hindi Dub", badge: "తెలుగు" },
  ta: { label: "Tamil · Hindi Dub", badge: "தமிழ்" },
  ja: { label: "Anime Dub + Sub 🇯🇵", badge: "日本語" },
  ko: { label: "K-Drama Multi-Audio 🇰🇷", badge: "한국어" },
  es: { label: "Spanish · Dubbed 🇪🇸", badge: "Español" },
  fr: { label: "French · Dubbed 🇫🇷", badge: "Français" },
  de: { label: "German · Dubbed 🇩🇪", badge: "Deutsch" },
  en: { label: "Dual Audio [Hin+Eng] 🎧", badge: "Dual Audio" },
};

function getSupplementalMsg(item) {
  if (!item) return null;
  const lang = item.original_language || "en";
  if (["te", "ta"].includes(lang)) return "Watch in Tamil, Telugu, Hindi, Malayalam, Kannada";
  if (lang === "hi") return "Watch in Hindi, English · Full HD";
  if (lang === "ko") return "Watch in Korean, Hindi Dub, English Sub";
  if (lang === "ja") return "Watch in Japanese (Sub) · Hindi Dub · English Dub";
  if (lang === "en" && item.isDubbed) return "Watch in Hindi Dub, English, Multi-Audio 🎧";
  return "Watch in English · Multi-Audio Available";
}

function getOttBadge(item) {
  if (!item) return null;
  const lang = item.original_language || "en";
  if (["te", "ta", "hi", "ml"].includes(lang)) return { name: "Hotstar", color: "#1F80E0" };
  if (lang === "ko") return { name: "Netflix", color: "#E50914" };
  if (lang === "ja") return { name: "Crunchyroll", color: "#F47521" };
  // deterministic based on id to avoid hydration mismatch
  const id = item.id || 0;
  if (id % 3 === 0) return { name: "Netflix", color: "#E50914" };
  if (id % 3 === 1) return { name: "Prime Video", color: "#00A8E1" };
  return { name: "Disney+", color: "#113CCF" };
}

export default function NetflixBillboard({ item, items = [] }) {
  const allItems = items.length > 0 ? items : item ? [item] : [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const current = allItems[currentIdx] || null;
  const supplementalMsg = getSupplementalMsg(current);
  const ottBadge = getOttBadge(current);

  const goTo = useCallback((idx) => {
    if (idx === currentIdx || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => { setCurrentIdx(idx); setIsTransitioning(false); }, 400);
  }, [currentIdx, isTransitioning]);

  useEffect(() => {
    if (allItems.length <= 1) return;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % allItems.length);
        setIsTransitioning(false);
      }, 400);
    }, 8000);
    return () => clearInterval(timer);
  }, [allItems.length]);

  if (!current) return null;

  return (
    <div className="netflix-billboard-hero">
      <div key={currentIdx} className={`billboard-backdrop-img ${isTransitioning ? "billboard-fade-out" : "billboard-fade-in"}`}
        style={{ backgroundImage: `url(${current.backdrop || current.poster})` }} />
      <div className="billboard-vignette-left" />
      <div className="billboard-vignette-bottom" />

      <div className={`billboard-content ${isTransitioning ? "content-fade-out" : "content-fade-in"}`}>
        <div className="billboard-badge-row">
          <span className="n-series-badge">
            <span className="n-logo-letter">N</span>
            <span className="badge-text">{current.type === "tv" ? "SERIES" : "FILM"}</span>
          </span>
          {ottBadge && (
            <span className="ott-platform-badge" style={{ borderColor: ottBadge.color }}>
              <span className="ott-dot" style={{ background: ottBadge.color }} />
              {ottBadge.name}
            </span>
          )}
          <span className="top10-ribbon">
            <span className="top10-badge-box">TOP 10</span>
            <span>#1 {current.type === "tv" ? "in Series" : "in Movies"} Today</span>
          </span>
        </div>

        {supplementalMsg && (
          <div className="billboard-supplemental-msg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            {supplementalMsg}
          </div>
        )}

        <h1 className="billboard-title">{current.title}</h1>

        <div className="billboard-meta-row">
          <span className="match-score">{current.match || "98% Match"}</span>
          <span className="age-rating-pill">{current.age || "16+"}</span>
          <span className="res-badge-pill">{current.quality || "4K Ultra HD"}</span>
          <span className="duration-pill">
            {current.number_of_seasons
              ? `${current.number_of_seasons} Season${current.number_of_seasons > 1 ? 's' : ''}`
              : (current.year || "2024")}
          </span>
          {current.audioBadge && <span className="audio-lang-pill">🎧 {current.audioBadge}</span>}
        </div>

        <p className="billboard-overview">
          {current.overview?.slice(0, 220)}{current.overview?.length > 220 ? "..." : ""}
        </p>

        <div className="billboard-actions">
          <Link href={`/${current.type || "movie"}/${current.id}`} prefetch={true} className="btn-netflix-play">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            <span>Play</span>
          </Link>
          <button type="button" className="btn-netflix-info" onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("movieflix:open-preview", {
                detail: { item: current, type: current.type || "movie", id: current.id, title: current.title, backdrop: current.backdrop, poster: current.poster, rating: current.rating, href: `/${current.type || "movie"}/${current.id}` }
              }));
            }
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span>More Info</span>
          </button>
          <WatchlistButton className="btn-netflix-list" item={{ href: `/${current.type || "movie"}/${current.id}`, title: current.title, poster: current.poster, rating: current.rating, sub: current.year, type: current.type || "movie" }} />
        </div>

        {allItems.length > 1 && (
          <div className="billboard-pagination-dots">
            {allItems.map((_, idx) => (
              <button key={idx} type="button" className={`billboard-dot ${idx === currentIdx ? "active" : ""}`}
                onClick={() => goTo(idx)} aria-label={`View item ${idx + 1}`} />
            ))}
          </div>
        )}
      </div>

      <div className="billboard-side-badge">
        <button type="button" className="btn-billboard-sound" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          )}
        </button>
        <span className="age-tab">{current.age || "16+"}</span>
      </div>
    </div>
  );
}
