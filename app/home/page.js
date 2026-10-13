import {
  getTrending,
  getPopular,
  getByGenre,
  getTopRated,
  getDubbedHollywood,
  getSouthIndianDubbed,
  getAnimeDubbed,
  getKDramas
} from "@/lib/tmdb";
import { classics, poster } from "@/lib/archive";
import NetflixBillboard from "@/components/NetflixBillboard";
import NetflixRow from "@/components/NetflixRow";
import ContinueWatching from "@/components/ContinueWatching";
import LanguageFilterBar from "@/components/LanguageFilterBar";

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
    dubbedHollywood,
    southIndianDubbed,
    animeTitles,
    kDramaTitles,
    classicItems
  ] = await Promise.all([
    getTrending("all", "day"),
    getTrending("movie", "week"),
    getTrending("tv", "week"),
    getPopular("movie"),
    getTopRated("movie"),
    getByGenre("movie", 28),
    getByGenre("movie", 878),
    getDubbedHollywood("movie", 1),
    getSouthIndianDubbed(1),
    getAnimeDubbed(1),
    getKDramas(1),
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

      {/* 2. NetMirror Multi-Language & OTT Platform Discovery Bar */}
      <div className="home-filter-wrapper">
        <LanguageFilterBar type="movie" />
      </div>

      {/* 3. Main Streaming Slider Rows */}
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

        {/* Dual Audio & Hindi Dubbed Blockbusters (NetMirror Signature) */}
        {dubbedHollywood?.length > 0 && (
          <NetflixRow
            title="🔥 Dual Audio & Hindi Dubbed Blockbusters"
            items={dubbedHollywood.slice(0, 15)}
            seeAllHref="/browse/movie?lang=dual"
          />
        )}

        {/* Trending Now */}
        <NetflixRow
          title="Trending Now"
          items={trendingAll.slice(0, 15)}
          seeAllHref="/browse/movie"
        />

        {/* South Indian Hindi Dubbed Hits */}
        {southIndianDubbed?.length > 0 && (
          <NetflixRow
            title="🎬 South Indian Hindi Dubbed Hits"
            items={southIndianDubbed.slice(0, 15)}
            seeAllHref="/browse/movie?lang=te"
          />
        )}

        {/* Binge-worthy TV & Web Series */}
        <NetflixRow
          title="Binge-worthy TV & Web Series"
          items={trendingSeries.slice(0, 15)}
          seeAllHref="/browse/tv"
        />

        {/* Anime in Dual Audio & Dubbed */}
        {animeTitles?.length > 0 && (
          <NetflixRow
            title="⚡ Anime in Dual Audio & Dubbed"
            items={animeTitles.slice(0, 15)}
            seeAllHref="/browse/tv?lang=ja"
          />
        )}

        {/* K-Drama & Asian Series */}
        {kDramaTitles?.length > 0 && (
          <NetflixRow
            title="🌟 K-Drama & Asian Series (Multi-Audio)"
            items={kDramaTitles.slice(0, 15)}
            seeAllHref="/browse/tv?lang=ko"
          />
        )}

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

        {/* Top Rated Masterpieces */}
        <NetflixRow
          title="Critically Acclaimed & Top Rated"
          items={topRatedMovies.slice(0, 15)}
          seeAllHref="/browse/movie"
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
