import { hasKey } from "@/lib/tmdb";
export default function Setup() {
  if (hasKey()) return null;
  return (
    <div className="setup">
      <h3>Connect TMDB to load titles</h3>
      <p>Copy <code>.env.example</code> to <code>.env.local</code>, add your free <code>TMDB_API_KEY</code>, and restart the dev server. Free classics work without a key.</p>
    </div>
  );
}
