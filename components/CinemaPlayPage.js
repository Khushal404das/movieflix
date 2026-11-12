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
    id: "cinezo",
    name: "Cinezo",
    getUrl: (type, id, s, e) => {
      const q = new URLSearchParams({ autoplay: "true", poster: "true", primarycolor: "E50914", secondarycolor: "0a0a12", iconcolor: "ffffff" }).toString();
      return type === "tv" ? `https://player.cinezo.live/embed/tv/${id}/${s}/${e}?${q}` : `https://player.cinezo.live/embed/movie/${id}?${q}`;
    },
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
    id: "vidup",
    name: "Premium",
    getUrl: (type, id, s, e) =>
      type === "tv"
        ? `https://vidup.to/tv/${id}/${s}/${e}?theme=E50914`
        : `https://vidup.to/movie/${id}?theme=E50914`,
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

  // Playback mode: direct (Vidbolt) | embed (server list).
  // Every title starts on Bolt (Vidbolt). If Bolt doesn't load, the page moves
  // to the embed servers on its own (see "Auto switch" below).
  const [playbackMode, setPlaybackMode] = useState("direct");

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

  // Servers the auto switch already gave up on for this title
  const failedRef = useRef(new Set());
  const [autoSwitchNote, setAutoSwitchNote] = useState("");
  const userPickedRef = useRef(false);

  const handleSelectMode = (mode) => {
    userPickedRef.current = true;
    setAutoSwitchNote("");
    setPlaybackMode(mode);
    setModeMenuOpen(false);
  };

  const handleSelectServer = (srvId) => {
    userPickedRef.current = true;
    setAutoSwitchNote("");
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

  // ── Player redirected away ────────────────────────────────────────────────
  // Bolt (Vidbolt) loads its page once and then plays, changes episode and
  // switches servers without reloading. A second "load" of the iframe means
  // something inside it sent the frame to another site (e.g. an ad link), so
  // we offer a one-click way back to the movie. We never block or reverse it
  // ourselves: the viewer decides when to reload.
  const [reloadNonce, setReloadNonce] = useState(0);
  const [redirected, setRedirected] = useState(false);
  const loadCountRef = useRef(0);
  const iframeKey = `cinema-${playbackMode}-${selectedServer}-${type}-${id}-${currentSeason}-${currentEpisode}-${reloadNonce}`;

  useEffect(() => {
    loadCountRef.current = 0;
    setRedirected(false);
  }, [iframeKey]);

  const handleIframeLoad = () => {
    loadedRef.current = true;
    loadCountRef.current += 1;
    if (playbackMode === "direct" && loadCountRef.current > 1) {
      setRedirected(true);
      setTopbarVisible(true);
    }
  };

  const reloadPlayer = () => {
    setRedirected(false);
    setReloadNonce((n) => n + 1);
  };

  // ── Auto switch ───────────────────────────────────────────────────────────
  // The player frame belongs to another site, so we can't look inside it.
  // We treat a server as working when:
  //   - Bolt: it reports a video (durationchange / timeupdate / play), or the
  //     viewer clicks into the player. If it only says "ready", it gets extra time;
  //   - other servers: the frame finishes loading.
  // If that doesn't happen in time, we move to the next server in the list.
  // A server the viewer picked themself is never switched away from.
  const healthyRef = useRef(false);
  const boltReadyRef = useRef(false);
  const loadedRef = useRef(false);

  // New title or episode: start again from Bolt.
  useEffect(() => {
    failedRef.current = new Set();
    userPickedRef.current = false;
    setAutoSwitchNote("");
    setPlaybackMode("direct");
  }, [type, id, currentSeason, currentEpisode]);

  const switchToNextServer = useCallback(() => {
    const current = playbackMode === "direct" ? "vidbolt" : selectedServer;
    failedRef.current.add(current);
    const order = [selectedServer, ...EMBED_SERVERS.map((s) => s.id)];
    const next = order.find((sid) => !failedRef.current.has(sid));
    if (!next) {
      setAutoSwitchNote("No server could load this title. Try another server or reload.");
      setTopbarVisible(true);
      return;
    }
    const failedName = playbackMode === "direct" ? "Bolt" : EMBED_SERVERS.find((s) => s.id === current)?.name;
    const nextName = EMBED_SERVERS.find((s) => s.id === next)?.name;
    setAutoSwitchNote(`${failedName} didn't load, switched to ${nextName}.`);
    setPlaybackMode("embed");
    setSelectedServer(next);
    setTopbarVisible(true);
  }, [playbackMode, selectedServer]);

  // Bolt counts as working once it reports a video.
  useEffect(() => {
    if (playbackMode !== "direct") return;
    const boltOrigin = new URL(DIRECT_SERVER.domain).origin;
    const onMessage = (e) => {
      if (e.origin !== boltOrigin) return;
      const t = e.data && typeof e.data === "object" ? e.data.type : null;
      if (t === "durationchange" || t === "timeupdate" || t === "play" || t === "playing") {
        healthyRef.current = true;
      } else if (t === "ready") {
        boltReadyRef.current = true;
      }
    };
    // Clicking into the player moves focus to the frame: the viewer is using it.
    const onBlur = () => {
      if (document.activeElement === iframeRef.current) healthyRef.current = true;
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("blur", onBlur);
    };
  }, [playbackMode, iframeKey]);

  // Time limits for each try.
  useEffect(() => {
    if (!currentEmbedUrl || userPickedRef.current) return;
    healthyRef.current = false;
    boltReadyRef.current = false;
    loadedRef.current = false;
    const isBolt = playbackMode === "direct";
    let timer;
    const check = (extended) => {
      if (userPickedRef.current) return;
      const ok = isBolt ? healthyRef.current : loadedRef.current;
      if (ok) return;
      // Bolt's player is up but no video yet: give it a little longer once.
      if (isBolt && boltReadyRef.current && !extended) {
        timer = setTimeout(() => check(true), 15000);
        return;
      }
      switchToNextServer();
    };
    timer = setTimeout(() => check(false), isBolt ? 20000 : 15000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeKey]);

  // The note goes away on its own after a while.
  useEffect(() => {
    if (!autoSwitchNote) return;
    const t = setTimeout(() => setAutoSwitchNote(""), 6000);
    return () => clearTimeout(t);
  }, [autoSwitchNote]);

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
          </button>
        </div>

        {/* Center: playback mode + server (the player shows its own title) */}
        <div className="cinema-topbar-center">
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

          {/* Reload the player (e.g. after it was sent to another site) */}
          <button
            type="button"
            className="cinema-reload-btn"
            onClick={reloadPlayer}
            aria-label="Reload player"
            title="Reload player"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Shown when the player frame was sent to another site */}
      {redirected && (
        <div className="cinema-redirect-notice" role="alert">
          <p className="cinema-redirect-title">The player was sent to another site</p>
          <p className="cinema-redirect-text">Reload it to get back to your movie.</p>
          <button type="button" className="cinema-redirect-btn" onClick={reloadPlayer}>
            Reload player
          </button>
        </div>
      )}

      {/* Auto switch note */}
      {autoSwitchNote && (
        <div className="cinema-autoswitch-note" role="status">
          {autoSwitchNote}
        </div>
      )}

      {/* Full-viewport iframe */}
      <div className="cinema-iframe-wrap">
        {currentEmbedUrl ? (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={currentEmbedUrl}
            onLoad={handleIframeLoad}
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
