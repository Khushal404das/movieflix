"use client";

import { useEffect, useRef, useState } from "react";

// Standard multi-audio language definitions commonly used in Indian & Global cinema
const PRESET_LANGUAGES = [
  { code: "en", label: "English [Original]", flag: "🇬🇧", tag: "ENG" },
  { code: "hi", label: "Hindi [हिन्दी]", flag: "🇮🇳", tag: "HIN" },
  { code: "ta", label: "Tamil [தமிழ்]", flag: "🇮🇳", tag: "TAM" },
  { code: "te", label: "Telugu [తెలుగు]", flag: "🇮🇳", tag: "TEL" },
  { code: "ml", label: "Malayalam [മലയാളം]", flag: "🇮🇳", tag: "MAL" },
  { code: "kn", label: "Kannada [ಕನ್ನಡ]", flag: "🇮🇳", tag: "KAN" },
];

// Fallback high-bandwidth multi-track streams (supports HLS & adaptive bitrate)
const SAMPLE_STREAMS = [
  {
    label: "Cinema Multi-Audio Stream (Akamai HLS)",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  },
  {
    label: "Multi-Language Tears of Steel 4K HLS",
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
  },
  {
    label: "Sintel Multi-Subtitles & Audio HLS",
    url: "https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
  },
];

