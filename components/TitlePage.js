import Link from "next/link";
import { img } from "@/lib/tmdb";
import { titleJsonLd, jsonLdString, titlePath, playPath } from "@/lib/seo";

// Server-rendered page about one movie or TV show: what search engines and
// visitors arriving from search see at /movie/[id] and /tv/[id]. Clicks
// inside the site still go straight to the player (see app/movie/[id]/page.js).

function formatDate(s) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function hoursMinutes(min) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function TitlePage({ type, d }) {
  const isTv = type === "tv";
  const name = d.title || d.name || "Untitled";
  const year = (d.release_date || d.first_air_date || "").slice(0, 4);
  const poster = img(d.poster_path, "w500");
  const backdrop = img(d.backdrop_path, "w1280");
  const genres = d.genres || [];
  const cast = (d.credits?.cast || []).slice(0, 12);
  const directors = (d.credits?.crew || []).filter((c) => c.job === "Director").slice(0, 3);
  const creators = (d.created_by || []).slice(0, 3);
  const seasons = (d.seasons || []).filter((s) => s.season_number > 0);
  const trailer = d.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer");
  const related = [...(d.recommendations?.results || []), ...(d.similar?.results || [])]
    .filter((x, i, all) => x.poster_path && all.findIndex((y) => y.id === x.id) === i)
    .slice(0, 12);
  const rating = d.vote_count > 0 && d.vote_average > 0 ? Number(d.vote_average).toFixed(1) : null;

  const facts = [
    [isTv ? "First aired" : "Release date", formatDate(isTv ? d.first_air_date : d.release_date)],
    !isTv && ["Runtime", hoursMinutes(d.runtime)],
    isTv && ["Seasons", d.number_of_seasons],
    isTv && ["Episodes", d.number_of_episodes],
    ["Genres", genres.map((g) => g.name).join(", ")],
    ["Original language", d.spoken_languages?.find((l) => l.iso_639_1 === d.original_language)?.english_name],
    directors.length > 0 && ["Director", directors.map((c) => c.name).join(", ")],
    creators.length > 0 && ["Created by", creators.map((c) => c.name).join(", ")],
    rating && ["Rating", `${rating}/10 from ${d.vote_count.toLocaleString("en-US")} votes (TMDB)`],
    isTv && d.status && ["Status", d.status],
  ].filter((f) => f && f[1]);

  return (
    <main className="tp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(titleJsonLd(type, d)) }} />

      {backdrop && <div className="tp-backdrop" style={{ backgroundImage: `url(${backdrop})` }} aria-hidden="true" />}

      <nav className="tp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/home">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/browse/${isTv ? "tv" : "movie"}`}>{isTv ? "TV Shows" : "Movies"}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{name}</span>
      </nav>

      <section className="tp-hero">
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="tp-poster" src={poster} alt={`${name} poster`} width={300} height={450} />
        )}

        <div className="tp-main">
          <h1 className="tp-title">
            {name} {year && <span className="tp-year">({year})</span>}
          </h1>
          {d.tagline && <p className="tp-tagline">{d.tagline}</p>}

          <div className="tp-badges">
            <span>{isTv ? "TV Series" : "Movie"}</span>
            {rating && <span>★ {rating}</span>}
            {!isTv && d.runtime > 0 && <span>{hoursMinutes(d.runtime)}</span>}
            {isTv && d.number_of_seasons > 0 && (
              <span>
                {d.number_of_seasons} season{d.number_of_seasons > 1 ? "s" : ""}
              </span>
            )}
            {genres.slice(0, 3).map((g) => (
              <span key={g.id}>{g.name}</span>
            ))}
          </div>

          <div className="tp-actions">
            <Link href={playPath(type, d.id, 1, 1)} className="tp-play">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              {isTv ? "Play S1 E1" : "Play"}
            </Link>
            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tp-secondary"
              >
                Watch trailer
              </a>
            )}
          </div>

          <h2 className="tp-h2">Overview</h2>
          <p className="tp-overview">{d.overview || "No description is available for this title yet."}</p>

          <dl className="tp-facts">
            {facts.map(([label, value]) => (
              <div key={label} className="tp-fact">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {cast.length > 0 && (
        <section className="tp-section">
          <h2 className="tp-h2">Cast</h2>
          <ul className="tp-cast">
            {cast.map((c) => (
              <li key={c.credit_id || c.id}>
                <strong>{c.name}</strong>
                {c.character && <span>{c.character}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {isTv && seasons.length > 0 && (
        <section className="tp-section">
          <h2 className="tp-h2">Seasons</h2>
          <ul className="tp-seasons">
            {seasons.map((s) => (
              <li key={s.id || s.season_number}>
                <Link href={playPath(type, d.id, s.season_number, 1)}>
                  <strong>{s.name || `Season ${s.season_number}`}</strong>
                  <span>
                    {s.episode_count ? `${s.episode_count} episodes` : ""}
                    {s.air_date ? ` · ${s.air_date.slice(0, 4)}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="tp-section">
          <h2 className="tp-h2">More like {name}</h2>
          <ul className="tp-related">
            {related.map((r) => {
              const rType = r.media_type === "tv" || (!r.media_type && isTv) ? "tv" : "movie";
              const rName = r.title || r.name;
              return (
                <li key={r.id}>
                  <Link href={titlePath(rType, r.id)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img(r.poster_path, "w342")} alt={`${rName} poster`} width={171} height={256} loading="lazy" />
                    <span>{rName}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
