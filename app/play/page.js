import { redirect } from "next/navigation";

export default function PlayPage({ searchParams }) {
  const id = searchParams?.id;
  const type = searchParams?.type || "movie";
  const season = searchParams?.season;
  const episode = searchParams?.episode;

  if (!id) {
    redirect("/");
  }

  if (type === "tv") {
    const s = season ? `?season=${season}&episode=${episode || 1}` : "";
    redirect(`/tv/${id}${s}`);
  }
  return redirect(`/movie/${id}`);
}
