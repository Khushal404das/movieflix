"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const ALL_PLATFORMS = [
  { id: "netflix",     name: "Netflix" },
  { id: "prime",       name: "Amazon Prime Video" },
  { id: "amc",         name: "AMC+" },
  { id: "appletv",     name: "Apple TV" },
  { id: "crunchyroll", name: "Crunchyroll" },
  { id: "disney",      name: "Disney+" },
  { id: "hulu",        name: "Hulu" },
  { id: "hbo",         name: "HBO Max" },
  { id: "mgm",         name: "MGM+" },
  { id: "paramount",   name: "Paramount+" },
  { id: "peacock",     name: "Peacock" },
  { id: "shudder",     name: "Shudder" },
];

function buildUrl(platformId, { media, genre, sort, page } = {}) {
  const sp = new URLSearchParams();
  if (media && media !== "movie") sp.set("media", media);
  if (genre && genre !== "" && genre !== "all") sp.set("genre", genre);
  if (sort && sort !== "popularity.desc") sp.set("sort", sort);
  if (page && page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/platform/${platformId}${qs ? `?${qs}` : ""}`;
}

function useOutsideClick(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

export default function PlatformPageClient({
  platformId,
  currentMedia,
  currentSort,
  currentGenre,
  genres,
  sortOptions,
  platformName,
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [ottOpen, setOttOpen] = useState(false);

  const sortRef = useRef(null);
  const ottRef  = useRef(null);

  useOutsideClick(sortRef, () => setSortOpen(false));
  useOutsideClick(ottRef,  () => setOttOpen(false));

  const go = (overrides = {}) => {
    const url = buildUrl(platformId, {
      media: overrides.media ?? currentMedia,
      genre: "genre" in overrides ? overrides.genre : currentGenre,
      sort:  overrides.sort  ?? currentSort,
      page:  overrides.page  ?? 1,
    });
    router.push(url);
  };

  const currentSortLabel = sortOptions.find((o) => o.value === currentSort)?.label ?? "Most popular";

  const filteredGenres = search
    ? genres.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : genres;

  return (
    <div className="platform-filter-bar-wrap">
      <div className="platform-filter-bar">

        {/* Media tabs */}
        <div className="platform-media-tabs">
          <button
            type="button"
            className={`platform-tab ${currentMedia === "movie" ? "active" : ""}`}
            onClick={() => go({ media: "movie" })}
          >Movies</button>
          <button
            type="button"
            className={`platform-tab ${currentMedia === "tv" ? "active" : ""}`}
            onClick={() => go({ media: "tv" })}
          >TV Shows</button>
        </div>

        {/* ── OTT platform dropdown ── */}
        <div className="pfdd-wrap" ref={ottRef}>
          <button
            type="button"
            className={`pfdd-trigger ${ottOpen ? "open" : ""}`}
            onClick={() => { setOttOpen((o) => !o); setSortOpen(false); }}
            aria-haspopup="listbox"
            aria-expanded={ottOpen}
          >
            <span>{platformName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={ottOpen ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}/>
            </svg>
          </button>

          {ottOpen && (
            <ul className="pfdd-menu" role="listbox">
              {ALL_PLATFORMS.map((p) => (
                <li key={p.id} role="option" aria-selected={p.id === platformId}>
                  <button
                    type="button"
                    className={`pfdd-option ${p.id === platformId ? "current" : ""}`}
                    onClick={() => {
                      setOttOpen(false);
                      if (p.id !== platformId) router.push(`/platform/${p.id}`);
                    }}
                  >
                    <span>{p.name}</span>
                    {p.id === platformId && <span className="pfdd-current-badge">CURRENT</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sort label */}
        <div className="platform-sort-label">SORT</div>

        {/* ── Sort dropdown ── */}
        <div className="pfdd-wrap" ref={sortRef}>
          <button
            type="button"
            className={`pfdd-trigger sort-trigger ${sortOpen ? "open" : ""}`}
            onClick={() => { setSortOpen((o) => !o); setOttOpen(false); }}
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
          >
            <span>{currentSortLabel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={sortOpen ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}/>
            </svg>
          </button>

          {sortOpen && (
            <ul className="pfdd-menu" role="listbox">
              {sortOptions.map((o) => (
                <li key={o.value} role="option" aria-selected={o.value === currentSort}>
                  <button
                    type="button"
                    className={`pfdd-option ${o.value === currentSort ? "checked" : ""}`}
                    onClick={() => { setSortOpen(false); go({ sort: o.value }); }}
                  >
                    {o.value === currentSort && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    )}
                    <span>{o.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

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

      {/* Genre chips */}
      <div className="platform-genre-wrap">
        <span className="platform-genre-label">GENRE</span>
        <div className="platform-genre-chips">
          <button
            type="button"
            className={`platform-genre-chip ${!currentGenre || currentGenre === "all" ? "active" : ""}`}
            onClick={() => go({ genre: "" })}
          >All</button>
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
