"use client";

import { getSessionState, redirectToVerification } from "@/lib/SessionManager";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// In-memory client cache for episodes across seasons
const episodeMemoryCache = new Map();

// Supported audio track preferences for Direct (VidBolt) mode
const AUDIO_TRACKS = [
  { code: "hindi", label: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "tamil", label: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "telugu", label: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" }
];

// Direct Mode Player: VidBolt Pro (Served via Ad-Stripping Reverse-Proxy with multi-audio & subtitles)
const DIRECT_SERVER = {
  id: "vidbolt",
  name: "Bolt",
  domain: "/api/player/vidbolt",
  getUrl: (type, id, s, e, audio = "hindi") => {
    const params = new URLSearchParams({
      type,
      id: String(id),
      theme: "E50914",
      autoPlay: "true",
      mobileSheets: "true",
    });
    if (s) params.set("s", String(s));
    if (e) params.set("e", String(e));
    if (audio && audio !== "auto") params.set("audio", audio);
    return `/api/player/vidbolt?${params.toString()}`;
  },
};
// Embed Mode Players: All 11 Multi-Servers from Nippleflix
const EMBED_SERVERS = [
  {
    id: "vidcore",
    name: "Orion",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://vidcore.net/tv/${id}/${s}/${e}?theme=E50914`
        : `https://vidcore.net/movie/${id}?theme=E50914`,
  },
  {
    id: "vidrift",
    name: "VidRift",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://embed.vidrift.in/tv/${id}/${s}/${e}`
        : `https://embed.vidrift.in/movie/${id}`,
  },
  {
    id: "screenscape",
    name: "Hindi",
    getUrl: (type, id, s, e) => {
      const q = new URLSearchParams({ tmdb: String(id), type: type === "tv" ? "tv" : "movie", lan: "hindi" });
      if (type === "tv") { q.set("s", s); q.set("e", e); }
      return `https://nxsha.screenscape.me/embed?${q.toString()}`;
    },
  },
  {
    id: "cinezo",
    name: "Cinezo",
    getUrl: (type, id, s, e) => {
      const q = new URLSearchParams({ autoplay: "true", poster: "true", primarycolor: "E50914", secondarycolor: "0a0a12", iconcolor: "ffffff" }).toString();
      return type === "tv" ? `https://player.cinezo.live/embed/tv/${id}/${s}/${e}?${q}` : `https://player.cinezo.live/embed/movie/${id}?${q}`;
    },
  },
  {
    id: "hindi-new",
    name: "Hindi New",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://embed.reelsdownload.online/player/${id}/${s}/${e}?key=k_885c7f4e1997d1d9c4e42aff`
        : `https://embed.reelsdownload.online/player/${id}?key=k_885c7f4e1997d1d9c4e42aff`,
  },
  {
    id: "flix",
    name: "Flix",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://www.viduki.net/4/tv/${id}/${s}/${e}?color=E50914`
        : `https://www.viduki.net/4/movie/${id}?color=E50914`,
  },
  {
    id: "filmu",
    name: "Fast",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://embed.filmu.in/tv/${id}/${s}/${e}?color=e50914`
        : `https://embed.filmu.in/movie/${id}?color=e50914`,
  },
  {
    id: "nflix",
    name: "Nflix",
    getUrl: (type, id, s, e) => {
      const q = new URLSearchParams({ color: "e50914", brand: "MovieFlix" }).toString();
      return type === "tv" ? `https://nflixmovies.app/embed/tv/${id}/${s}/${e}?${q}` : `https://nflixmovies.app/embed/movie/${id}?${q}`;
    },
  },
  {
    id: "vidup",
    name: "Premium",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://vidup.to/tv/${id}/${s}/${e}?theme=E50914`
        : `https://vidup.to/movie/${id}?theme=E50914`,
  },
  {
    id: "videasy",
    name: "Mega",
    getUrl: (type, id, s, e) => {
      const q = new URLSearchParams({ color: "E50914" });
      if (type === "tv") { q.set("nextEpisode", "true"); q.set("autoplayNextEpisode", "true"); }
      return type === "tv" ? `https://player.videasy.to/tv/${id}/${s}/${e}?${q.toString()}` : `https://player.videasy.to/movie/${id}?${q.toString()}`;
    },
  },
  {
    id: "vidfast",
    name: "Alpha",
    getUrl: (type, id, s, e) => {
      const q = "autoNext=true&nextButton=false&title=true&poster=true&autoPlay=true";
      return type === "tv" ? `https://vidfast.vc/tv/${id}/${s}/${e}?${q}` : `https://vidfast.vc/movie/${id}?${q}`;
    },
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
  const playbackModeRef = useRef(null);
  const serverMenuRef = useRef(null);
  const audioMenuRef = useRef(null);

  const [currentSeason, setCurrentSeason] = useState(Number(searchParams.get("season")) || initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(Number(searchParams.get("episode")) || initialEpisode);
  const [isTheater, setIsTheater] = useState(false);
  const isAppCinema = Boolean(
    searchParams.get("cinema") === "1" || searchParams.get("player") === "1" || searchParams.get("app") === "1"
  );
  const [isLightsOff, setIsLightsOff] = useState(() => isAppCinema);
  const [episodesList, setEpisodesList] = useState(episodesData);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  // Playback Mode: "direct" | "embed"
  const [playbackMode, setPlaybackMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rh-playback-mode") || "direct";
    }
    return "direct";
  });
  const [playbackModeOpen, setPlaybackModeOpen] = useState(false);

  // Selected server for Embed mode (default "vidcore" Orion)
  const [selectedServer, setSelectedServer] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rh-selected-server") || "vidcore";
    }
    return "vidcore";
  });
  const [serverMenuOpen, setServerMenuOpen] = useState(false);

  // Preferred audio track
  const [preferredAudio, setPreferredAudio] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rh-preferred-audio") || "hindi";
    }
    return "hindi";
  });
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  // Player live telemetry & remote control state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

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
        sessionStorage.setItem("nippleflix_ads_disabled", String(!next));
        sessionStorage.setItem("movieflix_ads_disabled", String(!next));
        window.dispatchEvent(new CustomEvent("rh-ads-toggle", { detail: { enabled: next } }));
      }
      return next;
    });
  };

  // Switch playback mode helper
  const handlePlaybackModeSelect = (mode) => {
    setPlaybackMode(mode);
    setPlaybackModeOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("rh-playback-mode", mode);
    }
  };

  // Switch server helper
  const handleServerSelect = (srvId) => {
    setSelectedServer(srvId);
    setServerMenuOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("rh-selected-server", srvId);
    }
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (playbackModeRef.current && !playbackModeRef.current.contains(e.target)) {
        setPlaybackModeOpen(false);
      }
      if (serverMenuRef.current && !serverMenuRef.current.contains(e.target)) {
        setServerMenuOpen(false);
      }
      if (audioMenuRef.current && !audioMenuRef.current.contains(e.target)) {
        setShowAudioMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
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

  // Reset playback telemetry when title/season/episode or mode/server changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsPlayerReady(false);
    setNextEpCountdown(null);
  }, [id, currentSeason, currentEpisode, playbackMode, selectedServer]);

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
      if (e.key === " " && playbackMode === "direct") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "ArrowLeft" && playbackMode === "direct") {
        e.preventDefault();
        handleSeekDelta(-10);
      } else if (e.key === "ArrowRight" && playbackMode === "direct") {
        e.preventDefault();
        handleSeekDelta(10);
      } else if (e.key.toLowerCase() === "m" && playbackMode === "direct") {
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
  }, [playbackMode, isPlaying, isMuted, volume, currentTime, duration]);

  // Compute embed URL for currently active mode and server
  const currentEmbedUrl = useMemo(() => {
    if (playbackMode === "direct") {
      return DIRECT_SERVER.getUrl(type, id, currentSeason, currentEpisode, preferredAudio);
    }
    const srv = EMBED_SERVERS.find((s) => s.id === selectedServer) || EMBED_SERVERS[0];
    return srv.getUrl(type, id, currentSeason, currentEpisode);
  }, [playbackMode, selectedServer, type, id, currentSeason, currentEpisode, preferredAudio]);

  const activeServerName = EMBED_SERVERS.find((s) => s.id === selectedServer)?.name || "Orion";

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

          {/* Exact Playback Mode & Server Selection Container (matches Nippleflix) */}
          <div className="flex min-w-0 justify-start sm:justify-center">
            <div className="pointer-events-auto flex min-w-0 items-center">
              <div className="flex shrink-0 items-center gap-2 sm:min-w-0 sm:flex-1 sm:justify-start">
                
                {/* 1. Playback Mode Trigger & Dropdown */}
                <div className="relative inline-flex w-auto max-w-full shrink-0" ref={playbackModeRef}>
                  <button
                    type="button"
                    id="watch-playback-mode-trigger"
                    aria-label="Playback mode"
                    aria-haspopup="listbox"
                    aria-expanded={playbackModeOpen}
                    onClick={() => {
                      setPlaybackModeOpen(!playbackModeOpen);
                      setServerMenuOpen(false);
                      setShowAudioMenu(false);
                    }}
                    className="inline-flex h-9 max-w-full cursor-pointer items-center gap-1.5 rounded-full px-3 text-left text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:text-sm border border-white/10 bg-[#141414] text-white hover:bg-[#222]"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-white/50">
                        {playbackMode === "direct" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                            <path d="M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z"></path>
                            <path d="M12 17v4"></path>
                            <path d="M8 21h8"></path>
                            <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                            <path d="M2 12h20"></path>
                          </svg>
                        )}
                      </span>
                      <span className="max-w-[5.5rem] truncate sm:max-w-[7rem]">
                        {playbackMode === "direct" ? "Direct" : "Embed"}
                      </span>
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 shrink-0 text-white/55 transition-transform duration-200 ${playbackModeOpen ? "rotate-180" : ""}`}>
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </button>

                  {/* Playback Mode Dropdown Menu */}
                  {playbackModeOpen && (
                    <div className="absolute left-0 top-full mt-2 z-[200] min-w-[210px] overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2.5 pb-1.5 pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">PLAYBACK MODE</p>
                      </div>
                      <button
                        type="button"
                        role="option"
                        aria-selected={playbackMode === "direct"}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${playbackMode === "direct" ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
                        onClick={() => handlePlaybackModeSelect("direct")}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${playbackMode === "direct" ? "bg-white text-black" : "bg-white/[0.06] text-white/70"}`}>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="truncate text-sm font-semibold text-white">Direct</span>
                        </span>
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${playbackMode === "direct" ? "border-white" : "border-white/25"}`}>
                          {playbackMode === "direct" && <span className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                      </button>

                      <button
                        type="button"
                        role="option"
                        aria-selected={playbackMode === "embed"}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${playbackMode === "embed" ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
                        onClick={() => handlePlaybackModeSelect("embed")}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${playbackMode === "embed" ? "bg-white text-black" : "bg-white/[0.06] text-white/70"}`}>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                            <path d="M2 12h20"></path>
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="truncate text-sm font-semibold text-white">Embed</span>
                        </span>
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${playbackMode === "embed" ? "border-white" : "border-white/25"}`}>
                          {playbackMode === "embed" && <span className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Mode -> Bolt Badge Indicator */}
                {playbackMode === "direct" && (
                  <span className="inline-flex h-9 shrink-0 items-center rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white/80">
                    Bolt
                  </span>
                )}

                {/* Embed Mode -> Change Server Trigger & Dropdown */}
                {playbackMode === "embed" && (
                  <div className="relative inline-flex w-auto max-w-full shrink-0" ref={serverMenuRef}>
                    <button
                      type="button"
                      id="watch-server-trigger"
                      aria-label="Change server"
                      aria-haspopup="listbox"
                      aria-expanded={serverMenuOpen}
                      onClick={() => {
                        setServerMenuOpen(!serverMenuOpen);
                        setPlaybackModeOpen(false);
                        setShowAudioMenu(false);
                      }}
                      className="inline-flex h-9 max-w-full cursor-pointer items-center gap-1.5 rounded-full px-3 text-left text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:text-sm border border-white/10 bg-[#141414] text-white hover:bg-[#222]"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-white/50">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                            <rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect>
                            <rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect>
                            <line x1="6" x2="6.01" y1="6" y2="6"></line>
                            <line x1="6" x2="6.01" y1="18" y2="18"></line>
                          </svg>
                        </span>
                        <span className="max-w-[5.5rem] truncate sm:max-w-[7rem]">
                          {activeServerName}
                        </span>
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 shrink-0 text-white/55 transition-transform duration-200 ${serverMenuOpen ? "rotate-180" : ""}`}>
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>

                    {/* Change Server Dropdown Menu with all 11 servers */}
                    {serverMenuOpen && (
                      <div className="absolute left-0 top-full mt-2 z-[200] max-h-[360px] min-w-[210px] overflow-y-auto rounded-2xl border border-white/10 bg-[#141414] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2.5 pb-1.5 pt-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">CHANGE SERVER</p>
                        </div>
                        {EMBED_SERVERS.map((srv) => {
                          const isSelected = selectedServer === srv.id;
                          return (
                            <button
                              key={srv.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${isSelected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
                              onClick={() => handleServerSelect(srv.id)}
                            >
                              <span className="truncate text-sm font-medium text-white/85">
                                {srv.name}
                              </span>
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-white" : "border-white/25"}`}>
                                {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

          <div className="player-actions">
            {/* Direct Mode -> Quality & Server & Audio Switchers */}
            {playbackMode === "direct" && (
              <>
                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => handlePlaybackModeSelect("embed")}
                  title="Switch to Alternate Embed Servers"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  <span className="hide-xs text-xs">Quality & Server</span>
                  <span className="text-[10px] text-white/50">Auto</span>
                </button>

                {/* Audio Dub Selector */}
                <div className="audio-selector-wrapper" ref={audioMenuRef}>
                  <button
                    type="button"
                    className={`audio-trigger-btn ${showAudioMenu ? "active" : ""}`}
                    onClick={() => {
                      setShowAudioMenu(!showAudioMenu);
                      setPlaybackModeOpen(false);
                      setServerMenuOpen(false);
                    }}
                    title="Audio & Subtitles"
                  >
                    <span className="text-xs font-bold">CC</span>
                    <span className="audio-curr-label text-xs">
                      {AUDIO_TRACKS.find((a) => a.code === preferredAudio)?.label || "Audio & Subtitles"}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </button>

                  {showAudioMenu && (
                    <div className="audio-dropdown-menu">
                      <div className="audio-menu-header">Audio & Subtitles:</div>
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
              </>
            )}

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

            {/* Hidden Ads Off/On Switch on player page */}
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
            key={`${playbackMode}-${selectedServer}-${type}-${id}-${currentSeason}-${currentEpisode}-${preferredAudio}`}
            src={currentEmbedUrl}
            className="streaming-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen *; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="eager"
            referrerPolicy="no-referrer"
            title={`${title}${type === "tv" ? ` S${currentSeason}E${currentEpisode}` : ""}`}
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
