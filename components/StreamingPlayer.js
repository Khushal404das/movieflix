"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// In-memory client cache for episodes across seasons
const episodeMemoryCache = new Map();

/**
 * Ordered list of embed providers.
 * Each has: label, icon, a getUrl(type, id, season, episode) builder,
 * and a `multiAudio` flag indicating built-in language switcher.
 */
const PROVIDERS = [
  {
    key: "vidsrc",
    label: "VidSrc Cloud",
    icon: "📡",
    multiAudio: false,
    badge: "Direct Cinema",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    key: "vidlink",
    label: "VidLink Cinema",
    icon: "🎬",
    multiAudio: true,
    badge: "Direct Stream",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&autoplay=true`
        : `https://vidlink.pro/movie/${id}?primaryColor=e50914&autoplay=true`,
  },
  {
    key: "videasy",
    label: "Videasy",
    icon: "🌍",
    multiAudio: true,
    badge: "Fast Stream",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://player.videasy.to/tv/${id}/${s}/${e}`
        : `https://player.videasy.to/movie/${id}`,
  },
  {
    key: "multiembed",
    label: "MultiEmbed",
    icon: "🎧",
    multiAudio: true,
    badge: "HD Stream",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
  {
    key: "anyembed",
    label: "AnyEmbed Fast",
    icon: "⚡",
    multiAudio: false,
    badge: "1080p Ultra HD",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://anyembed.xyz/embed/tmdb-tv-${id}-${s}-${e}`
        : `https://anyembed.xyz/embed/tmdb-movie-${id}`,
  },
];

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

  // Provider state: index into PROVIDERS array
  const [providerIndex, setProviderIndex] = useState(0);
  const [providerError, setProviderError] = useState(false);

  const activeProvider = PROVIDERS[providerIndex];

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

  // Buffer state resets when title or provider switches
  useEffect(() => {
    setIsPlayerBuffering(true);
    setProviderError(false);
    const timer = setTimeout(() => setIsPlayerBuffering(false), 2500);
    return () => clearTimeout(timer);
  }, [currentSeason, currentEpisode, id, providerIndex]);

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

  // Build embed URL from active provider
  const embedUrl = activeProvider.getUrl(type, id, currentSeason, currentEpisode);

  // Provider switching
  const handleProviderSwitch = (index) => {
    if (index === providerIndex) return;
    setProviderIndex(index);
  };

  const handleNextProvider = () => {
    setProviderIndex((prev) => (prev + 1) % PROVIDERS.length);
  };

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

  // Handle iframe load error detection via timeout
  useEffect(() => {
    const errorTimer = setTimeout(() => {
      if (isPlayerBuffering) {
        setProviderError(true);
      }
    }, 12000);
    return () => clearTimeout(errorTimer);
  }, [providerIndex, isPlayerBuffering]);

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
            className="tool-btn"
            onClick={handleNextProvider}
            title="Try next streaming provider if this one isn't working"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>
            </svg>
            <span>Switch Provider</span>
          </button>

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

      {/* Provider Selector Pill Bar */}
      <div className="provider-selector">
        <span className="provider-label">Stream Source:</span>
        <div className="provider-pills">
          {PROVIDERS.map((p, idx) => (
            <button
              key={p.key}
              type="button"
              className={`provider-pill ${idx === providerIndex ? "active" : ""}`}
              onClick={() => handleProviderSwitch(idx)}
              title={`Switch to ${p.label}`}
            >
              <span className="provider-icon">{p.icon}</span>
              <span className="provider-name">{p.label}</span>
              
            </button>
          ))}
        </div>
      </div>

      {/* Provider Error Banner */}
      {providerError && (
        <div className="provider-error-banner">
          <span>⚠️ This provider may be slow or unavailable.</span>
          <button type="button" onClick={handleNextProvider} className="try-next-btn">
            Try Next Provider →
          </button>
        </div>
      )}

      {/* Main Video Embed Player Screen */}
      <div className="player-screen-container">
        {isPlayerBuffering && (
          <div className="player-buffering-overlay">
            <div className="stream-spinner" />
            <span className="buffering-text">Loading Cinema Stream...</span>
            <span className="buffering-subtext">
              Streaming via {activeProvider.label}. Tap ⚙️ in video for quality & settings.
            </span>
          </div>
        )}
        <iframe
          key={`${providerIndex}-${type}-${id}-${currentSeason}-${currentEpisode}`}
          src={embedUrl}
          className="streaming-iframe"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          loading="eager"
          title={`${title} ${type === "tv" ? `S${currentSeason}E${currentEpisode}` : ""}`}
          onLoad={() => {
            setIsPlayerBuffering(false);
            setProviderError(false);
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
