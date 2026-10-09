import TitleDetail, { titleMeta } from "@/components/TitleDetail";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return titleMeta("tv", id);
}

export default async function TvPage({ params, searchParams }) {
  const { id } = await params;
  const { season, episode } = await searchParams;
  return <TitleDetail type="tv" id={id} season={season} episode={episode} />;
}
