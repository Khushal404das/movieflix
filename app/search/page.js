import Link from "next/link";
import { searchTitles, getTrending } from "@/lib/tmdb";
import { TmdbCard } from "@/components/Card";

export async function generateMetadata({ searchParams }) {
  const q = searchParams.q?.trim() || "";
  return {
    title: q ? `Search results for "${q}" – MovieFlix` : "Search Movies & Series – MovieFlix",
    description: `Search across our entire library of movies, anime, and web series.`
  };
}

export default async function Search({ searchParams }) {
  const q = (searchParams.q || "").trim();
  const [items, trending] = await Promise.all([
    q ? searchTitles(q) : Promise.resolve([]),
    getTrending("all")
  ]);

  return (
    <main className="container-page">
      <div className="search-page-header">
        <h1 className="page-title">
          {q ? `Search results for "${q}"` : "Search Cinema & Series"}
        </h1>
        <p className="page-subtitle">
          {q ? `Found ${items.length} title${items.length === 1 ? '' : 's'} matching your search.` : "Search by movie name, web series title, or actors."}
        </p>
      </div>

      {q ? (
        items.length > 0 ? (
          <div className="media-grid">
            {items.map((item) => (
              <TmdbCard key={(item.type || "m") + item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="empty-state-box">
            <div className="empty-icon">🔍</div>
            <h3>No titles found matching &ldquo;{q}&rdquo;</h3>
            <p>Check the spelling or try searching for another popular movie or web series.</p>
            <div className="empty-suggestions">
              <span>Popular searches:</span>
              <div className="chips-row">
                <Link className="filter-chip" href="/search?q=Deadpool">Deadpool</Link>
                <Link className="filter-chip" href="/search?q=Stranger Things">Stranger Things</Link>
                <Link className="filter-chip" href="/search?q=Dune">Dune</Link>
                <Link className="filter-chip" href="/search?q=Oppenheimer">Oppenheimer</Link>
                <Link className="filter-chip" href="/search?q=Fallout">Fallout</Link>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="search-idle-section">
          <div className="search-idle-hero">
            <form action="/search" method="GET" className="big-search-form">
              <input
                type="search"
                name="q"
                placeholder="Type movie or TV series name..."
                className="big-search-input"
                autoFocus
              />
              <button type="submit" className="big-search-btn">Search</button>
            </form>
          </div>

          <div className="trending-suggestions-block">
            <h2 className="section-heading">Trending Right Now</h2>
            <div className="media-grid">
              {trending.slice(0, 8).map((t) => (
                <TmdbCard key={(t.type || "m") + t.id} item={t} />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
