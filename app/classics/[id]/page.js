import { notFound } from "next/navigation";
import Link from "next/link";
import { film, poster } from "@/lib/archive";
import WatchlistButton from "@/components/WatchlistButton";
import CinemaPlayer from "@/components/CinemaPlayer";

export async function generateMetadata({ params }) {
  const f = await film(params.id);
  return {
    title: f ? `${f.title} – Stream Classic – MovieFlix` : "Classic Movie – MovieFlix",
    description: f?.description?.slice(0, 160) || "Watch free classic public domain films in full length."
  };
}

export default async function Player({ params }) {
  const f = await film(params.id);
  if (!f) notFound();

  return (
    <div className="title-detail-view">
      <div className="detail-container">
        <div className="player-wrapper">
          <div className="player-topbar">
            <div className="player-topbar-left">
              <Link href="/home" className="player-back-nav-btn" title="Return to Home">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span className="player-back-text">Home</span>
              </Link>
              <div className="player-badge">
                <span className="live-dot" />
                <b>{f.title}</b>
                <span className="res-badge">Public Domain</span>
              </div>
            </div>
            <div className="player-actions">
              <Link href="/home" className="player-close-action-btn" title="Close to Home" aria-label="Close to Home">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </Link>
            </div>
          </div>

          <div className="player-screen-container">
            {f.src ? (
              <CinemaPlayer
                src={f.src}
                title={f.title}
                poster={poster(f.id)}
                mimeType="mp4"
              />
            ) : (
              <div className="player-buffering-overlay">
                <div className="stream-spinner" />
                <span className="buffering-text">No playable file found for this title.</span>
                <span className="buffering-subtext">Try another public-domain classic.</span>
              </div>
            )}
          </div>
        </div>

        <section className="detail-info-card">
          <div className="detail-main-column">
            <div className="detail-meta-pills">
              <span className="type-pill">Public Domain Classic</span>
              {f.year && <span className="meta-pill">{f.year}</span>}
              <span className="meta-pill">Free Archive</span>
            </div>

            <h1 className="detail-title">{f.title}</h1>
            <p className="detail-overview">{f.description || "No description available for this historic film."}</p>

            <div className="detail-actions-bar">
              <WatchlistButton
                item={{
                  href: `/classics/${f.id}`,
                  title: f.title,
                  sub: f.year,
                  type: "movie"
                }}
              />
              <a
                href={`https://archive.org/details/${f.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-trailer"
              >
                <span>View on Internet Archive ↗</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
