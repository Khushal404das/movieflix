"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PlatformPageClient({
  platformId,
  currentMedia,
  currentSort,
  currentGenre,
  genres,
  sortOptions,
  platformName,
  buildUrl,
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const go = (overrides = {}) => {
    router.push(buildUrl(overrides));
  };

  const filteredGenres = search
    ? genres.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : genres;

  return (
    <div className="platform-filter-bar-wrap">
      {/* ── Top bar: tabs + sort + search ── */}
      <div className="platform-filter-bar">
        {/* Media type tabs */}
        <div className="platform-media-tabs">
          <button
            type="button"
            className={`platform-tab ${currentMedia === "movie" ? "active" : ""}`}
            onClick={() => go({ media: "movie" })}
          >
            Movies
          </button>
          <button
            type="button"
            className={`platform-tab ${currentMedia === "tv" ? "active" : ""}`}
            onClick={() => go({ media: "tv" })}
          >
            TV Shows
          </button>
        </div>

        {/* Platform label pill */}
        <div className="platform-filter-pill">
          <span>{platformName}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>

        {/* Sort label */}
        <div className="platform-sort-label">SORT</div>

        {/* Sort dropdown */}
        <select
          className="platform-sort-select"
          value={currentSort}
          onChange={(e) => go({ sort: e.target.value })}
          aria-label="Sort by"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="platform-search-wrap">
          <svg className="platform-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="platform-search-input"
            placeholder={`Search on ${platformName}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={`Search on ${platformName}`}
          />
        </div>
      </div>

      {/* ── Genre chips ── */}
      <div className="platform-genre-wrap">
        <span className="platform-genre-label">GENRE</span>
        <div className="platform-genre-chips">
          <button
            type="button"
            className={`platform-genre-chip ${!currentGenre || currentGenre === "all" ? "active" : ""}`}
            onClick={() => go({ genre: "" })}
          >
            All
          </button>
          {filteredGenres.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`platform-genre-chip ${String(currentGenre) === String(g.id) ? "active" : ""}`}
              onClick={() => go({ genre: String(g.id) })}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
