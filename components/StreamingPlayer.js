"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const SERVERS = [
  {
    id: "multiembed",
    name: "Server 1 (MultiEmbed Dual-Audio)",
    speed: "Fast CDN",
    badge: "Dubbed 🎧",
    audioMode: "dubbed",
    getMovieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    id: "vidsrc_me",
    name: "Server 2 (VidSrc VIP)",
    speed: "Ultra HD",
    badge: "VIP 1080p ⭐",
    audioMode: "original",
    getMovieUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
  },
  {
    id: "vidsrc_to",
    name: "Server 3 (VidSrc TO)",
    speed: "Multi-Mirror",
    badge: "Pro HD 🚀",
    audioMode: "original",
    getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  {
    id: "twoembed",
    name: "Server 4 (2Embed Multi-Lang)",
    speed: "Global CDN",
    badge: "Multi-Lang 🌐",
    audioMode: "multi",
    getMovieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    getTvUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  },
  {
    id: "rgshows",
    name: "Server 5 (RGShows Turbo)",
    speed: "Fast Play",
    badge: "Turbo ⚡",
    audioMode: "original",
    getMovieUrl: (id) => `https://rgshows.me/player/movie/${id}`,
    getTvUrl: (id, s, e) => `https://rgshows.me/player/tv/${id}/${s}/${e}`
  },
  {
    id: "nontongo",
    name: "Server 6 (NontonGo Mirror)",
    speed: "Ad-Light",
    badge: "Mirror 🛡️",
    audioMode: "multi",
    getMovieUrl: (id) => `https://www.NontonGo.win/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://www.NontonGo.win/embed/tv/${id}/${s}/${e}`
  }
];

const AUDIO_PRESETS = [
  { id: "dubbed", label: "🎧 Dual Audio / Hindi Dub", targetServer: "multiembed", tip: "Best for Hindi dubbed & dual audio streams" },
  { id: "vip", label: "⭐ VidSrc VIP (1080p Ultra)", targetServer: "vidsrc_me", tip: "High bitrate crisp 1080p original stream" },
  { id: "multi", label: "🌐 Multi-Language (2Embed)", targetServer: "twoembed", tip: "Multi-language audio & subtitle support" },
  { id: "turbo", label: "⚡ Turbo Fast Mirror", targetServer: "vidsrc_to", tip: "Ultra fast cloud mirror with zero buffer" }
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
  const [activeAudioPreset, setActiveAudioPreset] = useState("dubbed");
  const [currentSeason, setCurrentSeason] = useState(Number(searchParams.get("season")) || initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(Number(searchParams.get("episode")) || initialEpisode);
  const [isTheater, setIsTheater] = useState(false);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [episodesList, setEpisodesList] = useState(episodesData);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [isPlayerBuffering, setIsPlayerBuffering] = useState(true);
  const [downloadNotice, setDownloadNotice] = useState("");

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

  const handleAudioPreset = (preset) => {
    setActiveAudioPreset(preset.id);
    setActiveServer(preset.targetServer);
  };

  // Download Action (Android Native + Web)
  const handleDownloadClick = () => {
    const mediaName = type === "tv" 
      ? `${title}_S${currentSeason}E${currentEpisode}.mp4`
      : `${title}.mp4`;
    
    // Check if running inside Android Native App Bridge
    if (typeof window !== "undefined" && (window.Android || window.MovieFlixBridge)) {
      const bridge = window.Android || window.MovieFlixBridge;
      if (typeof bridge.downloadFile === "function") {
        bridge.downloadFile(embedUrl, mediaName, "video/mp4");
        setDownloadNotice("📥 Native download initiated to your Android Downloads folder!");
        setTimeout(() => setDownloadNotice(""), 5000);
        return;
      }
    }

    // Web Fallback: Direct Download Mirror
    window.open(`https://dl.vidsrc.vip/${type}/${id}${type === "tv" ? `/${currentSeason}/${currentEpisode}` : ""}`, "_blank");
    setDownloadNotice("📥 Opening high-speed download server in new tab...");
    setTimeout(() => setDownloadNotice(""), 5000);
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
          <span className="audio-badge">🎧 Multi-Audio & Dubs</span>
        </div>

        <div className="player-actions">
          <button
            type="button"
            className="tool-btn download-highlight"
            onClick={handleDownloadClick}
            title="Download Stream in HD"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download</span>
          </button>

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

      {/* NetMirror Audio Mode Selector Strip */}
      <div className="player-audio-selector-strip">
        <span className="audio-strip-label">🎙️ Audio & Server Presets:</span>
        <div className="audio-preset-buttons">
          {AUDIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`audio-preset-chip ${activeAudioPreset === preset.id ? "active" : ""}`}
              onClick={() => handleAudioPreset(preset)}
              title={preset.tip}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Download Alert Notice */}
      {downloadNotice && (
        <div className="player-download-notice">
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Main Video Embed Player Screen */}
      <div className="player-screen-container">
        {isPlayerBuffering && (
          <div className="player-buffering-overlay">
            <div className="stream-spinner" />
            <span className="buffering-text">Connecting to {selectedServer.name}...</span>
            <span className="buffering-subtext">Multi-Audio & Dubbed available. Instant HD playback.</span>
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

      {/* NetMirror Multi-Audio Instructions Bar */}
      <div className="player-audio-tip-banner">
        <span className="tip-icon">💡</span>
        <span className="tip-text">
          <strong>Audio & Dub Switching:</strong> To choose between <strong>Hindi Dubbed, Dual-Audio, Spanish, French</strong>, or other languages, use the presets above or tap the <strong>Settings (⚙️) / Audio (🎧)</strong> icon inside the video player controls.
        </span>
      </div>

      {/* Server & TV Episode Quick Navigation Bar */}
      <div className="player-control-dock">
        <div className="server-selector-group">
          <span className="dock-label">🚀 Streaming Mirrors:</span>
          <div className="server-chips">
            {SERVERS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`server-chip ${activeServer === s.id ? "active" : ""}`}
                onClick={() => {
                  setActiveServer(s.id);
                  if (s.audioMode) setActiveAudioPreset(s.audioMode);
                }}
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
              <span>{episodesList.length} Episodes available • Instant Multi-Audio</span>
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
