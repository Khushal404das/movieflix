"use client";

import { getSessionState, redirectToVerification } from "@/lib/SessionManager";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// In-memory client cache for episodes across seasons
const episodeMemoryCache = new Map();

/**
 * Verified direct video providers that stream the ACTUAL movie / series.
 * Zero dummy/test streams, zero manual URL pasting required.
 */
const PROVIDERS = [
  {
    key: "vidlink",
    label: "VidLink (Multi-Audio)",
    icon: "🎬",
    badge: "1080p • Multi-Audio",
    hasMultiAudio: true,
    getUrl: (type, id, s = 1, e = 1) =>
      type === "tv"
        ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&autoplay=false`
        : `https://vidlink.pro/movie/${id}?primaryColor=e50914&autoplay=false`,
  },
  {
    key: "vidsrc_cloud",
    label: "VidSrc Cloud",
    icon: "📡",
    badge: "Fast Stream",
    hasMultiAudio: false,
    getUrl: (type, id, s = 1, e = 1) =>
      type === "tv"
        ? `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    key: "vidsrc_pro",
    label: "VidSrc Pro",
    icon: "🚀",
    badge: "Ultra Mirror",
    hasMultiAudio: false,
    getUrl: (type, id, s = 1, e = 1) =>
      type === "tv"
        ? `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.xyz/embed/movie/${id}`,
  },
  {
    key: "videasy",
    label: "Videasy Stream",
    icon: "🌍",
    badge: "HD Server",
    hasMultiAudio: false,
    getUrl: (type, id, s = 1, e = 1) =>
      type === "tv"
        ? `https://player.videasy.to/tv/${id}/${s}/${e}`
        : `https://player.videasy.to/movie/${id}`,
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

  const [providerIndex, setProviderIndex] = useState(0);
  const [currentSeason, setCurrentSeason] = useState(Number(searchParams.get("season")) || initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(Number(searchParams.get("episode")) || initialEpisode);
  const [isTheater, setIsTheater] = useState(false);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [episodesList, setEpisodesList] = useState(episodesData);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [isPlayerBuffering, setIsPlayerBuffering] = useState(true);

  // Active streaming provider
  const activeProvider = PROVIDERS[providerIndex] || PROVIDERS[0];
  const embedUrl = activeProvider.getUrl(type, id, currentSeason, currentEpisode);

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

  // Buffer state resets when title, episode, or server switches
  useEffect(() => {
    setIsPlayerBuffering(true);
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

  const handleNextServer = () => {
    setProviderIndex((prev) => (prev + 1) % PROVIDERS.length);
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
          <span className="server-name-badge">Server: {activeProvider.label}</span>
        </div>

        <div className="player-actions">
          <button
            type="button"
            className="tool-btn"
            onClick={handleNextServer}
            title="Switch to next streaming server"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>
            </svg>
            <span>Switch Server</span>
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

      {/* Streaming Server Selector Pills */}
      <div className="provider-selector">
        <span className="provider-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          Streaming Server:
        </span>
        <div className="provider-pills">
          {PROVIDERS.map((p, idx) => (
            <button
              key={p.key}
              type="button"
              className={`provider-pill ${idx === providerIndex ? "active" : ""}`}
              onClick={() => {
                setProviderIndex(idx);
                setIsPlayerBuffering(true);
              }}
              title={`Switch to ${p.label}`}
            >
              <span className="provider-icon">{p.icon}</span>
              <span className="provider-name">{p.label}</span>
              {p.hasMultiAudio && <span className="provider-multi-tag">DUBBED</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Video Cinema Screen - Plays the Actual Video */}
      <div className="player-screen-container">
        {isPlayerBuffering && (
          <div className="player-buffering-overlay">
            <div className="stream-spinner" />
            <span className="buffering-text">Loading {title}...</span>
            <span className="buffering-subtext">
              Streaming via {activeProvider.label} • 1080p Ultra HD
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
          }}
        />
      </div>

      {/* Multi-Audio & Dubbed Track Info Strip */}
      <div className="player-audio-selector-strip">
        <div className="player-audio-tip-banner">
          <span className="tip-icon">🔊</span>
          <div className="tip-text">
            <b>Multi-Audio & Dubbed Audio Tracks:</b>
            <span>To select Hindi [हिन्दी], English, Tamil [தமிழ்], Telugu [తెలుగు] or subtitles, click the ⚙️ settings / audio icon inside the player controls.</span>
          </div>
        </div>
        <div className="audio-lang-quick-badges">
          <span className="audio-pill active">🇬🇧 English [Original]</span>
          <span className="audio-pill">🇮🇳 Hindi [हिन्दी]</span>
          <span className="audio-pill">🇮🇳 Tamil [தமிழ்]</span>
          <span className="audio-pill">🇮🇳 Telugu [తెలుగు]</span>
          <span className="audio-pill">🇮🇳 Malayalam</span>
          <span className="audio-pill">🇮🇳 Kannada</span>
        </div>
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
