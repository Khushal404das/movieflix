import { notFound, redirect } from "next/navigation";
import { getTitle } from "@/lib/tmdb";
import { titleMetadata, playPath } from "@/lib/seo";
import { cameFromInsideSite } from "@/lib/fromSite";
import TitlePage from "@/components/TitlePage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const d = await getTitle("tv", params.id);
  if (!d) return { title: "Series not found", robots: { index: false } };
  return titleMetadata("tv", d);
}

// Clicks inside the site open the player directly; everyone else (search
// engines, visitors from Google) sees the show's page with its seasons.
export default async function TvPage({ params, searchParams }) {
  if (cameFromInsideSite()) {
    const season = Number.parseInt(searchParams?.season, 10) || 1;
    const episode = Number.parseInt(searchParams?.episode, 10) || 1;
    redirect(playPath("tv", params.id, season, episode));
  }

  const d = await getTitle("tv", params.id);
  if (!d) notFound();
  return <TitlePage type="tv" d={d} />;
}
