import Link from "next/link";
import { notFound } from "next/navigation";
import { getDiscover, getGenreList } from "@/lib/tmdb";
import { TmdbCard } from "@/components/Card";

export async function generateMetadata({ params }) {
  const isTv = params.type === "tv";
  return {
    title: `Browse ${isTv ? "TV & Web Series" : "Movies"} – MovieFlix`,
    description: `Browse the best ${isTv ? "TV shows and web series" : "movies"} on MovieFlix.`
  };
}

export default async function Browse({ params, searchParams }) {
  const { type } = params;
  if (!["movie", "tv"].includes(type)) notFound();

  const page = Number(searchParams.page) || 1;
  const genre = searchParams.genre || "";

  const [genres, discoverData] = await Promise.all([
    getGenreList(type),
    getDiscover(type, genre, page, "popularity.desc")
  ]);

  const items = discoverData.results || [];
  const totalPages = Math.min(discoverData.total_pages || 1, 500);

  const buildUrl = (targetPage = 1, targetGenre = genre) => {
    const sp = new URLSearchParams();
    if (targetGenre && targetGenre !== "all") sp.set("genre", targetGenre);
    if (targetPage > 1) sp.set("page", targetPage);
    const qs = sp.toString();
    return `/browse/${type}${qs ? `?${qs}` : ""}`;
  };

  const activeGenreName = genres.find((g) => String(g.id) === String(genre) || g.name === genre)?.name;
  const pageTitle = activeGenreName
    ? `${activeGenreName} ${type === "tv" ? "Series" : "Movies"}`
    : (type === "tv" ? "TV Shows & Series" : "Movies");

  return (
    <main className="container-page">
      <div className="page-header-block">
        <div className="page-header-text">
          <h1 className="page-title">{pageTitle}</h1>
        </div>
      </div>

      {/* Genre Filter Chips */}
      <div className="browse-filters-section">
        <div className="filter-chips-wrapper">
          <Link
            className={`filter-chip ${!genre ? "active" : ""}`}
            href={buildUrl(1, "")}
          >
            All Genres
          </Link>
          {genres.map((g) => (
            <Link
              key={g.id}
              className={`filter-chip ${String(genre) === String(g.id) ? "active" : ""}`}
              href={buildUrl(1, g.id)}
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
          <p>No titles found for this category.</p>
          <Link href={`/browse/${type}`} className="btn-primary">View All {type === "tv" ? "Series" : "Movies"}</Link>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          {page > 1 && (
            <Link className="page-btn ghost" href={buildUrl(page - 1, genre)}>
              &larr; Previous Page
            </Link>
          )}
          <span className="page-indicator">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link className="page-btn primary" href={buildUrl(page + 1, genre)}>
              Next Page &rarr;
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
