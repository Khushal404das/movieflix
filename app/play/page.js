import { redirect } from "next/navigation";
import CinemaPlayPage from "@/components/CinemaPlayPage";
import { tmdb, img } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

// The full-screen player is not a page for search results: the title pages
// (/movie/[id], /tv/[id]) are. Crawlers may follow its links.
export const metadata = {
  title: "Now Playing",
  robots: { index: false, follow: true },
};

export default async function PlayPage({ searchParams }) {
  const id = searchParams?.id;
  const type = searchParams?.type || "movie";
  const season = searchParams?.season;
  const episode = searchParams?.episode;
  let title = searchParams?.title || "";
  let poster = searchParams?.poster || "";
  let backdrop = searchParams?.backdrop || "";

  if (!id) {
    redirect("/");
  }

  // Most links only pass the id. Look up the name and poster so the title
  // can be saved to Continue Watching (cached for 30 minutes by tmdb()).
  if (!title || !poster) {
    const info = await tmdb(`/${type === "tv" ? "tv" : "movie"}/${encodeURIComponent(id)}`);
    if (info) {
      title = title || info.title || info.name || "";
      poster = poster || img(info.poster_path, "w500") || "";
      backdrop = backdrop || img(info.backdrop_path, "w1280") || "";
    }
  }

  return (
    <CinemaPlayPage
      id={id}
      type={type}
      season={season}
      episode={episode}
      title={title}
      poster={poster}
      backdrop={backdrop}
    />
  );
}
