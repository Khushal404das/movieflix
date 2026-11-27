import { notFound, redirect } from "next/navigation";
import { getTitle } from "@/lib/tmdb";
import { titleMetadata, playPath } from "@/lib/seo";
import { cameFromInsideSite } from "@/lib/fromSite";
import TitlePage from "@/components/TitlePage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const d = await getTitle("movie", params.id);
  if (!d) return { title: "Movie not found", robots: { index: false } };
  return titleMetadata("movie", d);
}

// Clicks inside the site open the player directly; everyone else (search
// engines, visitors from Google) sees the movie's page with a Play button.
export default async function MoviePage({ params }) {
  if (cameFromInsideSite()) redirect(playPath("movie", params.id));

  const d = await getTitle("movie", params.id);
  if (!d) notFound();
  return <TitlePage type="movie" d={d} />;
}
