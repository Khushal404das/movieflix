"use client";

/**
 * CinemaPlayer — a Netflix / Prime Video–style custom streaming player.
 *
 * Plays HLS (.m3u8) via hls.js, or native MP4/WebM. Reads audio renditions
 * (dubs) and subtitle tracks straight from the HLS manifest, so any
 * multi-audio master playlist automatically powers the Audio / Subtitle
 * switchers in the settings menu. External WebVTT subtitle files can also
 * be passed through the `subtitles` prop for non-HLS sources.
 *
 * NOTE: This player only plays streams you legitimately control. It does
 * NOT load third-party piracy embeds — a custom UI like this cannot sit on
 * top of a cross-origin iframe, and using unlicensed streams is copyright
 * infringement. Feed it your own licensed HLS/MP4 URLs via lib/streams.js
 * (movie/TV) or the Internet Archive source (public-domain Classics).
 */

import { useEffect, useRef, useState, useCallback } from "react";

const HIDE_CONTROLS_DELAY = 2600;
const FMT = (t) => {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const s = Math.floor(t % 60);
  const m = Math.floor((t / 60) % 60);
  const h = Math.floor(t / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export default function CinemaPlayer({
  src,
  title = "",
  poster = null,
  mimeType, // 'hls' | 'mp4' | undefined (auto from URL)
  subtitles = [], // [{ label, src, srclang, default }]
  onEnded,
  autoPlay = false
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const screenRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimer = useRef(null);
  const dragRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [pip, setPip] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [menu, setMenu] = useState(null); // null | 'audio' | 'subs' | 'speed'
  const [audioTracks, setAudioTracks] = useState([]);
  const [activeAudio, setActiveAudio] = useState(-1);
  const [subTracks, setSubTracks] = useState([]);
  const [activeSub, setActiveSub] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(null); // { x, t }

  const isHls = mimeType === "hls" || (!mimeType && /\.m3u8(\?|#|$)/i.test(src || ""));

  /* ---------- load source ---------- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    setReady(false);
    setStarted(false);
    setError(null);
    setCurrent(0);
    setDuration(0);
    setBuffered(0);

    if (!isHls) {
      v.src = src;
      v.load();
      return () => {
        v.removeAttribute("src");
        v.load();
      };
    }

    let cancelled = false;
    (async () => {
      try {
        const mod = await import("hls.js");
        if (cancelled) return;
        const Hls = mod.default;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
          hlsRef.current = hls;
          hls.attachMedia(v);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (cancelled) return;
            setReady(true);
            syncAudio(hls);
            syncSubsHls(hls);
            if (autoPlay) v.play().catch(() => {});
          });
          hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => syncAudio(hls));
          hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => syncSubsHls(hls));
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (!data) return;
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  setError("This stream could not be played. Please try another source.");
                  hls.destroy();
                  break;
              }
            }
          });
          hls.loadSource(src);
        } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native HLS
          v.src = src;
          v.load();
        } else {
          setError("HLS playback is not supported in this browser.");
        }
      } catch {
        setError("Failed to load the player engine.");
      }
    })();

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isHls]);

  /* ---------- native subtitle tracks (for mp4 + external VTT) ---------- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onCues = () => {
      if (hlsRef.current) return; // HLS path manages its own subs
      const tracks = Array.from(v.textTracks || []);
      const list = tracks
        .map((t, i) => ({ id: i, label: t.label || t.language || `Subtitle ${i + 1}`, lang: t.language || "", native: true }))
        .filter((t) => t.label);
      setSubTracks(list);
      const def = list.findIndex((t) => tracks[t.id]?.mode === "showing");
      setActiveSub(def >= 0 ? def : -1);
    };
    onCues();
    v.addEventListener("loadstart", onCues);
    return () => v.removeEventListener("loadstart", onCues);
  }, [src]);

  function syncAudio(hls) {
    const tracks = (hls.audioTracks || []).map((t, i) => ({
      id: i,
      name: t.name || (t.lang ? t.lang.toUpperCase() : `Audio ${i + 1}`),
      lang: t.lang || ""
    }));
    setAudioTracks(tracks);
    setActiveAudio(tracks.length ? hls.audioTrack ?? 0 : -1);
  }

  function syncSubsHls(hls) {
    const tracks = (hls.subtitleTracks || []).map((t, i) => ({
      id: i,
      name: t.name || (t.lang ? t.lang.toUpperCase() : `Subtitle ${i + 1}`),
      lang: t.lang || "",
      hls: true
    }));
    setSubTracks(tracks);
    setActiveSub(tracks.length ? hls.subtitleTrack ?? -1 : -1);
  }

  /* ---------- video element event wiring ---------- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => { setPlaying(true); setStarted(true); setBuffering(false); armHide(); };
    const onPause = () => { setPlaying(false); setShowControls(true); cancelHide(); };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onCanPlay = () => setBuffering(false);
    const onTime = () => {
      if (!dragRef.current) setCurrent(v.currentTime || 0);
      setDuration(v.duration || 0);
    };
    const onProgress = () => {
      const d = v.duration;
      if (d && v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onVol = () => { setMuted(v.muted); setVolume(v.volume); };
    const onRate = () => setSpeed(v.playbackRate);
    const onMeta = () => setDuration(v.duration || 0);
    const onEndedCb = () => { setPlaying(false); onEnded?.(); };
    const onEnterPip = () => setPip(true);
    const onLeavePip = () => setPip(false);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("progress", onProgress);
    v.addEventListener("volumechange", onVol);
    v.addEventListener("ratechange", onRate);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("ended", onEndedCb);
    v.addEventListener("enterpictureinpicture", onEnterPip);
    v.addEventListener("leavepictureinpicture", onLeavePip);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("volumechange", onVol);
      v.removeEventListener("ratechange", onRate);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("ended", onEndedCb);
      v.removeEventListener("enterpictureinpicture", onEnterPip);
      v.removeEventListener("leavepictureinpicture", onLeavePip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEnded]);

  /* ---------- fullscreen sync ---------- */
  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* ---------- controls auto-hide ---------- */
  const cancelHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const armHide = useCallback(() => {
    cancelHide();
    hideTimer.current = setTimeout(() => {
      if (!dragRef.current && !menu) setShowControls(false);
    }, HIDE_CONTROLS_DELAY);
  }, [cancelHide, menu]);

  const wake = useCallback(() => {
    setShowControls(true);
    if (playing) armHide();
  }, [playing, armHide]);

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const onMove = () => wake();
    el.addEventListener("mousemove", onMove);
    el.addEventListener("touchstart", onMove, { passive: true });
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("touchstart", onMove);
    };
  }, [wake]);

  useEffect(() => () => cancelHide(), [cancelHide]);

  /* ---------- playback actions ---------- */
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekTo = useCallback((t) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(t)) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || t));
    setCurrent(v.currentTime);
  }, []);

  const skip = useCallback((d) => {
    const v = videoRef.current;
    if (!v) return;
    seekTo((v.currentTime || 0) + d);
  }, [seekTo]);

  const setVol = useCallback((val) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    if (val > 0 && v.muted) v.muted = false;
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  }, []);

  const toggleFs = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  }, []);

  const togglePip = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (v.requestPictureInPicture) await v.requestPictureInPicture();
    } catch { /* ignore */ }
  }, []);

  const selectAudio = useCallback((id) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = id;
      setActiveAudio(id);
    }
    setMenu(null);
  }, []);

  const selectSub = useCallback((id) => {
    const v = videoRef.current;
    if (id < 0) {
      if (hlsRef.current) hlsRef.current.subtitleTrack = -1;
      Array.from(v?.textTracks || []).forEach((t) => (t.mode = "disabled"));
      setActiveSub(-1);
    } else if (subTracks[id]?.hls && hlsRef.current) {
      hlsRef.current.subtitleTrack = id;
      setActiveSub(id);
    } else if (v?.textTracks) {
      Array.from(v.textTracks).forEach((t) => (t.mode = "disabled"));
      const t = v.textTracks[id];
      if (t) t.mode = "showing";
      setActiveSub(id);
    }
    setMenu(null);
  }, [subTracks]);

  const setRate = useCallback((r) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setSpeed(r);
    setMenu(null);
  }, []);

  /* ---------- seek bar interaction ---------- */
  const barRef = useRef(null);
  const fracFromEvent = useCallback((clientX) => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return rect.width ? x / rect.width : 0;
  }, []);

  // Extract clientX from either a mouse or touch event
  const clientXFromEvent = useCallback((e) => {
    if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
    return e.clientX;
  }, []);

  const onBarDown = useCallback((e) => {
    dragRef.current = true;
    setShowControls(true);
    cancelHide();
    const f = fracFromEvent(clientXFromEvent(e));
    seekTo(f * (duration || 0));
    const onMove = (ev) => {
      const ff = fracFromEvent(clientXFromEvent(ev));
      seekTo(ff * (duration || 0));
    };
    const onUp = () => {
      dragRef.current = false;
      if (playing) armHide();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      document.removeEventListener("touchcancel", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    document.addEventListener("touchcancel", onUp);
  }, [fracFromEvent, clientXFromEvent, seekTo, duration, playing, armHide, cancelHide]);

  const onBarTouchStart = useCallback((e) => {
    // Prevent page scroll while scrubbing
    e.preventDefault();
    onBarDown(e);
  }, [onBarDown]);

  const onBarHover = useCallback((e) => {
    const f = fracFromEvent(e.clientX);
    const rect = barRef.current?.getBoundingClientRect();
    setHover({ x: e.clientX - (rect?.left || 0), t: f * (duration || 0) });
  }, [fracFromEvent, duration]);

  const onBarLeave = useCallback(() => setHover(null), []);

  /* ---------- keyboard ---------- */
  const onKeyDown = useCallback((e) => {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault(); togglePlay(); break;
      case "ArrowLeft": e.preventDefault(); skip(-5); break;
      case "ArrowRight": e.preventDefault(); skip(5); break;
      case "j": skip(-10); break;
      case "l": skip(10); break;
      case "ArrowUp": e.preventDefault(); setVol(Math.min(1, (volume || 0) + 0.1)); break;
      case "ArrowDown": e.preventDefault(); setVol(Math.max(0, (volume || 0) - 0.1)); break;
      case "f": toggleFs(); break;
      case "m": toggleMute(); break;
      default: break;
    }
  }, [togglePlay, skip, setVol, volume, toggleFs, toggleMute]);

  /* ---------- big play overlay ---------- */
  const showBigPlay = !playing && !buffering && !error;
  const progressPct = duration ? (current / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const controlsVisible = showControls || !playing || !!menu || buffering;

  return (
    <div
      className="cp-screen"
      ref={screenRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        // a single click toggles play, but ignore clicks that originate on controls
        if (e.target.closest("[data-control]")) return;
        togglePlay();
      }}
      onDoubleClick={(e) => {
        if (e.target.closest("[data-control]")) return;
        toggleFs();
      }}
      onTouchEnd={(e) => {
        // Ensure tap-to-play works on mobile (touch events don't always fire click)
        if (e.cancelable) e.preventDefault();
        if (e.target.closest("[data-control]")) return;
        // Single tap: wake controls; double-tap handled via click
        wake();
      }}
    >
      <div className="cp-stage" ref={containerRef}>
        {poster && !started && (
          <img className="cp-poster" src={poster} alt="" aria-hidden="true" />
        )}

        <video
          ref={videoRef}
          className="cp-video"
          playsInline
          preload="metadata"
        >
          {subtitles.map((s, i) => (
            <track
              key={i}
              kind="subtitles"
              src={s.src}
              srcLang={s.srclang}
              label={s.label}
              default={s.default ? true : undefined}
            />
          ))}
        </video>

        {/* buffering spinner */}
        {buffering && !error && (
          <div className="cp-spinner-wrap" data-control="spinner">
            <div className="cp-spinner" />
          </div>
        )}

        {/* big center play button (Netflix/Prime detail-page style) */}
        {showBigPlay && (
          <button
            type="button"
            className="cp-bigplay"
            data-control="bigplay"
            onClick={togglePlay}
            aria-label="Play"
          >
            <svg viewBox="0 0 24 24" width="46" height="46" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}

        {/* top title bar (shown before first play) */}
        {title && !started && (
          <div className="cp-title-bar" data-control="title">
            <span>{title}</span>
          </div>
        )}

        {/* error state */}
        {error && (
          <div className="cp-error" data-control="error">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* gradient + controls */}
        <div
          className={`cp-controls ${controlsVisible ? "is-visible" : ""}`}
          data-control="controls"
          onMouseMove={wake}
        >
          {/* seek bar */}
          <div
            className="cp-seek"
            ref={barRef}
            onMouseDown={onBarDown}
            onMouseMove={onBarHover}
            onMouseLeave={onBarLeave}
            onTouchStart={onBarTouchStart}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration || 0)}
            aria-valuenow={Math.floor(current)}
            tabIndex={0}
          >
            <div className="cp-seek-track">
              <div className="cp-seek-buffered" style={{ width: `${bufferedPct}%` }} />
              <div className="cp-seek-played" style={{ width: `${progressPct}%` }} />
              <div className="cp-seek-thumb" style={{ left: `${progressPct}%` }} />
            </div>
            {hover && (
              <div className="cp-seek-tooltip" style={{ left: `${hover.x}px` }}>
                {FMT(hover.t)}
              </div>
            )}
          </div>

          {/* bottom row */}
          <div className="cp-row">
            <div className="cp-left">
              <button type="button" className="cp-btn" data-control onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
                {playing ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              <button type="button" className="cp-btn cp-sm" data-control onClick={() => skip(-10)} aria-label="Back 10 seconds" title="Back 10s (j)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19 4 12l7-7" /><path d="M4 12h11a7 7 0 0 1 0 14h-1" /></svg>
              </button>
              <button type="button" className="cp-btn cp-sm" data-control onClick={() => skip(10)} aria-label="Forward 10 seconds" title="Forward 10s (l)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 19l7-7-7-7" /><path d="M20 12H9a7 7 0 0 0 0 14h1" /></svg>
              </button>

              <div className="cp-volume" data-control>
                <button type="button" className="cp-btn" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} title="Mute (m)">
                  {muted || volume === 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3 2.5-2.5-1-1L15.5 11l-2.5-2.5-1 1 2.5 2.5-2.5 2.5 1 1 2.5-2.5 2.5 2.5 1-1L16.5 12z" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" /></svg>
                  )}
                </button>
                <input
                  className="cp-vol-range"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => setVol(Number(e.target.value))}
                  aria-label="Volume"
                />
              </div>

              <span className="cp-time">{FMT(current)} <span className="cp-dur">/ {FMT(duration)}</span></span>
            </div>

            <div className="cp-right">
              {/* settings menu */}
              <div className="cp-menu-wrap" data-control>
                <button
                  type="button"
                  className={`cp-btn ${menu ? "is-active" : ""}`}
                  onClick={() => setMenu(menu ? null : "audio")}
                  aria-label="Settings"
                  title="Audio & subtitles"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></svg>
                </button>

                {menu && (
                  <div className="cp-menu" role="menu">
                    {/* audio */}
                    <div className="cp-menu-section">
                      <div className="cp-menu-head">Audio</div>
                      {(audioTracks.length ? audioTracks : [{ id: -1, name: "Original" }]).map((t, idx) => {
                        const active = audioTracks.length ? activeAudio === t.id : t.id === -1;
                        return (
                          <button
                            key={t.id + "" + idx}
                            className={`cp-menu-item ${active ? "is-active" : ""}`}
                            onClick={() => audioTracks.length && selectAudio(t.id)}
                            role="menuitemradio"
                            aria-checked={active}
                          >
                            <span className="cp-check">{active ? "✓" : ""}</span>
                            {t.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* subtitles */}
                    <div className="cp-menu-section">
                      <div className="cp-menu-head">Subtitles</div>
                      <button
                        className={`cp-menu-item ${activeSub === -1 ? "is-active" : ""}`}
                        onClick={() => selectSub(-1)}
                        role="menuitemradio"
                        aria-checked={activeSub === -1}
                      >
                        <span className="cp-check">{activeSub === -1 ? "✓" : ""}</span>Off
                      </button>
                      {subTracks.map((t, idx) => (
                        <button
                          key={t.id + "" + idx}
                          className={`cp-menu-item ${activeSub === idx ? "is-active" : ""}`}
                          onClick={() => selectSub(idx)}
                          role="menuitemradio"
                          aria-checked={activeSub === idx}
                        >
                          <span className="cp-check">{activeSub === idx ? "✓" : ""}</span>{t.name}
                        </button>
                      ))}
                    </div>

                    {/* speed */}
                    <div className="cp-menu-section">
                      <div className="cp-menu-head">Playback Speed</div>
                      {[0.5, 1, 1.25, 1.5, 2].map((r) => (
                        <button
                          key={r}
                          className={`cp-menu-item ${speed === r ? "is-active" : ""}`}
                          onClick={() => setRate(r)}
                          role="menuitemradio"
                          aria-checked={speed === r}
                        >
                          <span className="cp-check">{speed === r ? "✓" : ""}</span>{r === 1 ? "Normal" : `${r}×`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="button" className="cp-btn cp-sm" data-control onClick={togglePip} aria-label="Picture in picture" title="Picture in picture">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><rect x="12" y="11" width="8" height="6" rx="1" fill="currentColor" /></svg>
              </button>

              <button type="button" className="cp-btn" data-control onClick={toggleFs} aria-label="Fullscreen" title="Fullscreen (f)">
                {fullscreen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3v3a3 3 0 0 1-3 3H3M15 3v3a3 3 0 0 0 3 3h3M9 21v-3a3 3 0 0 0-3-3H3M15 21v-3a3 3 0 0 1 3-3h3" /></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
