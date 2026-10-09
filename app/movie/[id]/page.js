import TitleDetail, { titleMeta } from "@/components/TitleDetail";
export const generateMetadata = ({ params }) => titleMeta("movie", params.id);
export default function Page({ params, searchParams }) {
  return <TitleDetail type="movie" id={params.id} season={searchParams.season} />;
}
