import { redirect } from "next/navigation";
import CinemaPlayPage from "@/components/CinemaPlayPage";

export const dynamic = "force-dynamic";

export default function PlayPage({ searchParams }) {
  const id = searchParams?.id;
  const type = searchParams?.type || "movie";
  const season = searchParams?.season;
  const episode = searchParams?.episode;
  const title = searchParams?.title || "";
  const poster = searchParams?.poster || "";
  const backdrop = searchParams?.backdrop || "";

  if (!id) {
    redirect("/");
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
