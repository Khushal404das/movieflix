"use client";

import { getSessionState, redirectToVerification } from "@/lib/SessionManager";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

// Single flagship player: VidBolt Pro with Multi-Audio, Subs & Integrated Servers
const VIDBOLT_PLAYER = {
  name: "VidBolt",
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
};

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
  const isAppCinema = Boolean(
    searchParams.get("cinema") === "1" || searchParams.get("player") === "1" || searchParams.get("app") === "1"
  );
  const [isLightsOff, setIsLightsOff] = useState(() => isAppCinema);
  const [episodesList, setEpisodesList] = useState(episodesData);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

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

  // Ads state (default false: Ads OFF)
  const [adsEnabled, setAdsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rh-ads-enabled");
      return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && typeof e.detail.enabled === "boolean") {
        setAdsEnabled(e.detail.enabled);
      }
    };
    window.addEventListener("rh-ads-toggle", handleSync);
    return () => window.removeEventListener("rh-ads-toggle", handleSync);
  }, []);

  const handleToggleAds = () => {
    setAdsEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("rh-ads-enabled", String(next));
        window.dispatchEvent(new CustomEvent("rh-ads-toggle", { detail: { enabled: next } }));
      }
      return next;
    });
  };

  // Mobile Bottom Sheet state (triggered by Vidbolt 'mobile-panel' event)
  const [bottomSheet, setBottomSheet] = useState({
    isOpen: false,
    tabs: {},
    tabNames: [],
    activeTab: ""
  });

  // Send Remote Control postMessage to Vidbolt iframe
  const sendVidboltCommand = useCallback((cmdType, params = {}) => {
    const iframe = iframeRef.current || document.getElementById("vidbolt-player");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: cmdType, ...params }, "https://vidbolt.pro");
    }
  }, []);

  // Close audio dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showAudioMenu && !e.target.closest(".audio-selector-wrapper")) {
        setShowAudioMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showAudioMenu]);

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

  // Reset playback telemetry when title/season/episode changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsPlayerReady(false);
    setNextEpCountdown(null);
  }, [id, currentSeason, currentEpisode]);

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
        case "ready": {
          setIsPlayerReady(true);
          // Auto-disable ads on player ready
          const iframe = document.getElementById("vidbolt-player");
          if (iframe?.contentWindow) {
            setTimeout(() => {
              iframe.contentWindow.postMessage({ type: "disable-ads" }, "https://vidbolt.pro");
              iframe.contentWindow.postMessage({ type: "set-ads", enabled: false }, "https://vidbolt.pro");
              iframe.contentWindow.postMessage({ type: "ads", value: false }, "https://vidbolt.pro");
            }, 500);
          }
          break;
        }
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

  // Anti-ad redirect and popup shield: block rogue popups & top-level redirects
  useEffect(() => {
    if (typeof window === "undefined") return;

    let allowNavigation = false;

    // Prevent top-level redirect hijack from iframe ad networks when ads are OFF
    const handleBeforeUnload = (e) => {
      if (!adsEnabled && !allowNavigation) {
        e.preventDefault();
        e.returnValue = "MovieFlix protected you from an ad redirect.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Allow legitimate clicks on MovieFlix links
    const handleInternalClick = (e) => {
      const link = e.target.closest("a, button");
      if (link) {
        allowNavigation = true;
        setTimeout(() => {
          allowNavigation = false;
        }, 1500);
      }
    };
    document.addEventListener("click", handleInternalClick, true);

    const originalOpen = window.open;
    window.open = function (...args) {
      if (!adsEnabled) {
        console.warn("[MovieFlix] Blocked rogue ad popup window:", args[0]);
        return null;
      }
      return originalOpen.apply(window, args);
    };

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleInternalClick, true);
      window.open = originalOpen;
    };
  }, [adsEnabled]);

  // Cinema Lights Off handler
  useEffect(() => {
    if (isAppCinema) {
      document.body.classList.add("app-cinema-mode");
      document.body.classList.add("lights-off-active");
      return () => {
        document.body.classList.remove("app-cinema-mode");
        document.body.classList.remove("lights-off-active");
      };
    }

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
      document.addEventListener("touchstart", handleDocumentClick, { passive: true });

      return () => {
        document.body.classList.remove("lights-off-active");
        window.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleDocumentClick);
        document.removeEventListener("touchstart", handleDocumentClick);
      };
    } else {
      document.body.classList.remove("lights-off-active");
    }
  }, [isLightsOff, isAppCinema]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("lights-off-active");
    };
  }, []);

  // Global player keyboard hotkeys
  useEffect(() => {
    const handleHotkeys = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName)) return;
      if (e.key === " ") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSeekDelta(-10);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSeekDelta(10);
      } else if (e.key.toLowerCase() === "m") {
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
  }, [isPlaying, isMuted, volume, currentTime, duration]);

  // Compute embed URL for VidBolt
  const currentEmbedUrl = useMemo(() => {
    return VIDBOLT_PLAYER.getUrl(type, id, currentSeason, currentEpisode, preferredAudio);
  }, [type, id, currentSeason, currentEpisode, preferredAudio]);

  return (
    <>
      {/* Cinema Lights Off Overlay */}
      {isLightsOff && !isAppCinema && (
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
            <span className="res-badge">HD</span>
          </div>

          {/* Clean VidBolt Player Badge */}
          <div className="flex min-w-0 items-center">
            <div className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span>VidBolt Player</span>
            </div>
          </div>

          <div className="player-actions">
            {/* Preferred Audio Selector Dropdown */}
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

            {/* Direct Remote Controls */}
            <button
              type="button"
              className="tool-btn"
              onClick={handleTogglePlay}
              title={isPlaying ? "Pause Video" : "Play Video"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
              <span className="hide-xs">{isPlaying ? "Pause" : "Play"}</span>
            </button>

            <button
              type="button"
              className="tool-btn"
              onClick={handleToggleMute}
              title={isMuted ? "Unmute Volume" : "Mute Volume"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3 2.5-2.5-1-1L15.5 11l-2.5-2.5-1 1 2.5 2.5-2.5 2.5 1 1 2.5-2.5 2.5 2.5 1-1L16.5 12z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>
              )}
              <span className="hide-xs">{isMuted ? "Unmute" : "Mute"}</span>
            </button>

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

            {/* Ads Off/On Switch on player page */}
            <button
              type="button"
              role="switch"
              aria-checked={adsEnabled}
              aria-label={adsEnabled ? "Ads on" : "Ads off"}
              className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 md:h-9 transition-colors hover:bg-white/[0.08]"
              onClick={handleToggleAds}
              title={adsEnabled ? "Ads on" : "Ads off"}
            >
              <span className="text-[13px] font-medium leading-none text-white">Ads</span>
              <span
                className={`relative h-[22px] w-[44px] shrink-0 overflow-hidden rounded-full transition-colors ${
                  adsEnabled ? "bg-[#f3f0e8]" : "bg-zinc-600"
                }`}
              >
                <span
                  className={`absolute top-[3px] z-[2] h-4 w-4 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-[left] duration-200 ${
                    adsEnabled ? "left-[25px] bg-[#2c2c2c]" : "left-[3px] bg-white"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Main Video Cinema Screen */}
        <div className="player-screen-container">
          <iframe
            id="vidbolt-player"
            ref={iframeRef}
            key={`${type}-${id}-${currentSeason}-${currentEpisode}-${preferredAudio}`}
            src={currentEmbedUrl}
            className="streaming-iframe"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            loading="eager"
            referrerPolicy="no-referrer"
            title={`${title}${type === "tv" ? ` S${currentSeason}E${currentEpisode}` : ""}`}
            sandbox={adsEnabled ? undefined : "allow-scripts allow-same-origin allow-forms allow-presentation"}
          />

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
        {type === "tv" && seasons.length > 0 && (
          <div className="episodes-drawer-container">
            <div className="drawer-header">
              <div className="season-selector-inline">
                <span className="drawer-label">Season:</span>
                <select
                  value={currentSeason}
                  onChange={handleSeasonChange}
                  className="season-dropdown"
                  aria-label="Select Season"
                >
                  {seasons.map((s) => (
                    <option key={s.season_number} value={s.season_number}>
                      Season {s.season_number} {s.name && s.name !== `Season ${s.season_number}` ? `(${s.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <span className="ep-count-badge">
                {episodesList.length} Episode{episodesList.length !== 1 ? "s" : ""}
              </span>
            </div>

            {isLoadingEpisodes ? (
              <div className="episodes-loading-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="ep-skeleton-card" />
                ))}
              </div>
            ) : (
              <div className="episodes-horizontal-strip">
                {episodesList.map((ep) => {
                  const isCurrent = ep.episode_number === currentEpisode;
                  return (
                    <div
                      key={ep.id || ep.episode_number}
                      className={`ep-strip-card ${isCurrent ? "current-ep" : ""}`}
                      onClick={() => handleEpisodeSelect(ep.episode_number)}
                    >
                      <div className="ep-still-thumb">
                        {ep.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                            alt={ep.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="ep-thumb-fallback">
                            <span>S{currentSeason} : E{ep.episode_number}</span>
                          </div>
                        )}
                        {isCurrent && <div className="playing-indicator">▶ PLAYING</div>}
                        <span className="ep-num-pill">EP {ep.episode_number}</span>
                      </div>
                      <div className="ep-details">
                        <h4 className="ep-title" title={ep.name}>
                          {ep.name || `Episode ${ep.episode_number}`}
                        </h4>
                        <p className="ep-overview">
                          {ep.overview || "No synopsis available."}
                        </p>
                      </div>
                    </div>
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
              <h3 className="sheet-title">Playback Settings</h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setBottomSheet((p) => ({ ...p, isOpen: false }))}
                aria-label="Close settings"
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
                    className={`sheet-tab-btn ${bottomSheet.activeTab === tab ? "active" : ""}`}
                    onClick={() => setBottomSheet((p) => ({ ...p, activeTab: tab }))}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* Sheet Option Rows */}
            <div className="vidbolt-sheet-options">
              {(bottomSheet.tabs[bottomSheet.activeTab] || []).map((row, idx) => (
                <button
                  key={`${row.option}-${row.value}-${idx}`}
                  type="button"
                  className={`sheet-option-row ${row.selected ? "selected" : ""}`}
                  onClick={() => {
                    handleBottomSheetOptionClick(row);
                    setBottomSheet((p) => ({ ...p, isOpen: false }));
                  }}
                >
                  <span className="row-label">{row.label}</span>
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
