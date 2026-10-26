import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDiscover, getGenreList } from "@/lib/tmdb";
import PlatformPageClient from "./PlatformPageClient";
import InfinitePlatformGrid from "@/components/InfinitePlatformGrid";

// TMDB watch provider IDs & brand info
const PLATFORM_MAP = {
  netflix:    { id: 8,    name: "Netflix",       logo: "/platform/Logonetflix.svg",           bg: "rgb(184,29,36)",   logoFilter: "" },
  prime:      { id: 9,    name: "Amazon Prime Video", logo: "/platform/Amazon_Prime_Video_logo.svg", bg: "rgb(15,61,92)",  logoFilter: "" },
  amc:        { id: 526,  name: "AMC+",           logo: "/platform/amc.svg",                  bg: "rgb(58,44,22)",    logoFilter: "" },
  appletv:    { id: 350,  name: "Apple TV+",      logo: "/platform/Apple_TV_logo.svg",         bg: "rgb(28,28,30)",    logoFilter: "brightness(0) invert(1)" },
  crunchyroll:{ id: 283,  name: "Crunchyroll",    logo: "/platform/crunchyroll.svg",           bg: "rgb(122,52,16)",   logoFilter: "" },
  disney:     { id: 337,  name: "Disney+",        logo: "/platform/Disney_logo.svg",           bg: "rgb(26,77,184)",   logoFilter: "" },
  hulu:       { id: 15,   name: "Hulu",           logo: "/platform/Hulu_logo_(2018).svg",      bg: "rgb(12,61,44)",    logoFilter: "" },
  hbo:        { id: 1899, name: "HBO Max",        logo: "/platform/hbo-logo.svg",              bg: "rgb(74,26,120)",   logoFilter: "" },
  mgm:        { id: 34,   name: "MGM+",           logo: "/platform/mgm-logo.svg",              bg: "rgb(61,50,20)",    logoFilter: "" },
  paramount:  { id: 2303, name: "Paramount+",     logo: "/platform/Paramount-_logo.svg",       bg: "rgb(10,58,122)",   logoFilter: "" },
  peacock:    { id: 387,  name: "Peacock",        logo: "/platform/peacock.svg",               bg: "rgb(18,38,28)",    logoFilter: "" },
  shudder:    { id: 99,   name: "Shudder",        logo: "/platform/shudder.svg",               bg: "rgb(92,16,20)",    logoFilter: "" },
};

// Also allow numeric IDs directly
const ID_TO_KEY = Object.fromEntries(
  Object.entries(PLATFORM_MAP).map(([k, v]) => [String(v.id), k])
);

export async function generateMetadata({ params, searchParams }) {
  const key = ID_TO_KEY[params.id] || params.id;
  const platform = PLATFORM_MAP[key];
  if (!platform) return { title: "Platform – MovieFlix" };
  const mediaType = searchParams?.media === "tv" ? "TV Shows" : "Movies";
  return {
    title: `${platform.name} — ${mediaType} | MovieFlix`,
    description: `Browse ${mediaType} available on ${platform.name} on MovieFlix.`,
  };
}

export default async function PlatformPage({ params, searchParams }) {
  const key = ID_TO_KEY[params.id] || params.id;
  const platform = PLATFORM_MAP[key];
  if (!platform) notFound();

  const mediaType = searchParams?.media === "tv" ? "tv" : "movie";
  const genre     = searchParams?.genre  || "";
  const sort      = searchParams?.sort   || "popularity.desc";
  const page      = Number(searchParams?.page) || 1;

  const [genres, discoverData] = await Promise.all([
    getGenreList(mediaType),
    getDiscover(mediaType, genre, page, sort, "", String(platform.id)),
  ]);

  const items      = discoverData.results || [];
  const totalPages = Math.min(discoverData.total_pages || 1, 500);

  const SORT_OPTIONS = [
    { value: "popularity.desc",     label: "Most popular" },
    { value: "vote_average.desc",   label: "Highest rated" },
    { value: "primary_release_date.desc", label: "Newest first" },
    { value: "primary_release_date.asc",  label: "Oldest first" },
  ];

  return (
    <main className="platform-page">
      {/* ── Header ── */}
      <div className="platform-page-header">
        <div
          className="platform-logo-badge"
          style={{
            background: `linear-gradient(145deg, ${platform.bg} 0%, color-mix(in srgb, ${platform.bg} 60%, #050505 40%) 100%)`,
          }}
        >
          <Image
            src={platform.logo}
            alt={platform.name}
            width={80}
            height={40}
            className="platform-badge-img"
            style={{ filter: platform.logoFilter || undefined }}
            unoptimized
          />
        </div>
        <div className="platform-page-header-text">
          <p className="platform-page-eyebrow">
            {mediaType === "tv" ? "TV CATALOG" : "MOVIE CATALOG"}
          </p>
          <h1 className="platform-page-title">
            {platform.name} — {mediaType === "tv" ? "TV Shows" : "Movies"}
          </h1>
          <p className="platform-page-subtitle">
            {mediaType === "tv" ? "TV shows" : "Movies"} that list this provider in the catalog.
          </p>
        </div>
      </div>

      {/* ── Filter Bar (client) ── */}
      <PlatformPageClient
        platformId={params.id}
        currentMedia={mediaType}
        currentSort={sort}
        currentGenre={genre}
        genres={genres}
        sortOptions={SORT_OPTIONS}
        platformName={platform.name}
      />

      {/* ── Infinite Scroll Grid ── */}
      <InfinitePlatformGrid
        initialItems={items}
        initialPage={page}
        totalPages={totalPages}
        providerId={platform.id}
        mediaType={mediaType}
        genre={genre}
        sort={sort}
        platformId={params.id}
      />
    </main>
  );
}
