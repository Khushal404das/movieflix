import {
  getTrending,
  getPopular,
  getByGenre,
  getTopRated,
  getAnimeDubbed,
  getKDramas
} from "@/lib/tmdb";

import NetflixBillboard from "@/components/NetflixBillboard";
import NetflixRow from "@/components/NetflixRow";
import ContinueWatching from "@/components/ContinueWatching";
import StudiosPlatformsRow from "@/components/StudiosPlatformsRow";
import AdBanner from "@/components/AdBanner";

export const revalidate = 1800; // 30 minutes dynamic caching

export const metadata = {
  title: "Watch Online – Trending Movies, TV Series & Anime",
  description: "Browse and stream trending HD movies, top TV shows, K-dramas, and dubbed anime on MovieFlix. Fast streaming with no subscription.",
  alternates: {
    canonical: "https://movieflix.stream/home",
  },
  openGraph: {
    title: "Watch Online – Trending Movies, TV Series & Anime | MovieFlix",
    description: "Browse and stream trending HD movies, top TV shows, K-dramas, and dubbed anime on MovieFlix.",
    url: "https://movieflix.stream/home",
  }
};

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
    animeTitles,
    kDramaTitles,
  ] = await Promise.all([
    getTrending("all", "day"),
    getTrending("movie", "week"),
    getTrending("tv", "week"),
    getPopular("movie"),
    getTopRated("movie"),
    getByGenre("movie", 28),
    getByGenre("movie", 878),
    getAnimeDubbed(1),
    getKDramas(1),
  ]);

  // High-res backdrop candidate list for auto-rotating Billboard spotlight (NetMirror style)
  const billboardCandidates = (trendingAll || [])
    .filter((x) => x && x.backdrop && x.title && x.overview)
    .slice(0, 6);

  const billboardItem =
    billboardCandidates[0] ||
    trendingMovies.find((x) => x.backdrop && x.overview && x.overview.length > 30) ||
    trendingAll[0];

  return (
    <div className="netflix-home-view">
      {/* 1. Giant Netflix / NetMirror Hero Billboard with auto-rotation & OTT badges */}
      {billboardItem && (
        <NetflixBillboard
          item={billboardItem}
          items={billboardCandidates.length > 0 ? billboardCandidates : [billboardItem]}
        />
      )}

      {/* 2. Main Streaming Slider Rows */}
      <div className="netflix-rows-stack">
        {/* Continue Watching (Local storage client state) */}
        <ContinueWatching />

        {/* Studios & Platforms */}
        <StudiosPlatformsRow />

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

        {/* Sponsored Mid-Page Banner */}
        <AdBanner variant="display" className="my-6" />

        {/* Popular Anime Series */}
        {animeTitles?.length > 0 && (
          <NetflixRow
            title="⚡ Popular Anime Series"
            items={animeTitles.slice(0, 15)}
            seeAllHref="/browse/tv?genre=16"
          />
        )}

        {/* K-Drama & Asian Series */}
        {kDramaTitles?.length > 0 && (
          <NetflixRow
            title="🌟 K-Drama & Asian Series"
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

        {/* Sponsored Recommended Content Grid */}
        <AdBanner variant="multiplex" className="mt-8 mb-4" />

      </div>
    </div>
  );
}
