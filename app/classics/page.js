import Link from "next/link";
import { classics, poster } from "@/lib/archive";
import Card from "@/components/Card";

export const metadata = {
  title: "Free Public Domain Classics – MovieFlix",
  description: "Stream legendary classic films from the public domain archives in full."
};

export default async function Classics({ searchParams }) {
  const q = (searchParams.q || "").trim();
  const page = Number(searchParams.page) || 1;
  const { docs, total } = await classics({ q, page });
  const href = (p) => `/classics?${new URLSearchParams({ ...(q ? { q } : {}), page: p })}`;

  return (
    <main className="container-page">
      <div className="page-header-block">
        <span className="page-category-tag">Public Domain Film Archive</span>
        <h1 className="page-title">Free Vintage & Classic Films</h1>
        <p className="page-subtitle">
          Legendary historical feature films, silent cinema, film noir, and golden age masterpieces hosted by the Internet Archive.
        </p>
      </div>

      <div className="classics-search-bar">
        <form className="search-form" action="/classics" method="GET">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search classic films (e.g. Chaplin, Horror, Noir)..."
            aria-label="Search classics"
            className="search-input"
          />
        </form>
      </div>

      {docs?.length ? (
        <div className="media-grid">
          {docs.map((d) => (
            <Card
              key={d.id}
              href={`/classics/${d.id}`}
              title={d.title}
              sub={d.year || "Classic"}
              poster={poster(d.id)}
              rating="Archive"
              quality="Classic"
            />
          ))}
        </div>
      ) : (
        <div className="empty-state-box">
          <p>No classic films found. Try a different search keyword.</p>
          <Link href="/classics" className="btn-primary">View All Classics</Link>
        </div>
      )}

      {total > 24 && (
        <div className="pagination-bar">
          {page > 1 && (
            <Link className="page-btn ghost" href={href(page - 1)}>
              &larr; Previous Page
            </Link>
          )}
          <span className="page-indicator">Page {page}</span>
          {page * 24 < total && (
            <Link className="page-btn primary" href={href(page + 1)}>
              Next Page &rarr;
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
