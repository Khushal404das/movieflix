import Link from "next/link";
import { notFound } from "next/navigation";
import { getDiscover, getGenreList } from "@/lib/tmdb";
import InfinitePlatformGrid from "@/components/InfinitePlatformGrid";

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

      {/* Infinite Scroll Media Grid */}
      <InfinitePlatformGrid
        initialItems={items}
        initialPage={page}
        totalPages={totalPages}
        providerId=""
        mediaType={type}
        genre={genre}
        sort="popularity.desc"
        platformId=""
      />
    </main>
  );
}
