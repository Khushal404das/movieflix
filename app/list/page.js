"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/Card";

export default function MyListPage() {
  const [activeTab, setActiveTab] = useState("watchlist"); // 'watchlist' | 'history'
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [filterType, setFilterType] = useState("all"); // 'all' | 'movie' | 'tv'
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedList = JSON.parse(localStorage.getItem("rh-list") || "[]");
      const savedHist = JSON.parse(localStorage.getItem("rh-history") || "[]");
      setWatchlist(savedList);
      setHistory(savedHist);
    } catch (e) {
      setWatchlist([]);
      setHistory([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your watch history?")) {
      try {
        localStorage.removeItem("rh-history");
        setHistory([]);
      } catch (e) {}
    }
  };

  const clearWatchlist = () => {
    if (window.confirm("Are you sure you want to clear your entire watchlist?")) {
      try {
        localStorage.removeItem("rh-list");
        setWatchlist([]);
      } catch (e) {}
    }
  };

  const currentList = activeTab === "watchlist" ? watchlist : history;
  const filteredItems = currentList.filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  return (
    <main className="container-page">
      <div className="page-header-block">
        <h1 className="page-title">My Library</h1>
        <p className="page-subtitle">Your saved watchlist, bookmarks, and recent streaming activity.</p>
      </div>

      {/* Library Tabs & Controls */}
      <div className="library-nav-bar">
        <div className="tab-buttons-group">
          <button
            type="button"
            className={`lib-tab ${activeTab === "watchlist" ? "active" : ""}`}
            onClick={() => setActiveTab("watchlist")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            <span>Watchlist ({watchlist.length})</span>
          </button>

          <button
            type="button"
            className={`lib-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Watch History ({history.length})</span>
          </button>
        </div>

        <div className="lib-actions-group">
          {currentList.length > 0 && (
            <button
              type="button"
              className="btn-clear"
              onClick={activeTab === "watchlist" ? clearWatchlist : clearHistory}
            >
              Clear {activeTab === "watchlist" ? "Watchlist" : "History"}
            </button>
          )}
        </div>
      </div>

      {/* Media Type Filter */}
      {currentList.length > 0 && (
        <div className="filter-chips-wrapper">
          <button
            type="button"
            className={`filter-chip ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Items ({currentList.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterType === "movie" ? "active" : ""}`}
            onClick={() => setFilterType("movie")}
          >
            Movies
          </button>
          <button
            type="button"
            className={`filter-chip ${filterType === "tv" ? "active" : ""}`}
            onClick={() => setFilterType("tv")}
          >
            TV & Web Series
          </button>
        </div>
      )}

      {/* Grid or Empty state */}
      {isLoaded && (
        filteredItems.length > 0 ? (
          <div className="media-grid">
            {filteredItems.map((x) => (
              <Card
                key={x.href || x.id}
                href={x.href || `/${x.type || "movie"}/${x.id}`}
                title={x.title}
                poster={x.poster}
                rating={x.rating}
                type={x.type}
                sub={x.season ? `S${x.season} : E${x.episode}` : (x.sub || x.year)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state-box">
            <div className="empty-icon">{activeTab === "watchlist" ? "📑" : "🕒"}</div>
            <h3>Your {activeTab === "watchlist" ? "watchlist is currently empty" : "streaming history is empty"}</h3>
            <p>
              {activeTab === "watchlist"
                ? "Click '+ Add to Watchlist' on any movie or web series to bookmark it for later."
                : "Titles you stream will automatically appear here so you can continue where you left off."}
            </p>
            <div className="chips-row" style={{ marginTop: "18px" }}>
              <Link href="/browse/movie" className="btn-primary">Browse Movies</Link>
              <Link href="/browse/tv" className="btn-primary" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>Browse Web Series</Link>
            </div>
          </div>
        )
      )}
    </main>
  );
}
