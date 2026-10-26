/**
 * lib/streams.js
 *
 * Maps MovieFlix titles to playable stream URLs for the CinemaPlayer.
 *
 * Why this exists: CinemaPlayer is a real custom player (Netflix/Prime style)
 * that controls a <video> element directly. That only works with streams you
 * legitimately control — your own encoded HLS/MP4, or public-domain content.
 * It CANNOT sit on top of third-party piracy embeds (cross-origin iframes).
 *
 * HOW DUBS WORK: pass an HLS master playlist (.m3u8) that declares multiple
 * audio renditions via #EXT-X-MEDIA TYPE=AUDIO. CinemaPlayer reads them from
 * hls.js and the Audio switcher in the settings menu lights up automatically.
 * Add #EXT-X-MEDIA TYPE=SUBTITLES renditions (or external .vtt via the
 * `subtitles` prop) for the Subtitle switcher.
 *
 * USAGE:
 *   1. Encode/obtain a licensed HLS master playlist for a title.
 *   2. Add an entry to STREAM_MAP below keyed by `${type}:${id}` (movie) or
 *      `${type}:${id}:${season}:${episode}` (TV). Episode keys win over title keys.
 *   3. The player picks it up immediately — no other code changes needed.
 */

const sniff = (url) => (/\.m3u8(\?|#|$)/i.test(url || "") ? "hls" : "mp4");

// Public test stream (Apple's official HLS sample) — has alternate audio
// renditions. Useful for verifying the Audio/Subtitle switcher end-to-end.
export const DEMO_STREAMS = {
  apple: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8"
};

// Edit me. Keys: `${type}:${id}` (movie) or `${type}:${id}:${season}:${episode}` (TV).
// Values: a licensed .m3u8 or .mp4 URL (or { src, subtitles? } for external VTT).
const STREAM_MAP = {};

function normalizeEntry(raw) {
  if (typeof raw === "string") return { src: raw, mimeType: sniff(raw), subtitles: [] };
  return {
    src: raw.src,
    mimeType: sniff(raw.src),
    subtitles: Array.isArray(raw.subtitles) ? raw.subtitles : []
  };
}

export function resolveStream(type, id, { season, episode } = {}) {
  const movieKey = `${type}:${id}`;
  const epKey = `${type}:${id}:${season ?? 1}:${episode ?? 1}`;

  if (STREAM_MAP[epKey]) return normalizeEntry(STREAM_MAP[epKey]);
  if (STREAM_MAP[movieKey]) return normalizeEntry(STREAM_MAP[movieKey]);
  return null;
}

// Public-domain films from the Internet Archive (license permitting) live on a
// separate path (lib/archive.js) — those resolve directly in the Classics page.
