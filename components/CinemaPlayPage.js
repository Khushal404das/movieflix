"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Server Definitions (mirrors StreamingPlayer.js) ───────────────────────
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
  },
};

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

// ─── CinemaPlayPage Component ───────────────────────────────────────────────
export default function CinemaPlayPage({ id, type, season, episode, title, poster, backdrop }) {
  const router = useRouter();
  const iframeRef = useRef(null);
  const serverMenuRef = useRef(null);
  const modeMenuRef = useRef(null);

  const currentSeason = Number(season) || 1;
  const currentEpisode = Number(episode) || 1;

  // Playback mode: direct | embed
  const [playbackMode, setPlaybackMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rh-playback-mode") || "direct";
    }
    return "direct";
  });

  // Selected embed server
  const [selectedServer, setSelectedServer] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rh-selected-server") || "vidcore";
    }
    return "vidcore";
  });

  // Preferred audio (direct mode)
  const [preferredAudio] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rh-preferred-audio") || "hindi";
    }
    return "hindi";
  });

  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [serverMenuOpen, setServerMenuOpen] = useState(false);

  // Hide topbar after a few seconds of inactivity
  const [topbarVisible, setTopbarVisible] = useState(true);
  const hideTimerRef = useRef(null);

  const resetHideTimer = useCallback(() => {
    setTopbarVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setTopbarVisible(false), 3500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    const onMouseMove = () => resetHideTimer();
    const onTouch = () => resetHideTimer();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouch);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target)) setModeMenuOpen(false);
      if (serverMenuRef.current && !serverMenuRef.current.contains(e.target)) setServerMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleSelectMode = (mode) => {
    setPlaybackMode(mode);
    setModeMenuOpen(false);
    if (typeof window !== "undefined") localStorage.setItem("rh-playback-mode", mode);
  };

  const handleSelectServer = (srvId) => {
    setSelectedServer(srvId);
    setServerMenuOpen(false);
    if (typeof window !== "undefined") localStorage.setItem("rh-selected-server", srvId);
  };

  const currentEmbedUrl = useMemo(() => {
    if (!id) return "";
    if (playbackMode === "direct") {
      return DIRECT_SERVER.getUrl(type, id, currentSeason, currentEpisode, preferredAudio);
    }
    const srv = EMBED_SERVERS.find((s) => s.id === selectedServer) || EMBED_SERVERS[0];
    return srv.getUrl(type, id, currentSeason, currentEpisode);
  }, [playbackMode, selectedServer, type, id, currentSeason, currentEpisode, preferredAudio]);

  const activeServerName =
    playbackMode === "direct"
      ? "Bolt"
      : EMBED_SERVERS.find((s) => s.id === selectedServer)?.name || "Orion";

  return (
    <div className="cinema-play-root" onMouseMove={resetHideTimer} onTouchStart={resetHideTimer}>
      {/* Ambient backdrop blur background */}
      {backdrop && (
        <div
          className="cinema-ambient-bg"
          style={{ backgroundImage: `url(${backdrop})` }}
          aria-hidden="true"
        />
      )}

      {/* Top Control Bar */}
      <div className={`cinema-topbar${topbarVisible ? " visible" : ""}`}>
        {/* Left: Back button */}
        <div className="cinema-topbar-left">
          <button
            type="button"
            className="cinema-back-btn"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Center: Title */}
        <div className="cinema-topbar-center">
          {title && (
            <span className="cinema-title-text">
              {decodeURIComponent(title)}
              {type === "tv" && ` · S${currentSeason}E${currentEpisode}`}
            </span>
          )}
        </div>

        {/* Right: Server selector */}
        <div className="cinema-topbar-right">
          {/* Playback Mode pill */}
          <div className="cinema-pill-container" ref={modeMenuRef}>
            <button
              type="button"
              className={`cinema-pill-btn${modeMenuOpen ? " open" : ""}`}
              onClick={() => { setModeMenuOpen((p) => !p); setServerMenuOpen(false); }}
              aria-label="Playback mode"
            >
              {playbackMode === "direct" ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8 }}>
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.8 }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              )}
              <span>{playbackMode === "direct" ? "Direct" : "Embed"}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ opacity: 0.5, transform: modeMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {modeMenuOpen && (
              <div className="cinema-dropdown-menu">
                <p className="cinema-dropdown-title">PLAYBACK MODE</p>
                {["direct", "embed"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`cinema-dropdown-option${playbackMode === m ? " selected" : ""}`}
                    onClick={() => handleSelectMode(m)}
                  >
                    <span>{m === "direct" ? "Direct (Bolt)" : "Embed"}</span>
                    <div className={`cinema-radio-outer${playbackMode === m ? " checked" : ""}`}>
                      {playbackMode === m && <div className="cinema-radio-inner" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Server pill (only in embed mode) */}
          {playbackMode === "embed" && (
            <div className="cinema-pill-container" ref={serverMenuRef}>
              <button
                type="button"
                className={`cinema-pill-btn${serverMenuOpen ? " open" : ""}`}
                onClick={() => { setServerMenuOpen((p) => !p); setModeMenuOpen(false); }}
                aria-label="Change server"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                  <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
                  <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
                  <line x1="6" x2="6.01" y1="6" y2="6" />
                  <line x1="6" x2="6.01" y1="18" y2="18" />
                </svg>
                <span>{activeServerName}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ opacity: 0.5, transform: serverMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {serverMenuOpen && (
                <div className="cinema-dropdown-menu servers-list">
                  <p className="cinema-dropdown-title">CHANGE SERVER</p>
                  {EMBED_SERVERS.map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      className={`cinema-dropdown-option${selectedServer === srv.id ? " selected" : ""}`}
                      onClick={() => handleSelectServer(srv.id)}
                    >
                      <span>{srv.name}</span>
                      <div className={`cinema-radio-outer${selectedServer === srv.id ? " checked" : ""}`}>
                        {selectedServer === srv.id && <div className="cinema-radio-inner" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Direct mode bolt badge */}
          {playbackMode === "direct" && (
            <span className="cinema-bolt-badge">Bolt</span>
          )}
        </div>
      </div>

      {/* Full-viewport iframe */}
      <div className="cinema-iframe-wrap">
        {currentEmbedUrl ? (
          <iframe
            ref={iframeRef}
            key={`cinema-${playbackMode}-${selectedServer}-${type}-${id}-${currentSeason}-${currentEpisode}`}
            src={currentEmbedUrl}
            className="cinema-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen *; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="eager"
            title={title ? decodeURIComponent(title) : "Cinema Player"}
          />
        ) : (
          <div className="cinema-no-src">
            <p>No video source. Please go back and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
