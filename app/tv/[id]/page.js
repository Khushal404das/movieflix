import TitleDetail, { titleMeta } from "@/components/TitleDetail";

export const generateMetadata = ({ params }) => titleMeta("tv", params.id);

export default function TvPage({ params, searchParams }) {
  return (
    <TitleDetail
      type="tv"
      id={params.id}
      season={searchParams.season}
      episode={searchParams.episode}
    />
  );
}
