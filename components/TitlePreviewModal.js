"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TitlePreviewModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showWatchlistToast, setShowWatchlistToast] = useState(false);
  const toastTimeoutRef = useRef(null);
  const modalContentRef = useRef(null);

  // Listen for global open preview events
  useEffect(() => {
    const handleOpen = (e) => {
      const itemData = e.detail;
      if (!itemData) return;
      setData(itemData);
      setIsOpen(true);

      // Check watchlist state
      const targetHref = itemData.href || `/${itemData.type || "movie"}/${itemData.item?.id || itemData.id}`;
      try {
        const list = JSON.parse(localStorage.getItem("rh-list") || "[]");
        setInWatchlist(list.some((x) => x.href === targetHref));
      } catch (_) {}

      // Fetch extended details (trailer, episodes, recommendations)
      const id = itemData.item?.id || itemData.id;
      const type = itemData.type || itemData.item?.type || "movie";
      if (id) {
        setIsLoading(true);
        fetch(`/api/title?type=${type}&id=${id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((resData) => {
            if (resData?.raw) {
              setDetails(resData.raw);
            }
          })
          .catch((err) => console.error("Error loading preview details:", err))
          .finally(() => setIsLoading(false));
      }
    };

    window.addEventListener("movieflix:open-preview", handleOpen);
    return () => window.removeEventListener("movieflix:open-preview", handleOpen);
  }, []);

  // Lock background scroll when modal is open & listen for Escape
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") handleClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setData(null);
    setDetails(null);
    setShowWatchlistToast(false);
  };

  const handleWatchlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!data) return;

    const targetHref = data.href || `/${data.type || "movie"}/${data.item?.id || data.id}`;
    const watchItem = {
      href: targetHref,
      title: data.title || details?.title || details?.name,
      poster: data.poster || details?.poster_path ? `https://image.tmdb.org/t/p/w500${details?.poster_path}` : null,
      type: data.type || "movie",
      rating: data.rating || details?.vote_average
    };

    try {
      const list = JSON.parse(localStorage.getItem("rh-list") || "[]");
      const exists = list.some((x) => x.href === targetHref);
      const next = exists ? list.filter((x) => x.href !== targetHref) : [watchItem, ...list];
      localStorage.setItem("rh-list", JSON.stringify(next));
      setInWatchlist(!exists);

      if (!exists) {
        // Show success toast exactly like user screenshot
        setShowWatchlistToast(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          setShowWatchlistToast(false);
        }, 3500);
      } else {
        setShowWatchlistToast(false);
      }
    } catch (_) {}
  };

  const handleLikeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked((prev) => !prev);
  };

  if (!isOpen || !data) return null;

  const title = data.title || details?.title || details?.name || "Unknown Title";
  const id = data.item?.id || data.id || "(none)";
  const type = data.type || (details?.first_air_date ? "tv" : "movie");
  const targetHref = data.href || `/${type}/${id}`;
  const backdrop = data.backdrop || (details?.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : null);
  const runtimeMin = details?.runtime || data.runtime || (details?.episode_run_time ? details.episode_run_time[0] : 116);
  
  // Format duration into HH:MM:SS format
  const hours = Math.floor(runtimeMin / 60);
  const mins = runtimeMin % 60;
  const formattedDuration = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:33`;
  
  const maturityRating = details?.adult ? "18+" : "U/A 16+";
  const matchPct = Math.round((data.rating || details?.vote_average || 8.4) * 10) + 12;
  const safeMatch = Math.min(Math.max(matchPct, 78), 99);
  const releaseYear = (details?.release_date || details?.first_air_date || data.year || "2024").toString().slice(0, 4);

  // Trailer YouTube Key if present
  const trailerVideo = details?.videos?.results?.find(
    (v) => (v.type === "Trailer" || v.type === "Teaser" || v.site === "YouTube")
  );

  const genresList = details?.genres?.map(g => g.name) || data.genres || ["Action", "Thriller", "Crime"];
  const castList = details?.credits?.cast?.slice(0, 5).map(c => c.name).join(", ") || "Rajaram, Neelaveni, Nila";
  const synopsis = details?.overview || data.overview || "Home is where the hurt is. As criminals bring violence to their door, deadly skills must be used to fight back as a family.";

  return (
    <div className="previewModal-backdrop" onClick={handleClose}>
      <div
        className="previewModal-container"
        ref={modalContentRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          className="previewModal-close"
          onClick={handleClose}
          aria-label="Close Preview"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="6" />
          </svg>
        </button>

        {/* Video Player Header Area */}
        <div className="previewModal-player-wrapper">
          {/* Background Video / Trailer or High-Res Backdrop */}
          {trailerVideo?.key ? (
            <div className="previewModal-video-frame">
              <iframe
                src={`https://www.youtube.com/embed/${trailerVideo.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailerVideo.key}&modestbranding=1&rel=0`}
                title={title}
                className="previewModal-iframe"
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            </div>
          ) : (
            <div
              className="previewModal-backdrop-img"
              style={{ backgroundImage: backdrop ? `url(${backdrop})` : "linear-gradient(135deg, #1f2937, #111827)" }}
            />
          )}

          {/* Vignette Shadow Overlay */}
          <div className="previewModal-vignette" />



          {/* WATCHLIST SUCCESS TOAST (Matches user screenshot exactly) */}
          {showWatchlistToast && (
            <div className="watchlist-toast-success animate-fade-in">
              <div className="toast-check-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="toast-text">Success! Add to Your Watchlist.</span>
            </div>
          )}

          {/* Floating Player Audio Mute Button */}
          <button
            type="button"
            className="previewModal-audio-btn"
            onClick={() => setIsMuted((prev) => !prev)}
            title={isMuted ? "Unmute" : "Mute"}
            aria-label="Toggle Sound"
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            )}
          </button>

          {/* Title Treatment and Action Controls Layer */}
          <div className="previewModal--player-titleTreatmentWrapper">
            <h2 className="previewModal-title-text">{title}</h2>

            <div className="buttonControls--container">
              {/* Play Button - White Pill with Icon */}
              <button
                type="button"
                className="color-primary hasLabel hasIcon ltr-ed00td modal-main-play"
                onClick={() => {
                  handleClose();
                  router.push(targetHref);
                }}
              >
                <div className="ltr-1ol9m1e">
                  <div className="medium ltr-1evcx25">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <div className="ltr-14rufaj" style={{ width: "0.6rem" }} />
                <span className="ltr-j0gpa2 btn-main-play">Play</span>
              </button>

              {/* Add to Watchlist Button */}
              <button
                type="button"
                className={`previewModal-icon-btn ${inWatchlist ? "active" : ""}`}
                onClick={handleWatchlistToggle}
                title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                aria-label="Add to Watchlist"
              >
                {inWatchlist ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>

              {/* Like / Thumb Button */}
              <button
                type="button"
                className={`previewModal-icon-btn ${isLiked ? "active" : ""}`}
                onClick={handleLikeToggle}
                title="I like this"
                aria-label="Rate title"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </button>


            </div>
          </div>
        </div>

        {/* Modal Body: Information, Synopsis, Cast, Recommendations */}
        <div className="previewModal-body">
          <div className="previewModal-meta-split">
            {/* Left Column: Metadata & Synopsis */}
            <div className="previewModal-left-col">
              <div className="previewModal-tags-row">
                <span className="meta-match">{safeMatch}% Match</span>
                <span className="meta-year">{releaseYear}</span>
                <span className="meta-maturity-badge">{maturityRating}</span>
                <span className="meta-runtime">
                  {type === "tv"
                    ? `${details?.number_of_seasons || 1} Season${(details?.number_of_seasons || 1) > 1 ? "s" : ""}`
                    : `${hours}h ${mins}m`}
                </span>
                <span className="meta-badge-hd">HD</span>
                <span className="meta-badge-audio">5.1</span>
              </div>

              <div className="previewModal-synopsis">
                <p>{synopsis}</p>
              </div>
            </div>

            {/* Right Column: Cast, Genres, Tags */}
            <div className="previewModal-right-col">
              <div className="previewModal-detail-group">
                <span className="detail-label">Cast: </span>
                <span className="detail-value">{castList}</span>
              </div>

              <div className="previewModal-detail-group">
                <span className="detail-label">Genres: </span>
                <span className="detail-value">{genresList.slice(0, 4).join(", ")}</span>
              </div>

              <div className="previewModal-detail-group">
                <span className="detail-label">This show is: </span>
                <span className="detail-value">Suspenseful, Gritty, Exciting</span>
              </div>
            </div>
          </div>

          {/* Similar / More Like This Grid */}
          {details?.recommendations?.results?.length > 0 && (
            <div className="previewModal-more-like-this">
              <h3 className="section-title">More Like This</h3>
              <div className="more-like-grid">
                {details.recommendations.results.slice(0, 6).map((rec) => (
                  <div
                    key={rec.id}
                    className="more-card"
                    onClick={() => {
                      handleClose();
                      router.push(`/${type}/${rec.id}`);
                    }}
                  >
                    <div className="more-card-img-wrap">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${rec.backdrop_path || rec.poster_path}`}
                        alt={rec.title || rec.name}
                        className="more-card-img"
                        loading="lazy"
                      />
                      <span className="more-card-duration">
                        {rec.first_air_date ? "Series" : "1h 48m"}
                      </span>
                    </div>
                    <div className="more-card-info">
                      <div className="more-card-title">{rec.title || rec.name}</div>
                      <p className="more-card-desc">
                        {rec.overview?.substring(0, 95)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer / About */}
          <div className="previewModal-about">
            <h3 className="about-title">About <strong>{title}</strong></h3>
            <p className="about-text">
              <span>Streaming Host: </span> <code>stream.movieflix.cc</code> • Protocol: <code>HLS (hlsjs)</code> • Full HD 1080p Cinema Audio 5.1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
