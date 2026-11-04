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

// Direct Mode Player: VidBolt Pro (Flagship player with multi-audio & subtitles)
const DIRECT_SERVER = {
  id: "vidbolt",
  name: "Bolt",
  domain: "https://vidbolt.pro",
  getUrl: (type, id, s, e, audio = "hindi") => {
    const audioParam = audio && audio !== "auto" ? `&audio=${encodeURIComponent(audio)}` : "";
    if (type === "anime-mal") {
      return `https://vidbolt.pro/anime/mal/${id}/${e}?theme=E50914&autoPlay=true&mobileSheets=true${audioParam}`;
    }
    if (type === "anime" || type === "anilist") {
      return `https://vidbolt.pro/anime/${id}/${e}?theme=E50914&autoPlay=true&mobileSheets=true${audioParam}`;
    }
    if (type === "tv") {
      return `https://vidbolt.pro/tv/${id}/${s}/${e}?theme=E50914&autoPlay=true&mobileSheets=true${audioParam}`;
    }
    return `https://vidbolt.pro/movie/${id}?theme=E50914&autoPlay=true&mobileSheets=true${audioParam}`;
  }
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

  // Ads state (synced with Nippleflix ad-blocking keys, default: true -> Ads OFF)
  const [adsOff, setAdsOff] = useState(true);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("nippleflix_ads_disabled");
      const m = sessionStorage.getItem("movieflix_ads_disabled");
      const ls = localStorage.getItem("nippleflix_ads_disabled");
      const lm = localStorage.getItem("movieflix_ads_disabled");

      const isBlocked = (s === null && m === null && ls === null && lm === null)
        ? true
        : (s === "true" || m === "true" || ls === "true" || lm === "true");

      setAdsOff(isBlocked);
      window.__ADS_DISABLED__ = isBlocked;
    } catch (e) {}

    const handleSync = (e) => {
      if (e.detail && typeof e.detail.adsOff === "boolean") {
        setAdsOff(e.detail.adsOff);
      } else if (e.detail && typeof e.detail.enabled === "boolean") {
        setAdsOff(!e.detail.enabled);
      }
    };
    window.addEventListener("rh-ads-toggle", handleSync);
    return () => window.removeEventListener("rh-ads-toggle", handleSync);
  }, []);

  const handleToggleAds = () => {
    setAdsOff((prev) => {
      const nextAdsOff = !prev;
      if (typeof window !== "undefined") {
        const valStr = String(nextAdsOff);
        sessionStorage.setItem("nippleflix_ads_disabled", valStr);
        sessionStorage.setItem("movieflix_ads_disabled", valStr);
        localStorage.setItem("nippleflix_ads_disabled", valStr);
        localStorage.setItem("movieflix_ads_disabled", valStr);
        localStorage.setItem("rh-ads-enabled", String(!nextAdsOff));
        window.__ADS_DISABLED__ = nextAdsOff;
        window.dispatchEvent(new CustomEvent("rh-ads-toggle", { detail: { adsOff: nextAdsOff, enabled: !nextAdsOff } }));
      }
      return nextAdsOff;
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
          if (adsOff) {
            const iframe = document.getElementById("vidbolt-player");
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage({ type: "disable-ads" }, "https://vidbolt.pro");
              iframe.contentWindow.postMessage({ type: "set-ads", enabled: false }, "https://vidbolt.pro");
              iframe.contentWindow.postMessage({ type: "ads", value: false }, "https://vidbolt.pro");
            }
          }
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

  // AdGuard Player Focus & Anti-Popunder Shield (Blocks stealth popunders on player clicks)
  useEffect(() => {
    if (typeof window === "undefined" || !adsOff) return;

    let lastPlayerClick = 0;
    const container = playerRef.current;

    const onPlayerClick = () => {
      lastPlayerClick = Date.now();
    };

    if (container) {
      container.addEventListener("pointerdown", onPlayerClick, true);
      container.addEventListener("click", onPlayerClick, true);
    }

    const handleWindowBlur = () => {
      // If window blurs right after a click on or near the player, a stealth popunder was triggered
      if (Date.now() - lastPlayerClick < 1500) {
        window.focus();
        setTimeout(() => window.focus(), 80);
      }
    };

    window.addEventListener("blur", handleWindowBlur);

    return () => {
      if (container) {
        container.removeEventListener("pointerdown", onPlayerClick, true);
        container.removeEventListener("click", onPlayerClick, true);
      }
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [adsOff]);

  // Anti-ad popup shield: silently block rogue ad popups while preserving legitimate Auth popups
  useEffect(() => {
    if (typeof window === "undefined") return;

    function isSafeUrl(url) {
      if (!url || url === "" || url === "about:blank") return true;
      const str = String(url).toLowerCase();
      const safe = ["accounts.google.com", "firebaseapp.com", "apis.google.com", "google.com", "movieflix", "localhost"];
      return safe.some(d => str.includes(d));
    }

    const originalOpen = window.open;
    window.open = function (...args) {
      const url = args[0];
      if (isSafeUrl(url)) {
        return originalOpen ? originalOpen.apply(window, args) : null;
      }
      if (adsOff) {
        console.warn("[Player AdShield] Silently blocked ad popup:", url);
        return null;
      }
      return originalOpen ? originalOpen.apply(window, args) : null;
    };

    return () => {
      window.open = originalOpen;
    };
  }, [adsOff]);

  // Sync ad blocking command directly to Vidbolt iframe
  useEffect(() => {
    const iframe = iframeRef.current || document.getElementById("vidbolt-player");
    if (iframe?.contentWindow) {
      if (adsOff) {
        iframe.contentWindow.postMessage({ type: "disable-ads" }, "https://vidbolt.pro");
        iframe.contentWindow.postMessage({ type: "set-ads", enabled: false }, "https://vidbolt.pro");
        iframe.contentWindow.postMessage({ type: "ads", value: false }, "https://vidbolt.pro");
      } else {
        iframe.contentWindow.postMessage({ type: "enable-ads" }, "https://vidbolt.pro");
        iframe.contentWindow.postMessage({ type: "set-ads", enabled: true }, "https://vidbolt.pro");
        iframe.contentWindow.postMessage({ type: "ads", value: true }, "https://vidbolt.pro");
      }
    }
  }, [adsOff]);

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
          <div className="np-controls-group">
            {/* 1. Playback Mode Trigger & Dropdown */}
            <div className="np-dropdown-container" ref={playbackModeRef}>
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
                className={`np-pill-btn ${playbackModeOpen ? "open" : ""}`}
              >
                {playbackMode === "direct" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
                    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                )}
                <span>{playbackMode === "direct" ? "Direct" : "Embed"}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    opacity: 0.55,
                    transform: playbackModeOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease"
                  }}
                >
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>

              {/* Playback Mode Dropdown Menu */}
              {playbackModeOpen && (
                <div className="np-dropdown-menu">
                  <p className="np-dropdown-title">PLAYBACK MODE</p>
                  
                  {/* Direct Option */}
                  <button
                    type="button"
                    role="option"
                    aria-selected={playbackMode === "direct"}
                    className={`np-dropdown-option ${playbackMode === "direct" ? "selected" : ""}`}
                    onClick={() => handlePlaybackModeSelect("direct")}
                  >
                    <div className="np-dropdown-option-left">
                      <div className={`np-icon-box ${playbackMode === "direct" ? "active" : ""}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
                        </svg>
                      </div>
                      <span className="np-option-name">Direct</span>
                    </div>
                    <div className={`np-radio-outer ${playbackMode === "direct" ? "checked" : ""}`}>
                      {playbackMode === "direct" && <div className="np-radio-inner" />}
                    </div>
                  </button>

                  {/* Embed Option */}
                  <button
                    type="button"
                    role="option"
                    aria-selected={playbackMode === "embed"}
                    className={`np-dropdown-option ${playbackMode === "embed" ? "selected" : ""}`}
                    onClick={() => handlePlaybackModeSelect("embed")}
                  >
                    <div className="np-dropdown-option-left">
                      <div className={`np-icon-box ${playbackMode === "embed" ? "active" : ""}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                          <path d="M2 12h20"></path>
                        </svg>
                      </div>
                      <span className="np-option-name">Embed</span>
                    </div>
                    <div className={`np-radio-outer ${playbackMode === "embed" ? "checked" : ""}`}>
                      {playbackMode === "embed" && <div className="np-radio-inner" />}
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Mode -> Bolt Badge Indicator */}
            {playbackMode === "direct" && (
              <span className="np-pill-badge">
                Bolt
              </span>
            )}

            {/* Embed Mode -> Change Server Trigger & Dropdown */}
            {playbackMode === "embed" && (
              <div className="np-dropdown-container" ref={serverMenuRef}>
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
                  className={`np-pill-btn ${serverMenuOpen ? "open" : ""}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    <rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect>
                    <rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect>
                    <line x1="6" x2="6.01" y1="6" y2="6"></line>
                    <line x1="6" x2="6.01" y1="18" y2="18"></line>
                  </svg>
                  <span className="np-pill-text">
                    {activeServerName}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      opacity: 0.55,
                      transform: serverMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>

                {/* Change Server Dropdown Menu with all 11 servers */}
                {serverMenuOpen && (
                  <div className="np-dropdown-menu servers-list">
                    <p className="np-dropdown-title">CHANGE SERVER</p>
                    {EMBED_SERVERS.map((srv) => {
                      const isSelected = selectedServer === srv.id;
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`np-dropdown-option ${isSelected ? "selected" : ""}`}
                          onClick={() => handleServerSelect(srv.id)}
                        >
                          <span className="np-option-name">{srv.name}</span>
                          <div className={`np-radio-outer ${isSelected ? "checked" : ""}`}>
                            {isSelected && <div className="np-radio-inner" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="player-actions">
            
            {/* Quality, Audio, Play, Mute controls hidden - VidBolt handles playback internally */}
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

            {/* Ads toggle hidden */}
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
            {...(adsOff ? { sandbox: "allow-scripts allow-same-origin allow-presentation allow-forms" } : {})}
            title={`${title}${type === "tv" ? ` S${currentSeason}E${currentEpisode}` : ""}`}
            onLoad={() => {
              if (adsOff) {
                const iframe = iframeRef.current || document.getElementById("vidbolt-player");
                if (iframe?.contentWindow) {
                  iframe.contentWindow.postMessage({ type: "disable-ads" }, "https://vidbolt.pro");
                  iframe.contentWindow.postMessage({ type: "set-ads", enabled: false }, "https://vidbolt.pro");
                  iframe.contentWindow.postMessage({ type: "ads", value: false }, "https://vidbolt.pro");
                }
              }
            }}
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
