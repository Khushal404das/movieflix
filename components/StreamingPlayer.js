"use client";

import { getSessionState, redirectToVerification } from "@/lib/SessionManager";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CinemaPlayer from "./CinemaPlayer";
import { resolveStream } from "@/lib/streams";

// In-memory client cache for episodes across seasons
const episodeMemoryCache = new Map();

// Helper to format seconds into MM:SS or HH:MM:SS
const formatTime = (t) => {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const s = Math.floor(t % 60);
  const m = Math.floor((t / 60) % 60);
  const h = Math.floor(t / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

// Supported audio track preferences
const AUDIO_TRACKS = [
  { code: "hindi", label: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "tamil", label: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "telugu", label: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" }
];

// Multi-server embed list — Vidbolt Pro is the #1 flagship player
const SERVERS = [
  {
    name: "⚡ Vidbolt Pro (Multi-Audio & Subs)",
    shortName: "Vidbolt Pro",
    isVidbolt: true,
    getUrl: (type, id, s, e, audio = "hindi") => {
      const audioParam = audio && audio !== "auto" ? `&audio=${encodeURIComponent(audio)}` : "";
      if (type === "anime-mal") {
        return `https://vidbolt.pro/anime/mal/${id}/${e}?theme=e50914&autoPlay=true&mobileSheets=true${audioParam}`;
      }
      if (type === "anime" || type === "anilist") {
        return `https://vidbolt.pro/anime/${id}/${e}?theme=e50914&autoPlay=true&mobileSheets=true${audioParam}`;
      }
      if (type === "tv") {
        return `https://vidbolt.pro/tv/${id}/${s}/${e}?theme=e50914&autoPlay=true&mobileSheets=true${audioParam}`;
      }
      return `https://vidbolt.pro/movie/${id}?theme=e50914&autoPlay=true&mobileSheets=true${audioParam}`;
    },
  },
  {
    name: "VidSrc Pro",
    shortName: "VidSrc Pro",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    name: "VidSrc Me",
    shortName: "VidSrc Me",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
        : `https://vidsrc.me/embed/movie?tmdb=${id}`,
  },
  {
    name: "VidSrc XYZ",
    shortName: "VidSrc XYZ",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
        : `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
  },
  {
    name: "EmbedSu",
    shortName: "EmbedSu",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://embed.su/embed/tv/${id}/${s}/${e}`
        : `https://embed.su/embed/movie/${id}`,
  },
  {
    name: "SuperEmbed",
    shortName: "SuperEmbed",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://multiembed.mov/?tmdb=1&video_id=${id}&s=${s}&e=${e}`
        : `https://multiembed.mov/?tmdb=1&video_id=${id}`,
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
  const iframeRef = useRef(null);

  const [currentSeason, setCurrentSeason] = useState(Number(searchParams.get("season")) || initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(Number(searchParams.get("episode")) || initialEpisode);
  const [isTheater, setIsTheater] = useState(false);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [episodesList, setEpisodesList] = useState(episodesData);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [serverIndex, setServerIndex] = useState(0);

  // Preferred audio track
  const [preferredAudio, setPreferredAudio] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rh-preferred-audio") || "hindi";
    }
    return "hindi";
  });

  // Player live telemetry & remote control state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  // Next episode countdown banner when video ends
  const [nextEpCountdown, setNextEpCountdown] = useState(null);

  // Mobile Bottom Sheet state (triggered by Vidbolt 'mobile-panel' event)
  const [bottomSheet, setBottomSheet] = useState({
    isOpen: false,
    tabs: {},
    tabNames: [],
    activeTab: ""
  });

  // Current active server config
  const currentServer = SERVERS[serverIndex] || SERVERS[0];
  const isVidboltActive = Boolean(currentServer.isVidbolt);

  // Resolve custom licensed stream if available
  const stream = useMemo(
    () => (type === "tv"
      ? resolveStream(type, id, { season: currentSeason, episode: currentEpisode })
      : resolveStream(type, id)),
    [type, id, currentSeason, currentEpisode]
  );

  // Send Remote Control postMessage to Vidbolt iframe
  const sendVidboltCommand = useCallback((cmdType, params = {}) => {
    const iframe = iframeRef.current || document.getElementById("vidbolt-player");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: cmdType, ...params }, "https://vidbolt.pro");
    }
  }, []);

  // Verify session validity before streaming
  useEffect(() => {
    const session = getSessionState();
    if (session.isExpired || session.isTimedOut) {
      redirectToVerification(window.location.pathname + window.location.search);
    }
  }, [id, currentSeason, currentEpisode]);

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

  // Reset playback telemetry when title/season/episode or server changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsPlayerReady(false);
    setNextEpCountdown(null);
  }, [id, currentSeason, currentEpisode, serverIndex]);

  // TV Episode navigation helpers
  const currentEpIndex = episodesList.findIndex((ep) => ep.episode_number === currentEpisode);
  const hasPrev = currentEpIndex > 0 || currentEpisode > 1;
  const hasNext = currentEpIndex >= 0 && currentEpIndex < episodesList.length - 1;

  const handleEpisodeSelect = useCallback((epNum) => {
    setCurrentEpisode(epNum);
    router.replace(`/tv/${id}?season=${currentSeason}&episode=${epNum}`, { scroll: false });
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [id, currentSeason, router]);

  const handleNextEp = useCallback(() => {
    if (hasNext) {
      handleEpisodeSelect(currentEpisode + 1);
    }
  }, [hasNext, currentEpisode, handleEpisodeSelect]);

  const handlePrevEp = useCallback(() => {
    if (hasPrev) {
      handleEpisodeSelect(currentEpisode - 1);
    }
  }, [hasPrev, currentEpisode, handleEpisodeSelect]);

  const handleSeasonChange = (e) => {
    const s = Number(e.target.value);
    setCurrentSeason(s);
    setCurrentEpisode(1);
    router.replace(`/tv/${id}?season=${s}&episode=1`, { scroll: false });
  };

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

  // Listen to Vidbolt postMessage events
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== "https://vidbolt.pro") return;
      const data = event.data;
      if (!data || typeof data !== "object") return;

      switch (data.type) {
        case "ready":
          setIsPlayerReady(true);
          break;
        case "play":
          setIsPlaying(true);
          break;
        case "pause":
          setIsPlaying(false);
          break;
        case "timeupdate":
          if (typeof data.time === "number") {
            setCurrentTime(data.time);
          }
          break;
        case "durationchange":
          if (typeof data.duration === "number") {
            setDuration(data.duration);
          }
          break;
        case "ended":
          setIsPlaying(false);
          if (type === "tv" && hasNext) {
            setNextEpCountdown(5);
          }
          break;
        case "mobile-panel": {
          // Mobile sheets integration from Step 05 docs
          const { options = [], initialGroup } = data;
          const tabs = {};
          for (const row of options) {
            const grp = row.group || "Options";
            if (!tabs[grp]) tabs[grp] = [];
            tabs[grp].push(row);
          }
          const tabNames = Object.keys(tabs);
          const activeTab = tabs[initialGroup] ? initialGroup : (tabNames[0] || "");
          setBottomSheet({
            isOpen: true,
            tabs,
            tabNames,
            activeTab
          });
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [type, hasNext]);

  // Countdown timer for auto next episode
  useEffect(() => {
    if (nextEpCountdown === null) return;
    if (nextEpCountdown <= 0) {
      setNextEpCountdown(null);
      handleNextEp();
      return;
    }
    const timer = setTimeout(() => {
      setNextEpCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [nextEpCountdown, handleNextEp]);

  // Audio preference switcher
  const handleSelectAudio = (langCode) => {
    setPreferredAudio(langCode);
    if (typeof window !== "undefined") {
      localStorage.setItem("rh-preferred-audio", langCode);
    }
    setShowAudioMenu(false);
  };

  // Handle Mobile Bottom Sheet Option Selected
  const handleBottomSheetOptionClick = (row) => {
    sendVidboltCommand("mobile-option", {
      option: row.option,
      value: row.value
    });

    // Update selection indicator in active bottom sheet
    setBottomSheet((prev) => {
      if (!prev.isOpen) return prev;
      const updatedTabs = { ...prev.tabs };
      for (const grp of Object.keys(updatedTabs)) {
        updatedTabs[grp] = updatedTabs[grp].map((item) => {
          if (item.option === row.option) {
            return { ...item, selected: item.value === row.value };
          }
          return item;
        });
      }
      return { ...prev, tabs: updatedTabs };
    });
  };

  // Remote control seek handlers
  const handleSeekDelta = (delta) => {
    const target = Math.max(0, Math.min(currentTime + delta, duration || 999999));
    sendVidboltCommand("seek", { time: target });
    setCurrentTime(target);
  };

  // Remote control play/pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      sendVidboltCommand("pause");
      setIsPlaying(false);
    } else {
      sendVidboltCommand("play");
      setIsPlaying(true);
    }
  };

  // Remote control volume toggle
  const handleToggleMute = () => {
    if (isMuted) {
      sendVidboltCommand("volume", { volume: volume || 1 });
      setIsMuted(false);
    } else {
      sendVidboltCommand("volume", { volume: 0 });
      setIsMuted(true);
    }
  };

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

  // Global player keyboard hotkeys (when not in an input)
  useEffect(() => {
    const handleHotkeys = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName)) return;
      if (e.key === " " && isVidboltActive) {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "ArrowLeft" && isVidboltActive) {
        e.preventDefault();
        handleSeekDelta(-10);
      } else if (e.key === "ArrowRight" && isVidboltActive) {
        e.preventDefault();
        handleSeekDelta(10);
      } else if (e.key.toLowerCase() === "m" && isVidboltActive) {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setIsTheater((prev) => !prev);
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        setIsLightsOff((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleHotkeys);
    return () => window.removeEventListener("keydown", handleHotkeys);
  }, [isVidboltActive, isPlaying, isMuted, volume, currentTime, duration]);

  // Compute embed URL for current server
  const currentEmbedUrl = useMemo(() => {
    return currentServer.getUrl(type, id, currentSeason, currentEpisode, preferredAudio);
  }, [currentServer, type, id, currentSeason, currentEpisode, preferredAudio]);

  return (
    <>
      {/* Cinema Lights Off Overlay */}
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

      {/* Main Theater Player Container */}
      <div
        className={`player-wrapper ${isTheater ? "theater-mode" : ""} ${isLightsOff ? "lights-off" : ""}`}
        ref={playerRef}
      >
        {/* Ambient Backlight Glow behind player */}
        {backdrop && (
          <div
            className="player-ambient-glow"
            style={{ backgroundImage: `url(${backdrop})` }}
            aria-hidden="true"
          />
        )}

        {/* Top Player Header Controls */}
        <div className="player-topbar">
          <div className="player-badge">
            <span className="live-dot" />
            <b>{type === "tv" ? `Season ${currentSeason} : Episode ${currentEpisode}` : title}</b>
            <span className="res-badge">HD • Multi-Audio</span>
            {isVidboltActive && isPlayerReady && (
              <span className="vidbolt-status-chip">
                <span className="bolt-icon">⚡</span>
                <span>Vidbolt Cinema Engine</span>
              </span>
            )}
          </div>

          <div className="player-actions">
            {/* Preferred Audio Selector Dropdown */}
            {isVidboltActive && (
              <div className="audio-selector-wrapper">
                <button
                  type="button"
                  className={`audio-trigger-btn ${showAudioMenu ? "active" : ""}`}
                  onClick={() => setShowAudioMenu(!showAudioMenu)}
                  title="Choose Audio Dub Track"
                >
                  <span className="audio-icon">🎧</span>
                  <span className="audio-curr-label">
                    {AUDIO_TRACKS.find((a) => a.code === preferredAudio)?.label || "Multi-Audio"}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {showAudioMenu && (
                  <div className="audio-dropdown-menu">
                    <div className="audio-menu-header">Select Preferred Audio:</div>
                    {AUDIO_TRACKS.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        className={`audio-option-item ${preferredAudio === lang.code ? "selected" : ""}`}
                        onClick={() => handleSelectAudio(lang.code)}
                      >
                        <span className="lang-flag">{lang.flag}</span>
                        <span className="lang-name">{lang.label}</span>
                        {preferredAudio === lang.code && <span className="check-dot">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Server switcher */}
            <div className="server-selector-group">
              {SERVERS.map((srv, i) => (
                <button
                  key={srv.name}
                  type="button"
                  className={`server-chip ${serverIndex === i ? "active" : ""}`}
                  onClick={() => setServerIndex(i)}
                  title={srv.name}
                >
                  {serverIndex === i && <span className="live-dot" style={{ width: 6, height: 6, marginRight: 4 }} />}
                  {srv.shortName || srv.name}
                </button>
              ))}
            </div>

            {/* Toggle Lights Button */}
            <button
              type="button"
              className={`tool-btn ${isLightsOff ? "active" : ""}`}
              onClick={() => setIsLightsOff(!isLightsOff)}
              title="Toggle Cinema Lights (L)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              <span className="hide-xs">{isLightsOff ? "Lights On" : "Lights Off"}</span>
            </button>

            {/* Toggle Theater Mode */}
            <button
              type="button"
              className={`tool-btn ${isTheater ? "active" : ""}`}
              onClick={() => setIsTheater(!isTheater)}
              title="Toggle Theater Mode (T)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="15" x="2" y="4" rx="2"/><path d="m9 10 3 2 3-2"/></svg>
              <span className="hide-xs">{isTheater ? "Normal" : "Theater"}</span>
            </button>
          </div>
        </div>

        {/* Main Video Cinema Screen */}
        <div className="player-screen-container">
          {stream ? (
            <CinemaPlayer
              key={`${type}-${id}-${currentSeason}-${currentEpisode}`}
              src={stream.src}
              title={title}
              poster={backdrop || poster}
              mimeType={stream.mimeType}
              subtitles={stream.subtitles}
            />
          ) : (
            <iframe
              id="vidbolt-player"
              ref={iframeRef}
              key={`${type}-${id}-${currentSeason}-${currentEpisode}-srv${serverIndex}-${preferredAudio}`}
              src={currentEmbedUrl}
              className="streaming-iframe"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              loading="eager"
              referrerPolicy="no-referrer"
              title={`${title}${type === "tv" ? ` S${currentSeason}E${currentEpisode}` : ""}`}
            />
          )}

          {/* Auto Next Episode Countdown Overlay Toast */}
          {nextEpCountdown !== null && hasNext && (
            <div className="next-episode-overlay-banner">
              <div className="next-ep-content">
                <span className="next-ep-pulse-icon">▶</span>
                <div className="next-ep-text">
                  <b>Up Next: Episode {currentEpisode + 1}</b>
                  <span>Starting automatically in {nextEpCountdown}s...</span>
                </div>
              </div>
              <div className="next-ep-actions">
                <button
                  type="button"
                  className="btn-play-next"
                  onClick={() => {
                    setNextEpCountdown(null);
                    handleNextEp();
                  }}
                >
                  Play Now
                </button>
                <button
                  type="button"
                  className="btn-cancel-next"
                  onClick={() => setNextEpCountdown(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vidbolt Remote Control Bar (Interactive Host Console) */}
        {isVidboltActive && !stream && (
          <div className="vidbolt-remote-dock">
            <div className="remote-controls-left">
              <button
                type="button"
                className="remote-action-btn play-pause-btn"
                onClick={handleTogglePlay}
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                type="button"
                className="remote-action-btn"
                onClick={() => handleSeekDelta(-10)}
                title="Rewind 10 seconds (←)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
                <span>-10s</span>
              </button>

              <button
                type="button"
                className="remote-action-btn"
                onClick={() => handleSeekDelta(10)}
                title="Forward 10 seconds (→)"
              >
                <span>+10s</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
              </button>

              {/* Time display */}
              {(currentTime > 0 || duration > 0) && (
                <div className="remote-time-badge">
                  <span className="curr-time">{formatTime(currentTime)}</span>
                  {duration > 0 && <span className="dur-time"> / {formatTime(duration)}</span>}
                </div>
              )}
            </div>

            <div className="remote-controls-right">
              {/* Volume / Mute Button */}
              <button
                type="button"
                className="remote-action-btn"
                onClick={handleToggleMute}
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
                <span className="hide-xs">{isMuted ? "Muted" : "Audio"}</span>
              </button>

              {/* Multi-audio badge */}
              <div className="remote-pill-tag">
                <span>🔊 Multi-Audio & Subtitles Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Fallback server selector nudge */}
        {!stream && (
          <div className="server-nudge">
            <span>Server:</span>
            {SERVERS.map((srv, i) => (
              <button
                key={srv.name}
                type="button"
                className={`server-chip ${serverIndex === i ? "active" : ""}`}
                onClick={() => setServerIndex(i)}
              >
                {srv.shortName || srv.name}
              </button>
            ))}
          </div>
        )}

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

      {/* Vidbolt Mobile Bottom Sheet (Step 05 from docs) */}
      {bottomSheet.isOpen && (
        <div className="vidbolt-sheet-backdrop" onClick={() => setBottomSheet((p) => ({ ...p, isOpen: false }))}>
          <div className="vidbolt-sheet-container" onClick={(e) => e.stopPropagation()}>
            <div className="vidbolt-sheet-handle" />

            <div className="vidbolt-sheet-header">
              <h3 className="sheet-title">Player Settings</h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setBottomSheet((p) => ({ ...p, isOpen: false }))}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Sheet Tabs */}
            {bottomSheet.tabNames.length > 1 && (
              <div className="vidbolt-sheet-tabs">
                {bottomSheet.tabNames.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`sheet-tab-chip ${bottomSheet.activeTab === tab ? "active" : ""}`}
                    onClick={() => setBottomSheet((p) => ({ ...p, activeTab: tab }))}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* Sheet Options List */}
            <div className="vidbolt-sheet-options">
              {(bottomSheet.tabs[bottomSheet.activeTab] || []).map((row, idx) => (
                <button
                  key={`${row.option}-${row.value}-${idx}`}
                  type="button"
                  className={`sheet-option-row ${row.selected ? "selected" : ""}`}
                  onClick={() => handleBottomSheetOptionClick(row)}
                >
                  <span className="row-label">{row.label || row.value}</span>
                  {row.selected && <span className="row-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
