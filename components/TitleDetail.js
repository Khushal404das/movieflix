import Link from "next/link";
import { getTitle, getSeasonEpisodes, norm } from "@/lib/tmdb";
import { TmdbCard } from "./Card";
import WatchlistButton from "./WatchlistButton";
import StreamingPlayer from "./StreamingPlayer";

export default async function TitleDetail({ type = "movie", id, season = 1, episode = 1 }) {
  const d = await getTitle(type, id);
  if (!d) {
    return (
      <main className="container-page">
        <div className="empty-state-box">
          <h2>Title not found</h2>
          <p>The requested {type === "tv" ? "TV series" : "movie"} could not be loaded.</p>
          <Link href="/" className="btn-primary">Return to Home</Link>
        </div>
      </main>
    );
  }

  const t = norm(d, type);
  const seasons = (d.seasons || []).filter((s) => s.season_number > 0);
  const selectedSeason = Number(season) || (seasons[0]?.season_number || 1);
  const selectedEpisode = Number(episode) || 1;
  
  // Fetch initial season episodes for TV
  const eps = type === "tv" ? await getSeasonEpisodes(id, selectedSeason) : null;
  
  const trailerKey = t.trailer || d.videos?.results?.find((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))?.key;

  const metaItems = [
    t.year,
    t.quality,
    d.runtime && `${d.runtime} min`,
    d.number_of_seasons && `${d.number_of_seasons} Season${d.number_of_seasons > 1 ? "s" : ""}`,
    t.rating && `★ ${t.rating} TMDB`
  ].filter(Boolean);

  return (
    <div className="title-detail-view">
      {/* Background Ambience Backdrop */}
      {t.backdrop && (
        <div
          className="detail-ambient-backdrop"
          style={{ backgroundImage: `url(${t.backdrop})` }}
        />
      )}

      <div className="detail-container">
        {/* Streaming Cinema Player Section */}
        <section className="player-section-wrapper">
          <StreamingPlayer
            type={type}
            id={id}
            title={t.title}
            poster={t.poster}
            backdrop={t.backdrop}
            seasons={seasons}
            initialSeason={selectedSeason}
            initialEpisode={selectedEpisode}
            episodesData={eps?.episodes || []}
          />
        </section>

        {/* Title Information & Metadata Section */}
        <section className="detail-info-card">
          <div className="detail-flex-row">
            {t.poster && (
              <div className="detail-poster-column">
                <img src={t.poster} alt={t.title} className="detail-poster-img" />
              </div>
            )}

            <div className="detail-main-column">
              <div className="detail-meta-pills">
                <span className="type-pill">{type === "tv" ? "TV Series" : "Movie"}</span>
                {t.audioBadge && (
                  <span className="audio-meta-pill">{t.audioBadge}</span>
                )}
                {metaItems.map((m) => (
                  <span className="meta-pill" key={m}>{m}</span>
                ))}
              </div>

              <h1 className="detail-title">{t.title}</h1>
              {d.tagline && <p className="detail-tagline">&ldquo;{d.tagline}&rdquo;</p>}

              <div className="genre-tags-list">
                {(d.genres || []).map((g) => (
                  <Link key={g.id || g.name} href={`/browse/${type}?genre=${g.id || g.name}`} className="genre-tag">
                    {g.name}
                  </Link>
                ))}
              </div>

              <p className="detail-overview">{t.overview || "No synopsis available."}</p>

              <div className="detail-actions-bar">
                <WatchlistButton
                  item={{
                    href: `/${type}/${id}`,
                    title: t.title,
                    poster: t.poster,
                    rating: t.rating,
                    sub: t.year,
                    type
                  }}
                />

                <a
                  href={`https://dl.vidsrc.vip/${type}/${id}${type === "tv" ? `/${selectedSeason}/${selectedEpisode}` : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-download-detail"
                  title="Download high-speed video stream"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Download HD</span>
                </a>

                {trailerKey && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailerKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-trailer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    <span>Watch Trailer</span>
                  </a>
                )}
              </div>

              {/* Cast */}
              {d.credits?.cast?.length > 0 && (
                <div className="cast-block">
                  <h4 className="block-subheading">Starring</h4>
                  <div className="cast-chips-wrap">
                    {d.credits.cast.slice(0, 8).map((c, idx) => (
                      <span key={idx} className="cast-chip">{c.name || c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Similar / Recommended Titles */}
        {d.similar?.results?.length > 0 && (
          <section className="recommended-section">
            <h2 className="section-heading">You May Also Like</h2>
            <div className="media-grid">
              {d.similar.results.slice(0, 10).map((x) => (
                <TmdbCard key={(x.type || type) + x.id} item={norm(x, type)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export async function titleMeta(type, id) {
  const d = await getTitle(type, id);
  if (!d) return { title: "Stream Online – MovieFlix" };
  const t = norm(d, type);
  return {
    title: `Watch ${t.title} (${t.year}) Full HD – MovieFlix`,
    description: t.overview?.slice(0, 160) || `Stream ${t.title} online for free in HD quality.`,
    openGraph: {
      images: t.backdrop ? [t.backdrop] : (t.poster ? [t.poster] : [])
    }
  };
}
