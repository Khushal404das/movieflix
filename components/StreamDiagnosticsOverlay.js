"use client";

import { useState, useEffect } from "react";

export default function StreamDiagnosticsOverlay({
  title = "Unknown Title",
  duration = "01:56:33",
  mediaId = "(none)",
  streamHost = "stream.movieflix.cc",
  onClose = null,
  className = ""
}) {
  const [viewport, setViewport] = useState("811x620");
  const [droppedFrames, setDroppedFrames] = useState({ dropped: 3, total: 3126 });
  const [clientId, setClientId] = useState("1xjbm8nou6jq");
  const [analyticsId, setAnalyticsId] = useState("vu0LFFarEeWQxhJtO5t17w");
  const [bwInfo, setBwInfo] = useState({ bw: "0.4", downlink: "1.5", type: "3g" });
  const [bufferHealth, setBufferHealth] = useState("0.00s");
  const [bufferPct, setBufferPct] = useState(18);
  const [bwPct, setBwPct] = useState(45);

  useEffect(() => {
    // Generate or retrieve persistent client session IDs
    try {
      let cid = localStorage.getItem("mf_debug_cid");
      if (!cid) {
        cid = Math.random().toString(36).substring(2, 14);
        localStorage.setItem("mf_debug_cid", cid);
      }
      setClientId(cid);

      let aid = localStorage.getItem("mf_debug_aid");
      if (!aid) {
        aid = "vu0" + Math.random().toString(36).substring(2, 12) + "t17w";
        localStorage.setItem("mf_debug_aid", aid);
      }
      setAnalyticsId(aid);
    } catch (_) {}

    // Viewport listener
    const updateViewport = () => {
      if (typeof window !== "undefined") {
        setViewport(`${Math.min(window.innerWidth, 854)}x${Math.min(window.innerHeight, 480)}`);
      }
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);

    // Network connection stats if supported
    if (typeof navigator !== "undefined" && navigator.connection) {
      const conn = navigator.connection;
      setBwInfo({
        bw: "0.4",
        downlink: String(conn.downlink || "10"),
        type: conn.effectiveType || "4g"
      });
      setBwPct(Math.min(Math.max((conn.downlink || 5) * 8, 20), 95));
    }

    // Dynamic buffer health & frames ticker
    const timer = setInterval(() => {
      setDroppedFrames(prev => ({
        dropped: prev.dropped,
        total: prev.total + Math.floor(Math.random() * 4) + 1
      }));
      // Subtle dynamic buffer fluctuation
      const buffVal = (Math.random() * 2.5 + 8.2).toFixed(2);
      setBufferHealth(`${buffVal}s`);
      setBufferPct(Math.min(Math.round((parseFloat(buffVal) / 15) * 100), 100));
    }, 1500);

    return () => {
      window.removeEventListener("resize", updateViewport);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={`stream-diagnostics-hud ${className}`}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="hud-close-btn"
          title="Close Stats HUD"
          aria-label="Close Stats HUD"
        >
          ✕
        </button>
      )}

      <div className="hud-grid">
        {/* Left Column */}
        <div className="hud-col">
          <div className="hud-item">
            <span className="hud-label">Title:</span>
            <span className="hud-value hud-title-val">{title || "Unknown Title"}</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Media ID:</span>
            <span className="hud-value">{mediaId || "(none)"}</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Player ID:</span>
            <span className="hud-value">(none)</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Analytics ID:</span>
            <span className="hud-value hud-hash">{analyticsId}</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Stream Type:</span>
            <span className="hud-value">hls</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Viewport:</span>
            <span className="hud-value">{viewport}</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Dropped Frames:</span>
            <span className="hud-value">{droppedFrames.dropped}/{droppedFrames.total}</span>
          </div>

          {/* Bandwidth with progress bar */}
          <div className="hud-bar-group">
            <div className="hud-item">
              <span className="hud-label">BW / Dowlink / Type:</span>
              <span className="hud-value">{bwInfo.bw} / {bwInfo.downlink} / {bwInfo.type}</span>
            </div>
            <div className="hud-progress-track">
              <div
                className="hud-progress-fill bw-bar"
                style={{ width: `${bwPct}%` }}
              />
            </div>
          </div>

          {/* Buffer Health with progress bar */}
          <div className="hud-bar-group">
            <div className="hud-item">
              <span className="hud-label">Buffer Health:</span>
              <span className="hud-value">{bufferHealth}</span>
            </div>
            <div className="hud-progress-track">
              <div
                className="hud-progress-fill buffer-bar"
                style={{ width: `${bufferPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="hud-col">
          <div className="hud-item">
            <span className="hud-label">Duration:</span>
            <span className="hud-value">{duration || "01:56:33"}</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Client ID:</span>
            <span className="hud-value">{clientId}</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Feed ID:</span>
            <span className="hud-value">(none)</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Stream Host:</span>
            <span className="hud-value">{streamHost}</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Provider:</span>
            <span className="hud-value">hlsjs</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Resolution / Mode:</span>
            <span className="hud-value">854x480 / auto</span>
          </div>

          <div className="hud-item">
            <span className="hud-label">Version:</span>
            <span className="hud-value">8.38.8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
