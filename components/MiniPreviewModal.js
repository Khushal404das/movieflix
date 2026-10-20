"use client";

import { useEffect, useState, useRef } from "react";

const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  53: "Thriller", 10752: "War", 37: "Western", 10759: "Action & Adventure",
  10762: "Kids", 10765: "Sci-Fi & Fantasy"
};

export default function MiniPreviewModal() {
  const [data, setData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const hideTimerRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleCardHover = (e) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      const { rect, item, href, title, poster, backdrop, rating, type, genres, runtime } = e.detail || {};
      if (!rect) return;

      const popupWidth = Math.max(305, Math.min(350, window.innerWidth * 0.3));
      // Center horizontally over card
      let left = rect.left + window.scrollX - (popupWidth - rect.width) / 2;
      left = Math.max(16, Math.min(window.innerWidth - popupWidth - 16, left));

      // Pop UP slightly on top of the row
      let top = rect.top + window.scrollY - 30;
      top = Math.max(window.scrollY + 10, top);

      // Check watchlist
      try {
        const stored = JSON.parse(localStorage.getItem("rh-watchlist") || "[]");
        setInWatchlist(stored.some((x) => String(x.href) === String(href)));
      } catch (_) {}

      setData({
        item,
        href,
        title,
        poster,
        backdrop: backdrop || poster,
        rating,
        type: type || (item?.type) || "movie",
        genres,
        runtime,
        top,
        left,
        width: popupWidth
      });
      setIsOpen(true);
    };

    const handleCardLeave = () => {
      hideTimerRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 260);
    };

    window.addEventListener("movieflix:card-hover", handleCardHover);
    window.addEventListener("movieflix:card-leave", handleCardLeave);

    return () => {
      window.removeEventListener("movieflix:card-hover", handleCardHover);
      window.removeEventListener("movieflix:card-leave", handleCardLeave);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 240);
  };

  const handleOpenDetailModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
    if (!data) return;
    window.dispatchEvent(
      new CustomEvent("movieflix:open-preview", {
        detail: {
          item: data.item,
          type: data.type,
          id: data.item?.id,
          title: data.title,
          poster: data.poster,
          backdrop: data.backdrop,
          rating: data.rating,
          genres: data.genres,
          href: data.href
        }
      })
    );
  };

  const handleToggleWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!data?.href) return;
    try {
      const stored = JSON.parse(localStorage.getItem("rh-watchlist") || "[]");
      const exists = stored.some((x) => String(x.href) === String(data.href));
      let next;
      if (exists) {
        next = stored.filter((x) => String(x.href) !== String(data.href));
        setInWatchlist(false);
      } else {
        next = [...stored, { href: data.href, title: data.title, poster: data.poster, rating: data.rating, type: data.type }];
        setInWatchlist(true);
      }
      localStorage.setItem("rh-watchlist", JSON.stringify(next));
      window.dispatchEvent(new Event("movieflix:watchlist-updated"));
    } catch (_) {}
  };

  const handleToggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  if (!isOpen || !data) return null;

  const parsedRating = parseFloat(data.rating);
  const matchScore = !isNaN(parsedRating) && parsedRating > 0
    ? Math.min(99, Math.max(76, Math.round(parsedRating * 10 + (parsedRating < 8 ? 12 : 6))))
    : 95;

  const resolveMaturity = () => {
    if (!isNaN(parsedRating) && parsedRating >= 8.0) return "A 18+";
    if (!isNaN(parsedRating) && parsedRating >= 7.0) return "U/A 16+";
    return "U/A 13+";
  };

  const resolveDuration = () => {
    if (data.type === "tv") {
      const count = data.item?.number_of_seasons || 1;
      return count > 1 ? count + " Seasons" : "1 Season";
    }
    if (data.runtime) return data.runtime;
    return "1h 48m";
  };

  const resolveGenreList = () => {
    if (Array.isArray(data.genres) && data.genres.length > 0) {
      return data.genres
        .map((g) => (typeof g === "string" ? g : g.name || GENRE_MAP[g]))
        .filter(Boolean)
        .slice(0, 3);
    }
    if (Array.isArray(data.item?.genre_ids) && data.item.genre_ids.length > 0) {
      return data.item.genre_ids
        .map((id) => GENRE_MAP[id])
        .filter(Boolean)
        .slice(0, 3);
    }
    return data.type === "tv" ? ["Drama", "Web Series"] : ["Cinema", "Feature Film"];
  };

  const genreList = resolveGenreList();

  return (
    <div
      id="pop-box"
      className="focus-trap-wrapper previewModal--wrapper mini-modal has-smaller-buttons"
      tabIndex="-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        id="actionMenu"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        tabIndex="-1"
        className="previewModal--container mini-modal has-smaller-buttons pop-box-shadow"
        data-modal="true"
        data-box="open"
        data-uia="preview-modal-container-MINI_MODAL"
        style={{
          minWidth: "305px",
          maxWidth: "350px",
          width: data.width + "px",
          top: data.top + "px",
          left: data.left + "px",
          transformOrigin: "center center 0px",
          opacity: 1,
          position: "absolute",
          zIndex: 1001,
          animation: "0.22s cubic-bezier(0.25, 1, 0.5, 1) 0s 1 normal none running miniModalFadeIn"
        }}
      >
        {/* Media boxart container */}
        <div
          className="previewModal--player_container mini-modal has-smaller-buttons open-modal2"
          onClick={handleOpenDetailModal}
        >
          <div className="videoMerchPlayer--boxart-wrapper">
            <img
              className="previewModal--boxart"
              src={data.backdrop || data.poster}
              alt={data.title}
            />
          </div>
          <div className="mini-modal-gradient-overlay" />
          <div className="mini-modal-title-overlay">
            <span>{data.title}</span>
          </div>
          <div className="mini-modal-red-badge">
            {data.type === "tv" ? "New Season" : "Recently added"}
          </div>
        </div>

        {/* Info & controls body */}
        <div className="previewModal--info">
          <div className="mini-modal-container">
            <div data-uia="previewModal--info-container" className="ltr-xqhbvx">
              <div className="previewModal--metadatAndControls mini-modal has-smaller-buttons">
                <div className="previewModal--metadatAndControls-container">
                  {/* Action buttons */}
                  <div
                    className="buttonControls--container mini-modal has-smaller-buttons"
                    data-uia="mini-modal-controls"
                  >
                    {/* Play button */}
                    <a
                      role="link"
                      aria-label="Play"
                      className="primary-button playLink isToolkit isRound modal-mini-play"
                      onClick={handleOpenDetailModal}
                    >
                      <button className="color-primary hasIcon round pop-btn" type="button" title="Play Now">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                      </button>
                    </a>

                    {/* Add to my list */}
                    <div className="ltr-t0lbh8">
                      <div className="ptrack-content">
                        <button
                          aria-label="Add To My List"
                          className={"color-supplementary hasIcon round pop-btn mini-pop-mylist " + (inWatchlist ? "active" : "")}
                          data-uia="add-to-my-list"
                          type="button"
                          onClick={handleToggleWatchlist}
                          title={inWatchlist ? "In Watchlist" : "Add to My List"}
                        >
                          {inWatchlist ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Like button */}
                    <div className="ltr-1bbjknu">
                      <button
                        className={"color-supplementary hasIcon round pop-btn " + (isLiked ? "active" : "")}
                        data-uia="thumbs-rate-button"
                        type="button"
                        onClick={handleToggleLike}
                        title="I like this"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                      </button>
                    </div>

                    {/* Expand to detail modal (down chevron arrow on right) */}
                    <div className="buttonControls--expand-button ltr-t0lbh8">
                      <button
                        aria-label="expand to detail modal"
                        className="color-supplementary hasIcon round pop-btn open-modal2"
                        data-uia="expand-to-detail-button"
                        type="button"
                        onClick={handleOpenDetailModal}
                        title="Episodes & info"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Metadata info */}
                  <div className="previewModal--metadatAndControls-info">
                    <div>
                      <div className="videoMetadata--container" data-uia="videoMetadata--container">
                        <div className="videoMetadata--first-line">
                          <span className="match-score-wrapper no-rating">
                            <div className="show-match-score rating-inner">
                              <span className="match-score mini-modal-match">{matchScore}% match</span>
                            </div>
                          </span>
                        </div>
                        <div className="videoMetadata--second-line">
                          <span className="maturity-rating">
                            <span className="maturity-number mini-modal-age">{resolveMaturity()}</span>
                          </span>
                          <span className="duration mini-modal-runtime">{resolveDuration()}</span>
                          <span className="player-feature-badge mini-modal-hdsd">HD</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Evidence tags */}
                  <div className="previewModal--metadatAndControls-tags-container">
                    <div className="evidence-tags">
                      <div className="evidence-list">
                        {genreList.map((g, idx) => (
                          <div key={idx} className="evidence-item">
                            <span className="evidence-text">{g}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
