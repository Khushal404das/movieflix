"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const AUDIO_LANGUAGES = [
  "Czech", "German", "English", "Spanish", "French", "Hindi",
  "Hungarian", "Indonesian", "Italian", "Japanese", "Polish"
];

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
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [activeAudioLang, setActiveAudioLang] = useState("English");
  
  const toastTimeoutRef = useRef(null);
  const modalContentRef = useRef(null);

  // Listen for global open preview events
  useEffect(() => {
    const handleOpen = (e) => {
      const itemData = e.detail;
      if (!itemData) return;
      setData(itemData);
      setIsOpen(true);
      setSelectedSeason(1);
      setEpisodes([]);

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

        // If it is a TV series, fetch Season 1 episodes immediately
        if (type === "tv") {
          setIsLoadingEpisodes(true);
          fetch(`/api/episodes?id=${id}&season=1`)
            .then((res) => (res.ok ? res.json() : null))
            .then((epData) => {
              if (epData?.episodes) {
                setEpisodes(epData.episodes);
              }
            })
            .catch((err) => console.error("Error loading season episodes:", err))
            .finally(() => setIsLoadingEpisodes(false));
        }
      }
    };

    window.addEventListener("movieflix:open-preview", handleOpen);
    return () => window.removeEventListener("movieflix:open-preview", handleOpen);
  }, []);

  // Fetch episodes when season selection changes
  const handleSeasonChange = (seasonNum) => {
    const sNum = Number(seasonNum);
    setSelectedSeason(sNum);
    const id = data?.item?.id || data?.id;
    if (!id) return;
    setIsLoadingEpisodes(true);
    fetch(`/api/episodes?id=${id}&season=${sNum}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((epData) => {
        if (epData?.episodes) {
          setEpisodes(epData.episodes);
        }
      })
      .catch((err) => console.error("Error loading season episodes:", err))
      .finally(() => setIsLoadingEpisodes(false));
  };

  const handleClose = () => {
    setIsOpen(false);
    setData(null);
    setDetails(null);
    setEpisodes([]);
  };

  // Keyboard navigation
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
    }
  }, [isOpen]);

  // Click outside to dismiss
  const handleBackdropClick = (e) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
      handleClose();
    }
  };

  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    if (!data) return;
    const targetHref = data.href || `/${data.type || "movie"}/${data.item?.id || data.id}`;
    try {
      const list = JSON.parse(localStorage.getItem("rh-list") || "[]");
      const exists = list.some((x) => x.href === targetHref);
      let updated;
      if (exists) {
        updated = list.filter((x) => x.href !== targetHref);
        setInWatchlist(false);
      } else {
        updated = [
          {
            href: targetHref,
            title: data.title,
            poster: data.poster,
            rating: data.rating,
            type: data.type || "movie",
            year: data.sub
          },
          ...list
        ];
        setInWatchlist(true);
        setShowWatchlistToast(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          setShowWatchlistToast(false);
        }, 3200);
      }
      localStorage.setItem("rh-list", JSON.stringify(updated));
    } catch (_) {}
  };

  const handleLikeToggle = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  if (!isOpen || !data) return null;

  const id = data.item?.id || data.id;
  const type = data.type || data.item?.type || "movie";
  const title = data.title || details?.title || details?.name || "Untitled";
  const backdrop = details?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
    : data.backdrop || data.poster;
  const rating = data.rating || details?.vote_average || "7.6";
  const safeRating = parseFloat(rating);
  const safeMatch = !isNaN(safeRating) && safeRating > 0
    ? Math.min(99, Math.max(65, Math.round(safeRating * 10 + 6)))
    : 85;

  const releaseDate = details?.release_date || details?.first_air_date || data.sub || "";
  const releaseYear = releaseDate ? releaseDate.substring(0, 4) : "2024";

  const runtimeMinutes = details?.runtime || details?.episode_run_time?.[0] || 108;
  const hours = Math.floor(runtimeMinutes / 60);
  const mins = runtimeMinutes % 60;
  const formattedDuration = `${hours > 0 ? `${hours}h ` : ""}${mins}m`;

  const synopsis =
    details?.overview ||
    data.item?.overview ||
    "A gripping story unfolds as secret desires, hidden truths, and rivalries clash against the backdrop of high society.";

  const maturityRating = safeRating >= 8.0 ? "A 18+" : safeRating >= 7.0 ? "U/A 16+" : "U/A 13+";

  const castList =
    details?.credits?.cast
      ?.slice(0, 5)
      .map((c) => c.name)
      .join(", ") || "Leading Ensemble, Renowned Cast";

  const genresList =
    details?.genres?.map((g) => g.name) ||
    data.genres ||
    ["Drama", "Romance", "Period Piece"];

  const trailerVideo = details?.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );

  const targetHref = `/${type}/${id}`;

  const availableSeasons = (details?.seasons || []).filter(
    (s) => s.season_number > 0
  );

  return (
    <div className="previewModal-backdrop animate-fade-in" onClick={handleBackdropClick}>
      <div className="previewModal-container animate-scale-up" ref={modalContentRef}>
        {/* Floating Close Button */}
        <button
          type="button"
          className="previewModal-close"
          onClick={handleClose}
          aria-label="Close preview modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Video / Backdrop Player Header Box */}
        <div className="previewModal-player-wrapper">
          {trailerVideo && !isMuted ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerVideo.key}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&loop=1&playlist=${trailerVideo.key}`}
              className="previewModal-video-frame"
              allow="autoplay; encrypted-media"
              title={title}
            />
          ) : (
            <div
              className="previewModal-backdrop-img"
              style={{
                backgroundImage: `url(${backdrop})`
              }}
            />
          )}

          {/* Vignette Shadow Overlay */}
          <div className="previewModal-vignette" />

          {/* WATCHLIST SUCCESS TOAST */}
          {showWatchlistToast && (
            <div className="watchlist-toast-success animate-fade-in">
              <div className="toast-check-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="toast-text">Success! Added to Your Watchlist.</span>
            </div>
          )}

          {/* Floating Player Audio Mute Button */}
          {trailerVideo && (
            <button
              type="button"
              className="previewModal-audio-btn"
              onClick={() => setIsMuted((prev) => !prev)}
              title={isMuted ? "Unmute Trailer" : "Mute Trailer"}
              aria-label="Toggle Sound"
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              )}
            </button>
          )}

          {/* Title Treatment and Action Controls Layer */}
          <div className="previewModal--player-titleTreatmentWrapper">
            <h2 className="previewModal-title-text">{title}</h2>

            <div className="buttonControls--container">
              {/* Play Button - White Pill with Icon */}
              <button
                type="button"
                className="modal-main-play"
                onClick={() => {
                  handleClose();
                  router.push(targetHref);
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span className="btn-main-play">Play</span>
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

        {/* Modal Body: Information, Synopsis, Cast, Audio Bar, Episodes, Recommendations */}
        <div className="previewModal-body">
          <div className="previewModal-meta-split">
            {/* Left Column: Metadata & Synopsis */}
            <div className="previewModal-left-col">
              <div className="previewModal-tags-row">
                <span className="meta-match">{safeMatch}% Match</span>
                <span className="meta-year">{releaseYear}</span>
                <span className="meta-runtime">
                  {type === "tv"
                    ? `${details?.number_of_seasons || data.item?.number_of_seasons || 1} Season${(details?.number_of_seasons || 1) > 1 ? "s" : ""}`
                    : formattedDuration}
                </span>
                <span className="meta-badge-hd">HD</span>
                <span className="meta-maturity-badge">{maturityRating}</span>
              </div>

              <div className="previewModal-synopsis">
                <p>{synopsis}</p>
              </div>
            </div>

            {/* Right Column: Cast, Genres, Mood tags */}
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
                <span className="detail-value">Romantic, Witty, Emotional, Period Piece</span>
              </div>
            </div>
          </div>

          {/* Audio Languages Selector Bar (NetMirror / Netflix style) */}
          <div className="previewModal-audio-bar">
            <span className="audio-bar-label">Available Audio:</span>
            <div className="audio-langs-scroll">
              {AUDIO_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`audio-lang-item ${activeAudioLang === lang ? "active" : ""}`}
                  onClick={() => setActiveAudioLang(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* EPISODES SECTION (For TV Series - Matches User Reference Screenshot) */}
          {type === "tv" && (
            <div className="previewModal-episodes-section">
              <div className="episodes-header-row">
                <h3 className="episodes-title">Episodes</h3>
                <div className="season-selector-wrap">
                  <select
                    className="season-dropdown-select"
                    value={selectedSeason}
                    onChange={(e) => handleSeasonChange(e.target.value)}
                  >
                    {availableSeasons.length > 0 ? (
                      availableSeasons.map((s) => (
                        <option key={s.season_number} value={s.season_number}>
                          Season {s.season_number} ({s.episode_count || 8} EP)
                        </option>
                      ))
                    ) : (
                      <option value={1}>Season 1 (8 EP)</option>
                    )}
                  </select>
                </div>
              </div>

              {isLoadingEpisodes ? (
                <div className="episodes-loading-skeleton">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="episode-skeleton-row" />
                  ))}
                </div>
              ) : episodes.length > 0 ? (
                <div className="episodes-list">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id || ep.episode_number}
                      className="episode-item-row"
                      onClick={() => {
                        handleClose();
                        router.push(`/${type}/${id}?season=${selectedSeason}&episode=${ep.episode_number}`);
                      }}
                    >
                      <div className="episode-index-num">{ep.episode_number}</div>
                      <div className="episode-thumb-box">
                        <img
                          src={
                            ep.still_path
                              ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                              : backdrop
                          }
                          alt={ep.name}
                          className="episode-thumb-img"
                          loading="lazy"
                        />
                        <div className="episode-thumb-play-overlay">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                      <div className="episode-meta-col">
                        <div className="episode-title-line">
                          <span className="episode-name">{ep.name || `Episode ${ep.episode_number}`}</span>
                          <span className="episode-duration">
                            {ep.runtime ? `${ep.runtime}m` : "53m"}
                          </span>
                        </div>
                        <p className="episode-overview-text">
                          {ep.overview ||
                            "Dramatic turns and passionate discoveries await in this compelling chapter."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="episodes-fallback-notice">
                  <span>Stream all episodes in high definition cinema player.</span>
                  <button
                    type="button"
                    className="modal-main-play"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      handleClose();
                      router.push(targetHref);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Play Episode 1</span>
                  </button>
                </div>
              )}
            </div>
          )}

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
                      router.push(`/${rec.media_type || type}/${rec.id}`);
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
                      <div className="more-card-meta-row">
                        <span className="more-match">
                          {Math.min(99, Math.max(70, Math.round((rec.vote_average || 7.5) * 10)))}% match
                        </span>
                        <span className="more-badge-age">U/A 13+</span>
                        <span className="more-year">
                          {(rec.release_date || rec.first_air_date || "2024").substring(0, 4)}
                        </span>
                        <button
                          type="button"
                          className="more-add-btn"
                          title="Add to My List"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          +
                        </button>
                      </div>
                      <p className="more-card-desc">
                        {rec.overview?.substring(0, 95)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
