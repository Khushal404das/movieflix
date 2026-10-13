import Link from "next/link";
import { notFound } from "next/navigation";
import { getDiscover, getGenreList, SUPPORTED_LANGUAGES, OTT_PLATFORMS } from "@/lib/tmdb";
import { TmdbCard } from "@/components/Card";

export async function generateMetadata({ params }) {
  const isTv = params.type === "tv";
  return {
    title: `Browse ${isTv ? "TV & Web Series" : "Movies"} – MovieFlix`,
    description: `Browse HD ${isTv ? "TV shows and web series" : "movies"} by OTT platform and genre.`
  };
}

export default async function Browse({ params, searchParams }) {
  const { type } = params;
  if (!["movie", "tv"].includes(type)) notFound();

  const page = Number(searchParams.page) || 1;
  const genre = searchParams.genre || "";
  const lang = searchParams.lang || "";
  const ott = searchParams.ott || "";

  const [genres, discoverData] = await Promise.all([
    getGenreList(type),
    getDiscover(type, genre, page, "popularity.desc", lang, ott)
  ]);

  const items = discoverData.results || [];
  const totalPages = Math.min(discoverData.total_pages || 1, 500);

  const buildUrl = (targetPage = 1, targetGenre = genre, targetLang = lang, targetOtt = ott) => {
    const sp = new URLSearchParams();
    if (targetGenre && targetGenre !== "all") sp.set("genre", targetGenre);
    if (targetLang && targetLang !== "all") sp.set("lang", targetLang);
    if (targetOtt && targetOtt !== "all") sp.set("ott", targetOtt);
    if (targetPage > 1) sp.set("page", targetPage);
    const qs = sp.toString();
    return `/browse/${type}${qs ? `?${qs}` : ""}`;
  };

  const activeGenreName = genres.find((g) => String(g.id) === String(genre) || g.name === genre)?.name;
  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  const activeOttObj = OTT_PLATFORMS.find((o) => o.id === ott);

  let pageTitle = type === "movie" ? "Browse Movies" : "Browse TV & Web Series";
  if (activeLangObj && activeLangObj.code !== "all") {
    pageTitle = `${activeLangObj.flag} ${activeLangObj.label} ${type === "tv" ? "Series" : "Movies"}`;
  } else if (activeOttObj && activeOttObj.id !== "all") {
    pageTitle = `${activeOttObj.icon} ${activeOttObj.name} Originals & Catalog`;
  } else if (activeGenreName) {
    pageTitle = `${activeGenreName} ${type === "tv" ? "Series" : "Movies"}`;
  }

  return (
    <main className="container-page">
      <div className="page-header-block">
        <div className="page-header-text">
          <span className="page-category-tag">
            {type === "tv" ? "Web Series & Shows" : "HD Movies & Cinema"}
          </span>
          <h1 className="page-title">{pageTitle}</h1>
          <p className="page-subtitle">
            Explore top cinema, trending series, and official streaming catalogs from 50+ OTT platforms.
          </p>
        </div>
      </div>

      {/* 1. OTT Network Platforms (NetMirror Aggregator) */}
      <div className="browse-filters-section">
        <div className="filter-row-header">
          <span className="filter-icon">📺</span>
          <span className="filter-title">OTT Platforms:</span>
        </div>
        <div className="filter-chips-wrapper ott-chips">
          {OTT_PLATFORMS.map((o) => {
            const isSelected = (ott === "" && o.id === "all") || ott === o.id;
            return (
              <Link
                key={o.id}
                className={`filter-chip ott-chip ${isSelected ? "active" : ""}`}
                href={buildUrl(1, genre, lang, o.id)}
              >
                <span>{o.icon}</span>
                <span>{o.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Genre Filter Chips */}
      <div className="browse-filters-section">
        <div className="filter-row-header">
          <span className="filter-icon">🏷️</span>
          <span className="filter-title">Genres:</span>
        </div>
        <div className="filter-chips-wrapper">
          <Link
            className={`filter-chip ${!genre ? "active" : ""}`}
            href={buildUrl(1, "", lang, ott)}
          >
            All Genres
          </Link>
          {genres.map((g) => (
            <Link
              key={g.id}
              className={`filter-chip ${String(genre) === String(g.id) ? "active" : ""}`}
              href={buildUrl(1, g.id, lang, ott)}
            >
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      {items.length > 0 ? (
        <div className="media-grid">
          {items.map((x) => (
            <TmdbCard key={(x.type || type) + x.id} item={x} />
          ))}
        </div>
      ) : (
        <div className="empty-state-box">
          <p>No titles found with the selected language and filters.</p>
          <Link href={`/browse/${type}`} className="btn-primary">Reset All Filters</Link>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          {page > 1 && (
            <Link className="page-btn ghost" href={buildUrl(page - 1, genre, lang, ott)}>
              &larr; Previous Page
            </Link>
          )}
          <span className="page-indicator">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link className="page-btn primary" href={buildUrl(page + 1, genre, lang, ott)}>
              Next Page &rarr;
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