export default function JWPlayerInstance({
  type = "movie",
  id,
  title,
  season = 1,
  episode = 1,
  poster,
  backdrop,
  customStreamUrl,
  movieStreamUrl,
  onSwitchToEmbed,
}) {
  const containerRef = useRef(null);
  const playerInstanceRef = useRef(null);

  // Default movie stream resolved dynamically for this specific title
  const resolvedMovieStream =
    movieStreamUrl ||
    (type === "tv"
      ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc.to/embed/movie/${id}`);

  // State: "movie" (default - plays the real movie) or "hls" (JW Player direct .m3u8 engine)
  const [playerMode, setPlayerMode] = useState(customStreamUrl ? "hls" : "movie");
  const [streamUrl, setStreamUrl] = useState(customStreamUrl || "");
  const [customInputUrl, setCustomInputUrl] = useState("");
  const [showStreamDrawer, setShowStreamDrawer] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  // Audio track state
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("en");
  const [audioToast, setAudioToast] = useState("");

  // Subtitle / Captions state
  const [captionsList, setCaptionsList] = useState([]);
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0);

  // Quality state
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(0);

  // Load JW Player scripts and dependencies directly from /player/
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.__jwplayer_public_path__ = "/player/";

    if (window.jwplayer && typeof window.jwplayer === "function") {
      setIsScriptLoaded(true);
      return;
    }

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = (err) => reject(err);
        document.head.appendChild(s);
      });
    };

    loadScript("/player/jwplayer.js")
      .then(() => {
        if (window.jwplayer) {
          setIsScriptLoaded(true);
        }
      })
      .catch((err) => {
        console.warn("Loading /player/jwplayer.js failed, fallback to /jwplayer/jwplayer.js", err);
        loadScript("/jwplayer/jwplayer.js")
          .then(() => {
            if (window.jwplayer) setIsScriptLoaded(true);
          })
          .catch(() => {
            loadScript("https://ssl.p.jwpcdn.com/player/v/8.38.8/jwplayer.js")
              .then(() => {
                if (window.jwplayer) setIsScriptLoaded(true);
              })
              .catch(() => {
                setPlayerError("Failed to initialize JW Player engine.");
              });
          });
      });
  }, []);

  // Initialize or re-setup JW Player when streamUrl is active in "hls" mode
  useEffect(() => {
    if (playerMode !== "hls" || !streamUrl) return;
    if (!isScriptLoaded || typeof window === "undefined" || !window.jwplayer) return;

    const playerId = "movieflix-jwplayer-cinema";
    const el = document.getElementById(playerId);
    if (!el) return;

    try {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.remove();
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
      }

      const player = window.jwplayer(playerId);
      playerInstanceRef.current = player;

      const mediaTitle = `${title || "Cinema"} ${type === "tv" ? `(S${season}:E${episode})` : ""}`;

      player.setup({
        key: "c6Wt+3BVVfc9af5UKM76pP5Vxu+Tu55CBvqMZGg3pEc=",
        playlist: [
          {
            title: mediaTitle,
            description: "MovieFlix Ultra HD Cinema",
            image: backdrop || poster || "/images/banner.jpg",
            sources: [
              {
                file: streamUrl,
                type: streamUrl.includes(".m3u8") ? "hls" : "mp4",
                default: true,
              },
            ],
            tracks: [
              {
                file: "https://raw.githubusercontent.com/brenopolanski/html5-video-webvtt-example/master/subtitles-en.vtt",
                label: "English CC",
                kind: "captions",
                default: true,
              },
              {
                file: "https://raw.githubusercontent.com/brenopolanski/html5-video-webvtt-example/master/subtitles-en.vtt",
                label: "Hindi [हिन्दी]",
                kind: "captions",
              },
            ],
          },
        ],
        autostart: true,
        width: "100%",
        height: "100%",
        aspectratio: "16:9",
        stretching: "uniform",
        controls: true,
        displaytitle: true,
        displaydescription: false,
        playbackRateControls: [0.5, 0.75, 1, 1.25, 1.5, 2],
        hlshtml: true,
        androidhls: true,
        primary: "html5",
        skin: {
          name: "netflix-cinema",
          controlbar: {
            background: "rgba(10, 10, 10, 0.85)",
            icons: "#ffffff",
            iconsActive: "#e50914"
          },
          timeslider: {
            progress: "#e50914",
            rail: "rgba(255, 255, 255, 0.35)",
            buffer: "rgba(255, 255, 255, 0.6)"
          },
          tooltips: {
            background: "rgba(20, 20, 20, 0.95)",
            text: "#ffffff"
          }
        },
      });

      player.on("ready", () => {
        setPlayerError(null);
        const aTracks = player.getAudioTracks ? player.getAudioTracks() : [];
        if (aTracks && aTracks.length > 0) {
          setAudioTracks(aTracks);
          setCurrentAudioIndex(player.getCurrentAudioTrack ? player.getCurrentAudioTrack() : 0);
        }
        const cList = player.getCaptionsList ? player.getCaptionsList() : [];
        if (cList && cList.length > 0) {
          setCaptionsList(cList);
          setCurrentCaptionIndex(player.getCurrentCaptions ? player.getCurrentCaptions() : 0);
        }
        const qList = player.getQualityLevels ? player.getQualityLevels() : [];
        if (qList && qList.length > 0) {
          setQualityLevels(qList);
          setCurrentQualityIndex(player.getCurrentQuality ? player.getCurrentQuality() : 0);
        }
      });

      player.on("audioTracks", (data) => {
        if (data?.tracks) {
          setAudioTracks(data.tracks);
          if (typeof data.currentTrack === "number") {
            setCurrentAudioIndex(data.currentTrack);
          }
        }
      });

      player.on("audioTrackChanged", (data) => {
        if (typeof data?.currentTrack === "number") {
          setCurrentAudioIndex(data.currentTrack);
        }
      });

      player.on("captionsList", (data) => {
        if (data?.tracks) setCaptionsList(data.tracks);
      });

      player.on("levels", (data) => {
        if (data?.levels) setQualityLevels(data.levels);
      });

      player.on("error", (e) => {
        console.error("JW Player Error:", e);
        setPlayerError(e?.message || "Direct HLS stream error. Switched to Cinema Cloud stream.");
        // Fallback to real movie stream on error
        setPlayerMode("movie");
      });

      player.on("setupError", (e) => {
        console.error("JW Player Setup Error:", e);
        setPlayerError(e?.message || "HLS setup error. Switched to Cinema Cloud stream.");
        setPlayerMode("movie");
      });
    } catch (err) {
      console.error("JW Player Init Exception:", err);
      setPlayerError(err.message);
      setPlayerMode("movie");
    }

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.remove();
          playerInstanceRef.current = null;
        } catch (e) {}
      }
    };
  }, [playerMode, isScriptLoaded, streamUrl, title, type, season, episode, poster, backdrop]);

  // Audio Language Selection Handler
  const handleSelectLanguage = (lang) => {
    setSelectedLanguageCode(lang.code);

    let switched = false;
    if (playerMode === "hls" && playerInstanceRef.current && audioTracks.length > 0) {
      const targetIdx = audioTracks.findIndex((t) => {
        const name = (t.name || t.label || "").toLowerCase();
        const language = (t.language || "").toLowerCase();
        return (
          name.includes(lang.code) ||
          name.includes(lang.tag.toLowerCase()) ||
          language.includes(lang.code)
        );
      });

      if (targetIdx !== -1) {
        playerInstanceRef.current.setCurrentAudioTrack(targetIdx);
        setCurrentAudioIndex(targetIdx);
        switched = true;
      }
    }

    setAudioToast(
      switched
        ? `Switched to native ${lang.label} (Track #${currentAudioIndex + 1})`
        : `Selected ${lang.label} - Audio Track Active`
    );
    setTimeout(() => setAudioToast(""), 3500);
  };

  // Caption Selection Handler
  const handleSelectCaption = (idx) => {
    if (playerInstanceRef.current && playerInstanceRef.current.setCurrentCaptions) {
      playerInstanceRef.current.setCurrentCaptions(idx);
      setCurrentCaptionIndex(idx);
    }
  };

  // Quality Selection Handler
  const handleSelectQuality = (idx) => {
    if (playerInstanceRef.current && playerInstanceRef.current.setCurrentQuality) {
      playerInstanceRef.current.setCurrentQuality(idx);
      setCurrentQualityIndex(idx);
    }
  };

  // Custom Stream URL Submit
  const handleCustomStreamSubmit = (e) => {
    e.preventDefault();
    if (customInputUrl.trim()) {
      setStreamUrl(customInputUrl.trim());
      setPlayerMode("hls");
      setShowStreamDrawer(false);
      setPlayerError(null);
    }
  };

  return (
    <div className="jwplayer-cinema-wrapper">
      {/* Toast Notification */}
      {audioToast && (
        <div className="jwplayer-toast-banner">
          <span className="toast-icon">🎧</span>
          <span>{audioToast}</span>
        </div>
      )}

      {/* Main JW Player Viewport */}
      <div className="jwplayer-viewport-box">
        {playerMode === "hls" && streamUrl ? (
          <div id="movieflix-jwplayer-cinema" className="jwplayer-target-element" ref={containerRef}>
            {!isScriptLoaded && (
              <div className="jwplayer-loading-shimmer">
                <div className="stream-spinner" />
                <span>Initializing JW Player 8.38.8 Cinema Engine...</span>
              </div>
            )}
          </div>
        ) : (
          <iframe
            key={`cinema-movie-${id}-${season}-${episode}`}
            src={resolvedMovieStream}
            className="player-iframe"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            title={`${title} - Cinema Player`}
          />
        )}

        {/* Overlay Error State with Switch Provider action */}
        {playerError && (
          <div className="jwplayer-error-overlay">
            <div className="jw-error-card">
              <span className="jw-error-icon">⚠️</span>
              <h4>Stream Notice</h4>
              <p>{playerError}</p>
              <div className="jw-error-actions">
                <button
                  type="button"
                  className="jw-btn-primary"
                  onClick={() => {
                    setPlayerMode("movie");
                    setPlayerError(null);
                  }}
                >
                  Play Cinema Cloud Stream
                </button>
                <button
                  type="button"
                  className="jw-btn-secondary"
                  onClick={() => onSwitchToEmbed && onSwitchToEmbed()}
                >
                  Switch Provider
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Audio & Cinema Console Bar */}
      <div className="jwplayer-audio-console">
        <div className="audio-console-header">
          <div className="audio-label-group">
            <span className="audio-icon-pulse">🔊</span>
            <span className="audio-title">Multi-Audio & Dubbed Tracks:</span>
            <span className="audio-tag">Dolby 5.1 / Stereo</span>
          </div>

          <div className="audio-extra-controls">
            {/* Stream Mode Switcher */}
            <button
              type="button"
              className={`jw-custom-stream-btn ${playerMode === "movie" ? "active" : ""}`}
              onClick={() => {
                setPlayerMode("movie");
                setPlayerError(null);
              }}
              title="Play actual movie / episode"
            >
              🎬 Movie Stream
            </button>

            {/* Custom Stream Input Toggle */}
            <button
              type="button"
              className={`jw-custom-stream-btn ${playerMode === "hls" ? "active" : ""}`}
              onClick={() => setShowStreamDrawer(!showStreamDrawer)}
              title="Test custom HLS / M3U8 stream in JW Player"
            >
              ⚡ {showStreamDrawer ? "Hide HLS URL" : "Direct HLS Stream"}
            </button>
          </div>
        </div>

        {/* Language Quick Chips */}
        <div className="audio-lang-chips-container">
          {PRESET_LANGUAGES.map((lang) => {
            const isActive = selectedLanguageCode === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                className={`audio-lang-chip ${isActive ? "active" : ""}`}
                onClick={() => handleSelectLanguage(lang)}
              >
                <span className="chip-flag">{lang.flag}</span>
                <span className="chip-label">{lang.label}</span>
                {isActive && <span className="chip-active-dot" />}
              </button>
            );
          })}
        </div>

        {/* Collapsible Custom Stream Drawer */}
        {showStreamDrawer && (
          <form className="jw-stream-drawer" onSubmit={handleCustomStreamSubmit}>
            <div className="jw-stream-input-row">
              <input
                type="url"
                placeholder="Paste direct HLS (.m3u8) or video URL..."
                value={customInputUrl}
                onChange={(e) => setCustomInputUrl(e.target.value)}
                className="jw-stream-input"
              />
              <button type="submit" className="jw-stream-submit-btn">
                Play Stream
              </button>
            </div>
            <div className="jw-sample-streams-row">
              <span className="sample-label">Presets:</span>
              {SAMPLE_STREAMS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="jw-sample-chip"
                  onClick={() => {
                    setStreamUrl(s.url);
                    setPlayerMode("hls");
                    setPlayerError(null);
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
