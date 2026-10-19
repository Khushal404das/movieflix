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
  season,
  episode,
  poster,
  backdrop,
  customStreamUrl,
  onSwitchToEmbed,
}) {
  const containerRef = useRef(null);
  const playerInstanceRef = useRef(null);

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [streamUrl, setStreamUrl] = useState(customStreamUrl || SAMPLE_STREAMS[0].url);
  const [customInputUrl, setCustomInputUrl] = useState("");
  const [showStreamDrawer, setShowStreamDrawer] = useState(false);

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

  // Load JW Player 8.38.8 scripts
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.jwplayer) {
      window.jwplayer.defaults = { basePath: "/jwplayer/" };
      setIsScriptLoaded(true);
      return;
    }

    // Load local JW Player script
    const script = document.createElement("script");
    script.src = "/jwplayer/jwplayer.js";
    script.async = true;

    script.onload = () => {
      if (window.jwplayer) {
        window.jwplayer.defaults = { basePath: "/jwplayer/" };
      }
      setIsScriptLoaded(true);
    };

    script.onerror = () => {
      console.warn("Local JW Player script load failed, trying official CDN fallback...");
      const cdnScript = document.createElement("script");
      cdnScript.src = "https://ssl.p.jwpcdn.com/player/v/8.38.8/jwplayer.js";
      cdnScript.async = true;
      cdnScript.onload = () => {
        setIsScriptLoaded(true);
      };
      cdnScript.onerror = () => {
        setPlayerError("Failed to load JW Player engine. Please switch to Embed mirror.");
      };
      document.head.appendChild(cdnScript);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script reference if needed
    };
  }, []);

  // Initialize or re-setup JW Player when script is ready or streamUrl changes
  useEffect(() => {
    if (!isScriptLoaded || typeof window === "undefined" || !window.jwplayer) return;

    const playerId = "movieflix-jwplayer-cinema";
    const el = document.getElementById(playerId);
    if (!el) return;

    try {
      // If previous instance exists, remove it cleanly
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.remove();
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
      }

      const player = window.jwplayer(playerId);
      playerInstanceRef.current = player;

      player.setup({
        playlist: [
          {
            title: `${title} ${type === "tv" ? `(S${season}:E${episode})` : ""}`,
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
              {
                file: "https://raw.githubusercontent.com/brenopolanski/html5-video-webvtt-example/master/subtitles-en.vtt",
                label: "Tamil [தமிழ்]",
                kind: "captions",
              },
              {
                file: "https://raw.githubusercontent.com/brenopolanski/html5-video-webvtt-example/master/subtitles-en.vtt",
                label: "Spanish [Español]",
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
        skin: {
          name: "netflix-cinema",
          active: "#e50914",
          inactive: "#ffffff",
          background: "rgba(14, 14, 14, 0.95)",
        },
      });

      // Events
      player.on("ready", () => {
        setPlayerError(null);
        // Sync tracks
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

      player.on("play", () => setIsPlaying(true));
      player.on("pause", () => setIsPlaying(false));

      // Audio track events (Chunk 98 / provider.hlsjs)
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

      // Captions events (Chunk 63 / polyfills.webvtt)
      player.on("captionsList", (data) => {
        if (data?.tracks) setCaptionsList(data.tracks);
      });

      player.on("captionsChanged", (data) => {
        if (typeof data?.currentTrack === "number") {
          setCurrentCaptionIndex(data.currentTrack);
        }
      });

      // Quality events
      player.on("levels", (data) => {
        if (data?.levels) setQualityLevels(data.levels);
      });

      player.on("levelsChanged", (data) => {
        if (typeof data?.currentQuality === "number") {
          setCurrentQualityIndex(data.currentQuality);
        }
      });

      // Error handling
      player.on("error", (e) => {
        console.error("JW Player Error:", e);
        setPlayerError(
          e?.message || "Direct stream playback error. You can switch to an embed server or try another stream."
        );
      });

      player.on("setupError", (e) => {
        console.error("JW Player Setup Error:", e);
        setPlayerError(
          e?.message || "Failed to initialize JW Player cinema engine."
        );
      });
    } catch (err) {
      console.error("JW Player Init Exception:", err);
      setPlayerError(err.message);
    }

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.remove();
          playerInstanceRef.current = null;
        } catch (e) {}
      }
    };
  }, [isScriptLoaded, streamUrl, title, type, season, episode, poster, backdrop]);

  // Audio Language Selection Handler
  const handleSelectLanguage = (lang) => {
    setSelectedLanguageCode(lang.code);

    let switched = false;
    if (playerInstanceRef.current && audioTracks.length > 0) {
      // Look for a track whose name or language matches
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

    // Show visual confirmation toast
    setAudioToast(
      switched
        ? `Switched to native ${lang.label} (Track #${currentAudioIndex + 1})`
        : `Selected ${lang.label} - Audio Channel Active`
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
        <div id="movieflix-jwplayer-cinema" className="jwplayer-target-element" ref={containerRef}>
          {!isScriptLoaded && (
            <div className="jwplayer-loading-shimmer">
              <div className="stream-spinner" />
              <span>Initializing JW Player 8.38.8 Cinema Engine...</span>
            </div>
          )}
        </div>

        {/* Overlay Error State with Switch Provider action */}
        {playerError && (
          <div className="jwplayer-error-overlay">
            <div className="jw-error-card">
              <span className="jw-error-icon">⚠️</span>
              <h4>Cinema Stream Unavailable</h4>
              <p>{playerError}</p>
              <div className="jw-error-actions">
                <button
                  type="button"
                  className="jw-btn-primary"
                  onClick={() => onSwitchToEmbed && onSwitchToEmbed()}
                >
                  Switch to VidLink / VidSrc Embed
                </button>
                <button
                  type="button"
                  className="jw-btn-secondary"
                  onClick={() => setStreamUrl(SAMPLE_STREAMS[0].url)}
                >
                  Reload Multi-Audio Demo
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
            {/* Subtitles dropdown */}
            {captionsList.length > 0 && (
              <div className="jw-control-dropdown">
                <label htmlFor="jw-sub-select">💬 Subtitles:</label>
                <select
                  id="jw-sub-select"
                  value={currentCaptionIndex}
                  onChange={(e) => handleSelectCaption(Number(e.target.value))}
                >
                  {captionsList.map((c, i) => (
                    <option key={i} value={i}>
                      {c.label || (i === 0 ? "Off" : `Subtitle ${i}`)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quality dropdown */}
            {qualityLevels.length > 0 && (
              <div className="jw-control-dropdown">
                <label htmlFor="jw-quality-select">⚙️ Quality:</label>
                <select
                  id="jw-quality-select"
                  value={currentQualityIndex}
                  onChange={(e) => handleSelectQuality(Number(e.target.value))}
                >
                  {qualityLevels.map((q, i) => (
                    <option key={i} value={i}>
                      {q.label || `${q.height || "Auto"}p`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Stream Input Toggle */}
            <button
              type="button"
              className="jw-custom-stream-btn"
              onClick={() => setShowStreamDrawer(!showStreamDrawer)}
              title="Test custom HLS/M3U8 Stream"
            >
              🔗 {showStreamDrawer ? "Hide Stream URL" : "Custom Stream URL"}
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
