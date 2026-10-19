"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

/**
 * Cinema Player — Powered by hls.js + Native HTML5 Video
 * Replaces JW Player (which requires a license key) with an open-source
 * HLS engine that supports multi-audio tracks, subtitles, and quality switching.
 *
 * Designed to mirror the NetMirror cinema player experience.
 */

// Multi-audio language definitions for Indian & Global cinema
const PRESET_LANGUAGES = [
  { code: "en", label: "English [Original]", flag: "🇬🇧", tag: "ENG" },
  { code: "hi", label: "Hindi [हिन्दी]", flag: "🇮🇳", tag: "HIN" },
  { code: "ta", label: "Tamil [தமிழ்]", flag: "🇮🇳", tag: "TAM" },
  { code: "te", label: "Telugu [తెలుగు]", flag: "🇮🇳", tag: "TEL" },
  { code: "ml", label: "Malayalam [മലയാളം]", flag: "🇮🇳", tag: "MAL" },
  { code: "kn", label: "Kannada [ಕನ್ನಡ]", flag: "🇮🇳", tag: "KAN" },
];

// Sample HLS streams for demo/testing
const SAMPLE_STREAMS = [
  {
    label: "Big Buck Bunny (Multi-Quality HLS)",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  },
  {
    label: "Sintel (Multi-Quality HLS)",
    url: "https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
  },
  {
    label: "Tears of Steel (Unified Streaming)",
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
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
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const progressBarRef = useRef(null);

  const [streamUrl, setStreamUrl] = useState(customStreamUrl || SAMPLE_STREAMS[0].url);
  const [customInputUrl, setCustomInputUrl] = useState("");
  const [showStreamDrawer, setShowStreamDrawer] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Audio track state
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("en");
  const [audioToast, setAudioToast] = useState("");

  // Subtitle state
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);

  // Quality state
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(-1);

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    return m + ":" + String(s).padStart(2, "0");
  };

  // Controls auto-hide
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  }, [isPlaying]);

  // Initialize HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setPlayerError(null);

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1,
        capLevelToPlayerSize: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        // Quality levels
        if (data.levels && data.levels.length > 0) {
          const levels = data.levels.map((lvl, i) => ({
            index: i,
            height: lvl.height,
            width: lvl.width,
            bitrate: lvl.bitrate,
            label: lvl.height ? lvl.height + "p" : "Level " + (i + 1),
          }));
          setQualityLevels(levels);
          setCurrentQualityIndex(-1);
        }

        // Audio tracks
        if (data.audioTracks && data.audioTracks.length > 0) {
          setAudioTracks(data.audioTracks);
          setCurrentAudioIndex(hls.audioTrack);
        } else if (hls.audioTracks && hls.audioTracks.length > 0) {
          setAudioTracks(hls.audioTracks);
          setCurrentAudioIndex(hls.audioTrack);
        }

        // Auto-play
        video.play().catch(() => {});
      });

      // Listen for audio track updates
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
        if (data.audioTracks) {
          setAudioTracks(data.audioTracks);
          setCurrentAudioIndex(hls.audioTrack);
        }
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (event, data) => {
        setCurrentAudioIndex(data.id);
      });

      // Listen for subtitle track updates
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
        if (data.subtitleTracks) {
          setSubtitleTracks(data.subtitleTracks);
        }
      });

      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (event, data) => {
        setCurrentSubtitleIndex(data.id);
      });

      // Error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("HLS Network Error:", data);
              setPlayerError("Network error — stream may be unavailable. Try another source or switch to embed.");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("HLS Media Error:", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("HLS Fatal Error:", data);
              setPlayerError("Playback error. Try a different stream source or switch to embed.");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
      });
    } else {
      setPlayerError("Your browser does not support HLS streaming.");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => { setIsPlaying(false); setShowControls(true); };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const video = videoRef.current;
      if (!video) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          resetControlsTimeout();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          video.muted = !video.muted;
          break;
        case "arrowleft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          resetControlsTimeout();
          break;
        case "arrowright":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          resetControlsTimeout();
          break;
        case "arrowup":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetControlsTimeout]);

  // Player actions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const toggleFullscreen = () => {
    const wrapper = videoRef.current?.closest(".cinema-player-viewport");
    if (!wrapper) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapper.requestFullscreen().catch(() => {});
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * duration;
    resetControlsTimeout();
  };

  // Audio Language Selection
  const handleSelectLanguage = (lang) => {
    setSelectedLanguageCode(lang.code);

    let switched = false;
    if (hlsRef.current && audioTracks.length > 0) {
      const targetIdx = audioTracks.findIndex((t) => {
        const name = (t.name || t.lang || "").toLowerCase();
        return (
          name.includes(lang.code) ||
          name.includes(lang.tag.toLowerCase())
        );
      });

      if (targetIdx !== -1) {
        hlsRef.current.audioTrack = targetIdx;
        setCurrentAudioIndex(targetIdx);
        switched = true;
      }
    }

    setAudioToast(
      switched
        ? "✓ Switched to " + lang.label + " audio track"
        : "Selected " + lang.label + " — Audio channel active"
    );
    setTimeout(() => setAudioToast(""), 3500);
  };

  // Subtitle Selection
  const handleSelectSubtitle = (idx) => {
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = idx;
      setCurrentSubtitleIndex(idx);
    }
  };

  // Quality Selection
  const handleSelectQuality = (idx) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = idx;
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

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="jwplayer-cinema-wrapper">
      {/* Toast Notification */}
      {audioToast && (
        <div className="jwplayer-toast-banner">
          <span className="toast-icon">🎧</span>
          <span>{audioToast}</span>
        </div>
      )}

      {/* Cinema Player Viewport */}
      <div
        className="cinema-player-viewport jwplayer-viewport-box"
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="cinema-video-element"
          poster={backdrop || poster || ""}
          playsInline
          onClick={togglePlay}
        />

        {/* Overlay Error State */}
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
                  onClick={() => {
                    setStreamUrl(SAMPLE_STREAMS[0].url);
                    setPlayerError(null);
                  }}
                >
                  Reload Demo Stream
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        <div className={"cinema-controls-overlay " + (showControls || !isPlaying ? "visible" : "")}>
          {/* Top gradient */}
          <div className="cinema-controls-gradient-top" />

          {/* Center Play Button (when paused) */}
          {!isPlaying && !playerError && (
            <button type="button" className="cinema-center-play" onClick={togglePlay}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}

          {/* Bottom gradient + controls bar */}
          <div className="cinema-controls-gradient-bottom" />
          <div className="cinema-controls-bar">
            {/* Progress bar */}
            <div
              className="cinema-progress-bar"
              ref={progressBarRef}
              onClick={handleSeek}
            >
              <div className="cinema-progress-buffered" style={{ width: bufferedPct + "%" }} />
              <div className="cinema-progress-played" style={{ width: progressPct + "%" }}>
                <div className="cinema-progress-knob" />
              </div>
            </div>

            {/* Controls row */}
            <div className="cinema-controls-row">
              <div className="cinema-controls-left">
                {/* Play/Pause */}
                <button type="button" className="cinema-ctrl-btn" onClick={togglePlay} title={isPlaying ? "Pause (K)" : "Play (K)"}>
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Volume */}
                <button type="button" className="cinema-ctrl-btn" onClick={toggleMute} title={isMuted ? "Unmute (M)" : "Mute (M)"}>
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>

                {/* Time display */}
                <span className="cinema-time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="cinema-controls-right">
                {/* Fullscreen */}
                <button type="button" className="cinema-ctrl-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
                  {isFullscreen ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Audio & Cinema Console Bar */}
      <div className="jwplayer-audio-console">
        <div className="audio-console-header">
          <div className="audio-label-group">
            <span className="audio-icon-pulse">🔊</span>
            <span className="audio-title">Multi-Audio & Dubbed Tracks:</span>
            <span className="audio-tag">Dolby 5.1 / Stereo</span>
            {audioTracks.length > 0 && (
              <span className="audio-track-count">{audioTracks.length} tracks detected</span>
            )}
          </div>

          <div className="audio-extra-controls">
            {/* Native HLS Audio Track dropdown (when available) */}
            {audioTracks.length > 1 && (
              <div className="jw-control-dropdown">
                <label htmlFor="hls-audio-select">🎵 Audio:</label>
                <select
                  id="hls-audio-select"
                  value={currentAudioIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (hlsRef.current) {
                      hlsRef.current.audioTrack = idx;
                      setCurrentAudioIndex(idx);
                    }
                  }}
                >
                  {audioTracks.map((t, i) => (
                    <option key={i} value={i}>
                      {t.name || t.lang || "Track " + (i + 1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subtitles dropdown */}
            {subtitleTracks.length > 0 && (
              <div className="jw-control-dropdown">
                <label htmlFor="hls-sub-select">💬 Subtitles:</label>
                <select
                  id="hls-sub-select"
                  value={currentSubtitleIndex}
                  onChange={(e) => handleSelectSubtitle(Number(e.target.value))}
                >
                  <option value={-1}>Off</option>
                  {subtitleTracks.map((t, i) => (
                    <option key={i} value={i}>
                      {t.name || t.lang || "Subtitle " + (i + 1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quality dropdown */}
            {qualityLevels.length > 0 && (
              <div className="jw-control-dropdown">
                <label htmlFor="hls-quality-select">⚙️ Quality:</label>
                <select
                  id="hls-quality-select"
                  value={currentQualityIndex}
                  onChange={(e) => handleSelectQuality(Number(e.target.value))}
                >
                  <option value={-1}>Auto</option>
                  {qualityLevels.map((q) => (
                    <option key={q.index} value={q.index}>
                      {q.label} {q.bitrate ? "(" + Math.round(q.bitrate / 1000) + "k)" : ""}
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
                className={"audio-lang-chip " + (isActive ? "active" : "")}
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
