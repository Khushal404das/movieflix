import { notFound } from "next/navigation";
import Link from "next/link";
import { film } from "@/lib/archive";
import WatchlistButton from "@/components/WatchlistButton";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const f = await film(id);
  return {
    title: f ? `${f.title} – Stream Classic – ReelStream` : "Classic Movie – ReelStream",
    description: f?.description?.slice(0, 160) || "Watch free classic public domain films in full length."
  };
}

export default async function Player({ params }) {
  const { id } = await params;
  const f = await film(id);
  if (!f) notFound();

  return (
    <div className="title-detail-view">
      <div className="detail-container">
        <div className="player-wrapper">
          <div className="player-topbar">
            <div className="player-badge">
              <span className="live-dot" />
              <b>Archive Classic Stream</b>
              <span className="res-badge">Public Domain</span>
            </div>
          </div>
          <div className="player-screen-container">
            <iframe
              className="streaming-iframe"
              src={`https://archive.org/embed/${encodeURIComponent(f.id)}`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={f.title}
            />
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
