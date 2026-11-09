import { redirect } from "next/navigation";

// The detail page is gone: opening a show goes straight to the full-screen player.
export default function TvPage({ params, searchParams }) {
  const season = Number.parseInt(searchParams?.season, 10) || 1;
  const episode = Number.parseInt(searchParams?.episode, 10) || 1;
  redirect(
    `/play?id=${encodeURIComponent(params.id)}&type=tv&season=${season}&episode=${episode}`
  );
}
