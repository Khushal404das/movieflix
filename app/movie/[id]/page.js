import { redirect } from "next/navigation";

// The detail page is gone: opening a movie goes straight to the full-screen player.
export default function Page({ params }) {
  redirect(`/play?id=${encodeURIComponent(params.id)}&type=movie`);
}
