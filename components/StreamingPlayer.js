"use client";

import { getSessionState, redirectToVerification } from "@/lib/SessionManager";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// In-memory client cache for episodes across seasons
const episodeMemoryCache = new Map();

/**
 * Single high-performance direct cinema streaming server (VidLink Pro).
 * Delivers 1080p Ultra HD with Multi-Audio tracks (English, Hindi, Tamil, Telugu, etc.)
 * Zero dummy/test streams, zero manual URL pasting required.
 */
const getEmbedUrl = (type, id, s = 1, e = 1) =>
  type === "tv"
    ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&autoplay=false`
    : `https://vidlink.pro/movie/${id}?primaryColor=e50914&autoplay=false`;

export default function StreamingPlayer({
  type = "movie",
  id,
  title,
  poster,
  backdrop,
  seasons = [],
  initialSeason = 1,
  initialEpisode = 1,
  episodesData = []
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerRef = useRef(null);

  const [currentSeason, setCurrentSeason] = useState(Number(searchParams.get("season")) || initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(Number(searchParams.get("episode")) || initialEpisode);
  const [isTheater, setIsTheater] = useState(false);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [episodesList, setEpisodesList] = useState(episodesData);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [isPlayerBuffering, setIsPlayerBuffering] = useState(true);

  // Single direct embed URL
  const embedUrl = getEmbedUrl(type, id, currentSeason, currentEpisode);

  // Verify session validity before streaming (like NetMirror)
  useEffect(() => {
    const session = getSessionState();
    if (session.isExpired || session.isTimedOut) {
      redirectToVerification(window.location.pathname + window.location.search);
    }
  }, [id, currentSeason, currentEpisode]);

  // Cinema Lights Off handler
  useEffect(() => {
    if (isLightsOff) {
      document.body.classList.add("lights-off-active");
      if (playerRef.current) {
        playerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const handleKeyDown = (e) => {
        if (e.key === "Escape") setIsLightsOff(false);
      };

      const handleDocumentClick = (e) => {
        if (playerRef.current && !playerRef.current.contains(e.target)) {
          if (!e.target.closest || !e.target.closest(".floating-lights-on-btn")) {
            setIsLightsOff(false);
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleDocumentClick);

      return () => {
        document.body.classList.remove("lights-off-active");
        window.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleDocumentClick);
      };
    } else {
      document.body.classList.remove("lights-off-active");
    }
  }, [isLightsOff]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("lights-off-active");
    };
  }, []);

  // Sync state if URL changes
  useEffect(() => {
    const sParam = searchParams.get("season");
    const eParam = searchParams.get("episode");
    if (sParam && Number(sParam) !== currentSeason) setCurrentSeason(Number(sParam));
    if (eParam && Number(eParam) !== currentEpisode) setCurrentEpisode(Number(eParam));
  }, [searchParams]);

  // Fast episode loading with memory cache
  useEffect(() => {
    if (type !== "tv") return;

    const cacheKey = `${id}-s${currentSeason}`;

    if (episodeMemoryCache.has(cacheKey)) {
      setEpisodesList(episodeMemoryCache.get(cacheKey));
      return;
    }

    if (episodesData.length > 0 && currentSeason === initialSeason) {
      episodeMemoryCache.set(cacheKey, episodesData);
      setEpisodesList(episodesData);
      return;
    }

    let isMounted = true;
    async function loadEpisodes() {
      setIsLoadingEpisodes(true);
      try {
        const res = await fetch(`/api/episodes?id=${id}&season=${currentSeason}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.episodes) {
            episodeMemoryCache.set(cacheKey, data.episodes);
            setEpisodesList(data.episodes);
          }
        }
      } catch (err) {
        console.error("Failed to load episodes:", err);
      } finally {
        if (isMounted) setIsLoadingEpisodes(false);
      }
    }

    loadEpisodes();
    return () => { isMounted = false; };
  }, [type, id, currentSeason, initialSeason, episodesData]);

  // Buffer state resets when title or episode switches
  useEffect(() => {
    setIsPlayerBuffering(true);
    const timer = setTimeout(() => setIsPlayerBuffering(false), 2000);
    return () => clearTimeout(timer);
  }, [currentSeason, currentEpisode, id]);

  // Record into Continue Watching (localStorage)
  useEffect(() => {
    if (!id || !title) return;
    try {
      const history = JSON.parse(localStorage.getItem("rh-history") || "[]");
      const currentItem = {
        id,
        type,
        title,
        poster,
        season: type === "tv" ? currentSeason : undefined,
        episode: type === "tv" ? currentEpisode : undefined,
        href: type === "tv" ? `/tv/${id}?season=${currentSeason}&episode=${currentEpisode}` : `/movie/${id}`,
        timestamp: Date.now()
      };
      
      const filtered = history.filter((item) => String(item.id) !== String(id));
      const updated = [currentItem, ...filtered].slice(0, 20);
      localStorage.setItem("rh-history", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [id, type, title, poster, currentSeason, currentEpisode]);

  const handleEpisodeSelect = (epNum) => {
    setCurrentEpisode(epNum);
    router.replace(`/tv/${id}?season=${currentSeason}&episode=${epNum}`, { scroll: false });
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSeasonChange = (e) => {
    const s = Number(e.target.value);
    setCurrentSeason(s);
    setCurrentEpisode(1);
    router.replace(`/tv/${id}?season=${s}&episode=1`, { scroll: false });
  };

  const currentEpIndex = episodesList.findIndex((ep) => ep.episode_number === currentEpisode);
  const hasPrev = currentEpIndex > 0 || currentEpisode > 1;
  const hasNext = currentEpIndex >= 0 && currentEpIndex < episodesList.length - 1;

  const handlePrevEp = () => {
    if (hasPrev) {
      const prevEp = currentEpisode - 1;
      handleEpisodeSelect(prevEp);
    }
  };

  const handleNextEp = () => {
    if (hasNext) {
      const nextEp = currentEpisode + 1;
      handleEpisodeSelect(nextEp);
    }
  };

  return (
    <>
      {isLightsOff && (
        <>
          <div
            className="lights-backdrop"
            onClick={() => setIsLightsOff(false)}
            title="Click anywhere to turn lights on (Esc)"
          />
          <button
            type="button"
            className="floating-lights-on-btn"
            onClick={() => setIsLightsOff(false)}
            title="Exit Cinema Mode (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
            <span>Lights On</span>
            <kbd>Esc</kbd>
          </button>
        </>
      )}

      <div
        className={`player-wrapper ${isTheater ? "theater-mode" : ""} ${isLightsOff ? "lights-off" : ""}`}
        ref={playerRef}
      >
        {/* Top Player Header Controls */}
        <div className="player-topbar">
          <div className="player-badge">
            <span className="live-dot" />
            <b>{type === "tv" ? `Season ${currentSeason} : Episode ${currentEpisode}` : "Direct Cinema Stream"}</b>
            <span className="res-badge">1080p Ultra HD</span>
          </div>

          <div className="player-actions">
            <button
              type="button"
              className={`tool-btn ${isLightsOff ? "active" : ""}`}
              onClick={() => setIsLightsOff(!isLightsOff)}
              title="Toggle Lights (Dim Background)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              <span>{isLightsOff ? "Lights On" : "Lights Off"}</span>
            </button>

            <button
              type="button"
              className={`tool-btn ${isTheater ? "active" : ""}`}
              onClick={() => setIsTheater(!isTheater)}
              title="Toggle Theater Mode"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="15" x="2" y="4" rx="2"/><path d="m9 10 3 2 3-2"/></svg>
              <span>{isTheater ? "Normal View" : "Theater Mode"}</span>
            </button>
          </div>
        </div>

        {/* Main Video Cinema Screen - Plays the Actual Video */}
        <div className="player-screen-container">
          {isPlayerBuffering && (
            <div className="player-buffering-overlay">
              <div className="stream-spinner" />
              <span className="buffering-text">Loading {title}...</span>
              <span className="buffering-subtext">
                Direct Cinema Stream • 1080p Ultra HD
              </span>
            </div>
          )}
          <iframe
            key={`${type}-${id}-${currentSeason}-${currentEpisode}`}
            src={embedUrl}
            className="streaming-iframe"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            loading="eager"
            title={`${title} ${type === "tv" ? `S${currentSeason}E${currentEpisode}` : ""}`}
            onLoad={() => {
              setIsPlayerBuffering(false);
            }}
          />
        </div>



        {/* TV Series Quick Navigation Bar */}
        {type === "tv" && (
          <div className="player-footer-bar">
            <div className="tv-quick-nav">
              <button
                type="button"
                className="ep-nav-btn"
                onClick={handlePrevEp}
                disabled={!hasPrev}
                title="Previous Episode"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                <span>Prev Ep</span>
              </button>
              <span className="current-ep-pill">S{currentSeason} : E{currentEpisode}</span>
              <button
                type="button"
                className="ep-nav-btn"
                onClick={handleNextEp}
                disabled={!hasNext}
                title="Next Episode"
              >
                <span>Next Ep</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Interactive Episode Picker for Web Series */}
        {type === "tv" && (
          <div className="episodes-drawer">
            <div className="episodes-drawer-header">
              <div className="season-select-wrapper">
                <label htmlFor="season-select">Select Season:</label>
                <select
                  id="season-select"
                  className="season-dropdown"
                  value={currentSeason}
                  onChange={handleSeasonChange}
                >
                  {(seasons.length > 0 ? seasons : [{ season_number: 1, name: "Season 1" }]).map((s) => (
                    <option key={s.season_number} value={s.season_number}>
                      {s.name || `Season ${s.season_number}`} {s.episode_count ? `(${s.episode_count} Episodes)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="episodes-meta-info">
                <span>{episodesList.length} Episodes available • Instant HD Playback</span>
              </div>
            </div>

            {isLoadingEpisodes ? (
              <div className="episodes-loading">
                <div className="spinner" />
                <span>Loading Season {currentSeason} episodes...</span>
              </div>
            ) : (
              <div className="episodes-grid">
                {episodesList.map((ep) => {
                  const isPlaying = ep.episode_number === currentEpisode;
                  return (
                    <button
                      key={ep.id || ep.episode_number}
                      type="button"
                      className={`episode-card ${isPlaying ? "playing" : ""}`}
                      onClick={() => handleEpisodeSelect(ep.episode_number)}
                    >
                      <div className="ep-num-box">
                        {isPlaying ? (
                          <span className="playing-bars">
                            <span /><span /><span />
                          </span>
                        ) : (
                          <span>{ep.episode_number}</span>
                        )}
                      </div>
                      <div className="ep-details">
                        <div className="ep-title-row">
                          <span className="ep-name">{ep.name || `Episode ${ep.episode_number}`}</span>
                          {ep.runtime && <span className="ep-time">{ep.runtime}m</span>}
                        </div>
                        {ep.overview && <p className="ep-desc">{ep.overview.slice(0, 100)}{ep.overview.length > 100 ? "..." : ""}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
