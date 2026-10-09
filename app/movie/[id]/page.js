import TitleDetail, { titleMeta } from "@/components/TitleDetail";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return titleMeta("movie", id);
}

export default async function Page({ params, searchParams }) {
  const { id } = await params;
  const { season } = await searchParams;
  return <TitleDetail type="movie" id={id} season={season} />;
}
