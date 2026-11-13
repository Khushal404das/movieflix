"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// MovieFlix's own controls for the VidBolt player (Bolt / Bolt 2).
//
// VidBolt's embed API lets the host page drive the player with postMessage
// (play, pause, seek, volume) and reports ready / play / pause / timeupdate /
// durationchange / ended back. A clear layer sits over the player, so clicks
// go to these controls instead of the player's own. VidBolt has no option to
// remove its own control bar: it hides it while playing and shows it when
// paused, where this bar covers it.
//
// Quality, audio language, subtitles and server choice only exist in VidBolt's
// own menus, so the "Player menu" button hands clicks back to the player until
// the viewer returns to these controls.

function fmt(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default function BoltControls({ iframeRef, origin, visible }) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrubUntilRef = useRef(0);

  const send = useCallback(
    (type, params = {}) => {
      iframeRef.current?.contentWindow?.postMessage({ type, ...params }, origin);
    },
    [iframeRef, origin]
  );

  // Player → page
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== origin) return;
      const d = e.data;
      if (!d || typeof d !== "object") return;
      switch (d.type) {
        case "play":
          setPlaying(true);
          break;
        case "pause":
        case "ended":
          setPlaying(false);
          break;
        case "timeupdate":
          if (typeof d.time === "number" && Date.now() > scrubUntilRef.current) setTime(d.time);
          break;
        case "durationchange":
          if (typeof d.duration === "number") setDuration(d.duration);
          break;
        default:
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [origin]);

  const togglePlay = useCallback(() => {
    send(playing ? "pause" : "play");
  }, [playing, send]);

  const seekTo = useCallback(
    (t) => {
      const target = Math.max(0, duration ? Math.min(duration - 1, t) : t);
      scrubUntilRef.current = Date.now() + 800; // ignore stale time reports while seeking
      setTime(target);
      send("seek", { time: target });
    },
    [duration, send]
  );

  const applyVolume = useCallback(
    (v, mute) => {
      setVolume(v);
      setMuted(mute);
      send("volume", { volume: mute ? 0 : v });
    },
    [send]
  );

  const toggleFullscreen = useCallback(() => {
    const root = document.querySelector(".cinema-play-root");
    if (!root) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else root.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Keyboard: space / k play-pause, arrows seek and volume, m mute, f fullscreen
  useEffect(() => {
    if (unlocked) return;
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key) {
        case " ":
        case "k":
          if (tag === "BUTTON") return; // the focused button handles Space itself
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekTo(time - 10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekTo(time + 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          applyVolume(Math.min(1, volume + 0.1), false);
          break;
        case "ArrowDown":
          e.preventDefault();
          applyVolume(Math.max(0, volume - 0.1), false);
          break;
        case "m":
          applyVolume(volume, !muted);
          break;
        case "f":
          toggleFullscreen();
          break;
        default:
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlocked, togglePlay, seekTo, applyVolume, toggleFullscreen, time, volume, muted]);

  if (unlocked) {
    return (
      <button type="button" className="bolt-ctl-return" onClick={() => setUnlocked(false)}>
        Back to MovieFlix controls
      </button>
    );
  }

  const shown = visible || !playing;
  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
  const volShown = muted ? 0 : volume;

  return (
    <>
      {/* Clear layer over the player: click = play/pause, double-click = fullscreen */}
      <div
        className="bolt-ctl-layer"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        // A second quick press would start a text selection (blue wash over the player)
        onMouseDown={(e) => {
          if (e.detail > 1) e.preventDefault();
        }}
        aria-hidden="true"
      >
        {!playing && (
          <span className="bolt-ctl-bigplay">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
        )}
      </div>

      <div className={`bolt-ctl-bar${shown ? " visible" : ""}`}>
        <input
          type="range"
          className="bolt-ctl-seek"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(time, duration || 0)}
          onChange={(e) => seekTo(Number(e.target.value))}
          disabled={!duration}
          aria-label="Seek"
          style={{ "--bolt-pct": `${pct}%` }}
        />

        <div className="bolt-ctl-row">
          <button type="button" className="bolt-ctl-btn" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <button type="button" className="bolt-ctl-btn bolt-ctl-skip" onClick={() => seekTo(time - 10)} aria-label="Back 10 seconds">
            −10
          </button>
          <button type="button" className="bolt-ctl-btn bolt-ctl-skip" onClick={() => seekTo(time + 10)} aria-label="Forward 10 seconds">
            +10
          </button>

          <button type="button" className="bolt-ctl-btn" onClick={() => applyVolume(volume || 0.5, !muted)} aria-label={muted ? "Unmute" : "Mute"}>
            {volShown === 0 ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="m22 9-6 6M16 9l6 6" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
            )}
          </button>
          <input
            type="range"
            className="bolt-ctl-volume"
            min={0}
            max={1}
            step={0.05}
            value={volShown}
            onChange={(e) => applyVolume(Number(e.target.value), false)}
            aria-label="Volume"
            style={{ "--bolt-pct": `${volShown * 100}%` }}
          />

          <span className="bolt-ctl-time">
            {fmt(time)} / {fmt(duration)}
          </span>

          <span className="bolt-ctl-spacer" />

          <button
            type="button"
            className="bolt-ctl-btn bolt-ctl-text"
            onClick={() => setUnlocked(true)}
            title="Quality, audio language, subtitles and servers"
          >
            Player menu
          </button>

          <button type="button" className="bolt-ctl-btn" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" /></svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
