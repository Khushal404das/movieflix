package com.reelstream.app;

import android.os.Handler;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class TmdbApi {
    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String API_KEY = "844dba0bfd8f3a4f3799f6130ef9e335";
    private static final ExecutorService executor = Executors.newFixedThreadPool(4);
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    public interface Callback<T> {
        void onSuccess(T result);
        void onError(Exception error);
    }

    private static String httpGet(String urlStr) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);
        conn.setRequestProperty("Accept", "application/json");

        int code = conn.getResponseCode();
        if (code != 200) {
            throw new Exception("HTTP Error: " + code);
        }

        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        reader.close();
        conn.disconnect();
        return sb.toString();
    }

    private static void fetchList(String endpoint, String defaultType, Callback<List<MediaItem>> callback) {
        executor.execute(() -> {
            try {
                String sep = endpoint.contains("?") ? "&" : "?";
                String fullUrl = BASE_URL + endpoint + sep + "api_key=" + API_KEY;
                String response = httpGet(fullUrl);
                JSONObject root = new JSONObject(response);
                JSONArray results = root.optJSONArray("results");
                List<MediaItem> items = new ArrayList<>();
                if (results != null) {
                    for (int i = 0; i < results.length(); i++) {
                        JSONObject obj = results.optJSONObject(i);
                        if (obj != null) {
                            MediaItem item = MediaItem.fromJson(obj, defaultType);
                            if (item.getPosterUrl() != null) {
                                items.add(item);
                            }
                        }
                    }
                }
                mainHandler.post(() -> callback.onSuccess(items));
            } catch (Exception e) {
                mainHandler.post(() -> callback.onError(e));
            }
        });
    }

    public static void getTrending(Callback<List<MediaItem>> callback) {
        fetchList("/trending/all/day", null, callback);
    }

    public static void getTop10Movies(Callback<List<MediaItem>> callback) {
        fetchList("/trending/movie/week", "movie", callback);
    }

    public static void getTrendingSeries(Callback<List<MediaItem>> callback) {
        fetchList("/trending/tv/week", "tv", callback);
    }

    public static void getPopularMovies(Callback<List<MediaItem>> callback) {
        fetchList("/movie/popular", "movie", callback);
    }

    public static void getAnime(Callback<List<MediaItem>> callback) {
        fetchList("/discover/tv?with_genres=16&sort_by=popularity.desc", "tv", callback);
    }

    public static void getKDramas(Callback<List<MediaItem>> callback) {
        fetchList("/discover/tv?with_original_language=ko&sort_by=popularity.desc", "tv", callback);
    }

    public static void getActionMovies(Callback<List<MediaItem>> callback) {
        fetchList("/discover/movie?with_genres=28&sort_by=popularity.desc", "movie", callback);
    }

    public static void getSciFiMovies(Callback<List<MediaItem>> callback) {
        fetchList("/discover/movie?with_genres=878&sort_by=popularity.desc", "movie", callback);
    }
}
