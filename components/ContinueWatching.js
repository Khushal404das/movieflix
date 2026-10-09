"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function ContinueWatching() {
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const rowRef = useRef(null);

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("rh-history") || "[]");
      setHistory(items);
    } catch (e) {
      setHistory([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  const removeHistoryItem = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = history.filter((x) => String(x.id) !== String(id));
    setHistory(updated);
    try {
      localStorage.setItem("rh-history", JSON.stringify(updated));
    } catch (err) {}
  };

  if (!loaded || history.length === 0) return null;

  const scrollRow = (dir) => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="netflix-row-container continue-watching-row">
      <div className="row-header">
        <div className="row-title-wrap">
          <h2 className="row-title">Continue Watching for You</h2>
          <span className="row-badge-count">{history.length} in progress</span>
        </div>
      </div>

      <div className="row-slider-wrapper">
        {history.length > 4 && (
          <button
            type="button"
            className="row-nav-arrow left"
            onClick={() => scrollRow("left")}
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
        )}

        <div className="row-items-scroll" ref={rowRef}>
          {history.map((item) => (
            <div key={item.id} className="continue-card-item">
              <Link href={item.href || `/${item.type || "movie"}/${item.id}`} className="continue-card-link">
                <div className="continue-media-box">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} className="continue-poster-img" />
                  ) : (
                    <div className="continue-fallback-box">
                      <span>{item.title}</span>
                    </div>
                  )}

                  {/* Red Netflix-style Progress Bar */}
                  <div className="continue-progress-bar">
                    <div className="continue-progress-fill" style={{ width: "65%" }} />
                  </div>

                  {/* Play Overlay */}
                  <div className="continue-play-hover">
                    <div className="continue-play-circle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    </div>
                  </div>

                  {/* Remove cross button */}
                  <button
                    type="button"
                    className="continue-remove-btn"
                    title="Remove from history"
                    onClick={(e) => removeHistoryItem(e, item.id)}
                  >
                    ✕
                  </button>
                </div>

                <div className="continue-meta-info">
                  <div className="continue-title-text" title={item.title}>{item.title}</div>
                  <div className="continue-sub-text">
                    {item.season ? `S${item.season} : E${item.episode}` : "Resume Movie"}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {history.length > 4 && (
          <button
            type="button"
            className="row-nav-arrow right"
            onClick={() => scrollRow("right")}
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
