package com.movieflix.app;

import org.json.JSONObject;
import java.io.Serializable;

public class MediaItem implements Serializable {
    private int id;
    private String title;
    private String name;
    private String overview;
    private String posterPath;
    private String backdropPath;
    private double voteAverage;
    private String releaseDate;
    private String firstAirDate;
    private String mediaType;
    private String originalLanguage;

    public MediaItem() {}

    public static MediaItem fromJson(JSONObject obj, String defaultType) {
        MediaItem item = new MediaItem();
        try {
            item.id = obj.optInt("id", 0);
            item.title = obj.optString("title", null);
            item.name = obj.optString("name", null);
            item.overview = obj.optString("overview", "");
            item.posterPath = obj.optString("poster_path", null);
            item.backdropPath = obj.optString("backdrop_path", null);
            item.voteAverage = obj.optDouble("vote_average", 7.5);
            item.releaseDate = obj.optString("release_date", null);
            item.firstAirDate = obj.optString("first_air_date", null);
            item.mediaType = obj.optString("media_type", defaultType != null ? defaultType : (item.name != null ? "tv" : "movie"));
            item.originalLanguage = obj.optString("original_language", "en");
        } catch (Exception ignored) {}
        return item;
    }

    public int getId() { return id; }
    
    public String getTitle() {
        if (title != null && !title.isEmpty()) return title;
        if (name != null && !name.isEmpty()) return name;
        return "Untitled";
    }

    public String getOverview() { return overview; }

    public String getPosterUrl() {
        if (posterPath != null && !posterPath.isEmpty() && !posterPath.equals("null")) {
            return "https://image.tmdb.org/t/p/w500" + posterPath;
        }
        return null;
    }

    public String getBackdropUrl() {
        if (backdropPath != null && !backdropPath.isEmpty() && !backdropPath.equals("null")) {
            return "https://image.tmdb.org/t/p/w1280" + backdropPath;
        }
        return getPosterUrl();
    }

    public String getYear() {
        String date = releaseDate != null && !releaseDate.isEmpty() ? releaseDate : firstAirDate;
        if (date != null && date.length() >= 4) {
            return date.substring(0, 4);
        }
        return "2024";
    }

    public String getRating() {
        return String.format("%.1f", voteAverage);
    }

    public String getMatchPercentage() {
        int pct = (int) Math.round(voteAverage * 10);
        if (pct < 75) pct = 85;
        if (pct > 99) pct = 98;
        return pct + "% Match";
    }

    public String getMediaType() {
        return (mediaType != null && !mediaType.isEmpty()) ? mediaType : "movie";
    }

    public String getOriginalLanguage() { return originalLanguage; }

    public String getSupplementalMsg() {
        String lang = originalLanguage != null ? originalLanguage : "en";
        if ("te".equals(lang) || "ta".equals(lang) || "ml".equals(lang) || "kn".equals(lang)) {
            return "Watch in Tamil, Telugu, Hindi, Malayalam, Kannada";
        }
        if ("hi".equals(lang)) {
            return "Watch in Hindi, English · Full HD";
        }
        if ("ko".equals(lang)) {
            return "Watch in Korean, Hindi Dub, English Sub";
        }
        if ("ja".equals(lang)) {
            return "Watch in Japanese (Sub) · Hindi Dub · English Dub";
        }
        return "Watch in English · Multi-Audio Available";
    }

    public static class OttBadge {
        public String name;
        public int color;
        public OttBadge(String name, int color) {
            this.name = name;
            this.color = color;
        }
    }

    public OttBadge getOttBadge() {
        String lang = originalLanguage != null ? originalLanguage : "en";
        if ("te".equals(lang) || "ta".equals(lang) || "hi".equals(lang) || "ml".equals(lang)) {
            return new OttBadge("Hotstar", 0xFF1F80E0);
        }
        if ("ko".equals(lang)) {
            return new OttBadge("Netflix", 0xFFE50914);
        }
        if ("ja".equals(lang)) {
            return new OttBadge("Crunchyroll", 0xFFF47521);
        }
        int mod = Math.abs(id % 3);
        if (mod == 0) return new OttBadge("Netflix", 0xFFE50914);
        if (mod == 1) return new OttBadge("Prime Video", 0xFF00A8E1);
        return new OttBadge("Disney+", 0xFF113CCF);
    }
}
