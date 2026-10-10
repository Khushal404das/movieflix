import {
  getTrending,
  getPopular,
  getByGenre,
  getTopRated
} from "@/lib/tmdb";
import { classics, poster } from "@/lib/archive";
import NetflixBillboard from "@/components/NetflixBillboard";
import NetflixRow from "@/components/NetflixRow";
import ContinueWatching from "@/components/ContinueWatching";

export const revalidate = 1800; // 30 minutes dynamic caching

export default async function StreamingHome() {
  // Fetch real dynamic categories concurrently from TMDB
  const [
    trendingAll,
    trendingMovies,
    trendingSeries,
    popularMovies,
    topRatedMovies,
    actionMovies,
    sciFiMovies,
    animationTitles,
    horrorTitles,
    comedyTitles,
    classicItems
  ] = await Promise.all([
    getTrending("all", "day"),
    getTrending("movie", "week"),
    getTrending("tv", "week"),
    getPopular("movie"),
    getTopRated("movie"),
    getByGenre("movie", 28),
    getByGenre("movie", 878),
    getByGenre("movie", 16),
    getByGenre("movie", 27),
    getByGenre("movie", 35),
    classics()
  ]);

  // High-res backdrop candidate for the Billboard spotlight
  const billboardItem =
    trendingMovies.find((x) => x.backdrop && x.overview && x.overview.length > 30) ||
    trendingAll.find((x) => x.backdrop && x.overview) ||
    trendingMovies[0] ||
    trendingAll[0];

  return (
    <div className="netflix-home-view">
      {/* 1. Giant Netflix / Prime Hero Billboard */}
      {billboardItem && <NetflixBillboard item={billboardItem} />}

      {/* 2. Netflix Main Slider Rows */}
      <div className="netflix-rows-stack">
        {/* Continue Watching (Local storage client state) */}
        <ContinueWatching />

        {/* Top 10 Movies Today (Iconic Netflix Giant Numbers) */}
        <NetflixRow
          title="Top 10 Movies Today"
          items={trendingMovies.slice(0, 10)}
          isTop10={true}
          seeAllHref="/browse/movie"
        />

        {/* Trending Now */}
        <NetflixRow
          title="Trending Now"
          items={trendingAll.slice(0, 15)}
          seeAllHref="/browse/movie"
        />

        {/* Binge-worthy TV & Web Series */}
        <NetflixRow
          title="Binge-worthy TV & Web Series"
          items={trendingSeries.slice(0, 15)}
          seeAllHref="/browse/tv"
        />

        {/* Popular on Prime & Netflix */}
        <NetflixRow
          title="Blockbuster Movies"
          items={popularMovies.slice(0, 15)}
          seeAllHref="/browse/movie"
        />

        {/* Action & Adventure Thrillers */}
        <NetflixRow
          title="Action & Adrenaline"
          items={actionMovies.slice(0, 15)}
          seeAllHref="/browse/movie?genre=28"
        />

        {/* Sci-Fi & Cyberpunk Hits */}
        <NetflixRow
          title="Sci-Fi & Futuristic Worlds"
          items={sciFiMovies.slice(0, 15)}
          seeAllHref="/browse/movie?genre=878"
        />

        {/* Animation & Anime */}
        <NetflixRow
          title="Animation & Anime Favorites"
          items={animationTitles.slice(0, 15)}
          seeAllHref="/browse/movie?genre=16"
        />

        {/* Top Rated Masterpieces */}
        <NetflixRow
          title="Critically Acclaimed & Top Rated"
          items={topRatedMovies.slice(0, 15)}
          seeAllHref="/browse/movie"
        />

        {/* Comedy */}
        <NetflixRow
          title="Laugh-Out-Loud Comedies"
          items={comedyTitles.slice(0, 15)}
          seeAllHref="/browse/movie?genre=35"
        />

        {/* Horror & Suspense */}
        <NetflixRow
          title="Horror & Chilling Suspense"
          items={horrorTitles.slice(0, 15)}
          seeAllHref="/browse/movie?genre=27"
        />

        {/* Free Public Domain Classics */}
        {classicItems?.docs?.length > 0 && (
          <NetflixRow
            title="Public Domain Cinema & Golden Classics"
            items={classicItems.docs.slice(0, 12).map((d) => ({
              id: d.id,
              type: "classics",
              title: d.title,
              year: d.year || "Classic",
              rating: "Vintage",
              poster: poster(d.id),
              quality: "Archive"
            }))}
            seeAllHref="/classics"
          />
        )}
      </div>
    </div>
  );
}
