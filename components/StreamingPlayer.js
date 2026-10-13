"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const SERVERS = [
  {
    id: "vidlink",
    name: "Server 1 (VidLink Multi-Audio)",
    speed: "Ultra HD",
    badge: "Multi-Audio 🎧",
    getMovieUrl: (id) => `https://vidlink.pro/movie/${id}?primaryColor=e50914`,
    getTvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914`
  },
  {
    id: "multiembed",
    name: "Server 2 (MultiEmbed Dual-Audio)",
    speed: "Fast CDN",
    badge: "Dubbed 🌐",
    getMovieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    id: "autoembed",
    name: "Server 3 (AutoEmbed Turbo)",
    speed: "Global CDN",
    badge: "Turbo",
    getMovieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`
  },
  {
    id: "vidsrc_cc",
    name: "Server 4 (VidSrc CC)",
    speed: "Multi-Mirror",
    badge: "Pro",
    getMovieUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`
  },
  {
    id: "vidsrc_me",
    name: "Server 5 (VidSrc VIP)",
    speed: "Fast 1080p",
    badge: "HD",
    getMovieUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
  },
  {
    id: "smashy",
    name: "Server 6 (SmashyStream)",
    speed: "Ad-Light",
    badge: "Stream",
    getMovieUrl: (id) => `https://player.smashy.stream/movie/${id}`,
    getTvUrl: (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`
  }
];

// In-memory client cache for episodes across seasons
const episodeMemoryCache = new Map();

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

  const [activeServer, setActiveServer] = useState(SERVERS[0].id);
  const [currentSeason, setCurrentSeason] = useState(Number(searchParams.get("season")) || initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(Number(searchParams.get("episode")) || initialEpisode);
  const [isTheater, setIsTheater] = useState(false);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [episodesList, setEpisodesList] = useState(episodesData);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [isPlayerBuffering, setIsPlayerBuffering] = useState(true);

  // Cinema Lights Off handler: hides whole page, enables Esc key & click-outside, smooth-scrolls
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

  // Buffer state resets when title or server switches
  useEffect(() => {
    setIsPlayerBuffering(true);
    const timer = setTimeout(() => setIsPlayerBuffering(false), 2000);
    return () => clearTimeout(timer);
  }, [activeServer, currentSeason, currentEpisode, id]);

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

  const selectedServer = SERVERS.find((s) => s.id === activeServer) || SERVERS[0];
  const embedUrl = type === "tv"
    ? selectedServer.getTvUrl(id, currentSeason, currentEpisode)
    : selectedServer.getMovieUrl(id);

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

  const cycleNextServer = () => {
    const currentIndex = SERVERS.findIndex((s) => s.id === activeServer);
    const nextIndex = (currentIndex + 1) % SERVERS.length;
    setActiveServer(SERVERS[nextIndex].id);
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
          <b>{type === "tv" ? `Season ${currentSeason} : Episode ${currentEpisode}` : "Direct HD Stream"}</b>
          <span className="res-badge">1080p Ultra</span>
          <span className="server-speed-tag">⚡ {selectedServer.speed}</span>
          <span className="audio-badge" title="Change language or dubbed audio via the gear ⚙️ icon inside the player">🎧 Multi-Audio & Dubs</span>
        </div>

        <div className="player-actions">
          <button
            type="button"
            className="tool-btn highlight"
            onClick={cycleNextServer}
            title="Fast switch to next streaming server"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            <span>Next Server</span>
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

      {/* Main Video Embed Player Screen */}
      <div className="player-screen-container">
        {isPlayerBuffering && (
          <div className="player-buffering-overlay">
            <div className="stream-spinner" />
            <span className="buffering-text">Loading stream from {selectedServer.name}...</span>
            <span className="buffering-subtext">If video takes time, click any other server below for instant playback</span>
          </div>
        )}
        <iframe
          key={`${activeServer}-${type}-${id}-${currentSeason}-${currentEpisode}`}
          src={embedUrl}
          className="streaming-iframe"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          loading="eager"
          title={`${title} ${type === "tv" ? `S${currentSeason}E${currentEpisode}` : ""}`}
          onLoad={() => setIsPlayerBuffering(false)}
        />
      </div>

      {/* Server & TV Episode Quick Navigation Bar */}
      <div className="player-control-dock">
        <div className="server-selector-group">
          <span className="dock-label">🚀 Fast Servers:</span>
          <div className="server-chips">
            {SERVERS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`server-chip ${activeServer === s.id ? "active" : ""}`}
                onClick={() => setActiveServer(s.id)}
              >
                <span className="num-badge">{idx + 1}</span>
                <span className="server-name-text">{s.name.replace(/\(.*\)/, "")}</span>
                <span className="server-badge-pill">{s.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {type === "tv" && (
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
        )}
      </div>

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
              <span>{episodesList.length} Episodes available • Instant play</span>
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