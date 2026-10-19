package com.reelstream.app;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions;

import java.util.ArrayList;
import java.util.List;

public class NativeHomeActivity extends AppCompatActivity implements MediaCardAdapter.OnItemClickListener {
    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar loadingBar;
    private RecyclerView rvHomeRows;
    private HomeRowAdapter rowAdapter;
    private List<HomeRow> rowList = new ArrayList<>();

    // Billboard Views
    private ImageView ivBillboardBackdrop;
    private TextView tvBillboardType;
    private TextView tvOttBadge;
    private LinearLayout layoutSupplemental;
    private TextView tvSupplementalMsg;
    private TextView tvBillboardTitle;
    private TextView tvBillboardMatch;
    private TextView tvBillboardYear;
    private TextView tvBillboardOverview;
    private LinearLayout btnBillboardPlay;
    private LinearLayout btnBillboardInfo;
    private LinearLayout layoutDots;

    private List<MediaItem> billboardCandidates = new ArrayList<>();
    private int currentBillboardIdx = 0;
    private final Handler billboardHandler = new Handler(Looper.getMainLooper());
    private Runnable billboardRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_native_home);

        initViews();
        setupRecyclerView();
        loadAllData();
    }

    private void initViews() {
        swipeRefreshLayout = findViewById(R.id.swipeRefreshHome);
        loadingBar = findViewById(R.id.homeLoading);
        rvHomeRows = findViewById(R.id.rvHomeRows);

        View billboard = findViewById(R.id.billboardLayout);
        ivBillboardBackdrop = billboard.findViewById(R.id.ivBillboardBackdrop);
        tvBillboardType = billboard.findViewById(R.id.tvBillboardType);
        tvOttBadge = billboard.findViewById(R.id.tvOttBadge);
        layoutSupplemental = billboard.findViewById(R.id.layoutSupplemental);
        tvSupplementalMsg = billboard.findViewById(R.id.tvSupplementalMsg);
        tvBillboardTitle = billboard.findViewById(R.id.tvBillboardTitle);
        tvBillboardMatch = billboard.findViewById(R.id.tvBillboardMatch);
        tvBillboardYear = billboard.findViewById(R.id.tvBillboardYear);
        tvBillboardOverview = billboard.findViewById(R.id.tvBillboardOverview);
        btnBillboardPlay = billboard.findViewById(R.id.btnBillboardPlay);
        btnBillboardInfo = billboard.findViewById(R.id.btnBillboardInfo);
        layoutDots = billboard.findViewById(R.id.layoutDots);

        swipeRefreshLayout.setColorSchemeColors(0xFFE50914);
        swipeRefreshLayout.setOnRefreshListener(this::loadAllData);

        btnBillboardPlay.setOnClickListener(v -> {
            if (!billboardCandidates.isEmpty() && currentBillboardIdx < billboardCandidates.size()) {
                MediaItem current = billboardCandidates.get(currentBillboardIdx);
                launchPlayer(current);
            }
        });

        btnBillboardInfo.setOnClickListener(v -> {
            if (!billboardCandidates.isEmpty() && currentBillboardIdx < billboardCandidates.size()) {
                MediaItem current = billboardCandidates.get(currentBillboardIdx);
                showInfoDialog(current);
            }
        });
    }

    private void setupRecyclerView() {
        rowAdapter = new HomeRowAdapter(this, rowList, this);
        rvHomeRows.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false));
        rvHomeRows.setAdapter(rowAdapter);
    }

    private void loadAllData() {
        swipeRefreshLayout.setRefreshing(true);
        rowList.clear();

        // 1. Trending for Billboard spotlight and slider
        TmdbApi.getTrending(new TmdbApi.Callback<List<MediaItem>>() {
            @Override
            public void onSuccess(List<MediaItem> items) {
                loadingBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
                if (items != null && !items.isEmpty()) {
                    billboardCandidates = items.subList(0, Math.min(items.size(), 6));
                    setupBillboardCarousel();
                    rowList.add(new HomeRow("Trending Now", items, false));
                    rowAdapter.notifyDataSetChanged();
                }
            }

            @Override
            public void onError(Exception error) {
                loadingBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
                Toast.makeText(NativeHomeActivity.this, "Network error: " + error.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });

        // 2. Top 10 Movies Today
        TmdbApi.getTop10Movies(new TmdbApi.Callback<List<MediaItem>>() {
            @Override
            public void onSuccess(List<MediaItem> items) {
                if (items != null && !items.isEmpty()) {
                    rowList.add(0, new HomeRow("Top 10 Movies Today", items.subList(0, Math.min(items.size(), 10)), true));
                    rowAdapter.notifyDataSetChanged();
                }
            }
            @Override
            public void onError(Exception error) {}
        });

        // 3. Binge-worthy TV & Web Series
        TmdbApi.getTrendingSeries(new TmdbApi.Callback<List<MediaItem>>() {
            @Override
            public void onSuccess(List<MediaItem> items) {
                if (items != null && !items.isEmpty()) {
                    rowList.add(new HomeRow("Binge-worthy TV & Web Series", items, false));
                    rowAdapter.notifyDataSetChanged();
                }
            }
            @Override
            public void onError(Exception error) {}
        });

        // 4. Popular Anime Series
        TmdbApi.getAnime(new TmdbApi.Callback<List<MediaItem>>() {
            @Override
            public void onSuccess(List<MediaItem> items) {
                if (items != null && !items.isEmpty()) {
                    rowList.add(new HomeRow("⚡ Popular Anime Series", items, false));
                    rowAdapter.notifyDataSetChanged();
                }
            }
            @Override
            public void onError(Exception error) {}
        });

        // 5. K-Drama & Asian Series
        TmdbApi.getKDramas(new TmdbApi.Callback<List<MediaItem>>() {
            @Override
            public void onSuccess(List<MediaItem> items) {
                if (items != null && !items.isEmpty()) {
                    rowList.add(new HomeRow("🌟 K-Drama & Asian Series", items, false));
                    rowAdapter.notifyDataSetChanged();
                }
            }
            @Override
            public void onError(Exception error) {}
        });

        // 6. Action & Adrenaline Thrillers
        TmdbApi.getActionMovies(new TmdbApi.Callback<List<MediaItem>>() {
            @Override
            public void onSuccess(List<MediaItem> items) {
                if (items != null && !items.isEmpty()) {
                    rowList.add(new HomeRow("Action & Adrenaline", items, false));
                    rowAdapter.notifyDataSetChanged();
                }
            }
            @Override
            public void onError(Exception error) {}
        });
    }

    private void setupBillboardCarousel() {
        if (billboardCandidates.isEmpty()) return;
        currentBillboardIdx = 0;
        updateBillboardView(billboardCandidates.get(0));
        setupDots(billboardCandidates.size());

        if (billboardRunnable != null) {
            billboardHandler.removeCallbacks(billboardRunnable);
        }

        billboardRunnable = new Runnable() {
            @Override
            public void run() {
                if (!billboardCandidates.isEmpty()) {
                    currentBillboardIdx = (currentBillboardIdx + 1) % billboardCandidates.size();
                    updateBillboardView(billboardCandidates.get(currentBillboardIdx));
                    updateDots(currentBillboardIdx);
                    billboardHandler.postDelayed(this, 8000);
                }
            }
        };
        billboardHandler.postDelayed(billboardRunnable, 8000);
    }

    private void updateBillboardView(MediaItem item) {
        if (item == null) return;

        Glide.with(this)
                .load(item.getBackdropUrl())
                .transition(DrawableTransitionOptions.withCrossFade(400))
                .centerCrop()
                .into(ivBillboardBackdrop);

        tvBillboardType.setText("tv".equals(item.getMediaType()) ? "SERIES" : "FILM");

        MediaItem.OttBadge ott = item.getOttBadge();
        if (ott != null) {
            tvOttBadge.setText(ott.name);
            tvOttBadge.setTextColor(ott.color);
        }

        String supplemental = item.getSupplementalMsg();
        if (supplemental != null && !supplemental.isEmpty()) {
            layoutSupplemental.setVisibility(View.VISIBLE);
            tvSupplementalMsg.setText(supplemental);
        } else {
            layoutSupplemental.setVisibility(View.GONE);
        }

        tvBillboardTitle.setText(item.getTitle());
        tvBillboardMatch.setText(item.getMatchPercentage());
        tvBillboardYear.setText(item.getYear());
        tvBillboardOverview.setText(item.getOverview());
    }

    private void setupDots(int count) {
        layoutDots.removeAllViews();
        for (int i = 0; i < count; i++) {
            View dot = new View(this);
            int width = (i == 0) ? dpToPx(28) : dpToPx(16);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(width, dpToPx(3));
            params.setMargins(dpToPx(3), 0, dpToPx(3), 0);
            dot.setLayoutParams(params);
            dot.setBackgroundColor(i == 0 ? Color.WHITE : Color.parseColor("#4DFFFFFF"));
            final int targetIdx = i;
            dot.setOnClickListener(v -> {
                currentBillboardIdx = targetIdx;
                updateBillboardView(billboardCandidates.get(targetIdx));
                updateDots(targetIdx);
            });
            layoutDots.addView(dot);
        }
    }

    private void updateDots(int activeIdx) {
        for (int i = 0; i < layoutDots.getChildCount(); i++) {
            View dot = layoutDots.getChildAt(i);
            if (dot != null) {
                int width = (i == activeIdx) ? dpToPx(28) : dpToPx(16);
                LinearLayout.LayoutParams params = (LinearLayout.LayoutParams) dot.getLayoutParams();
                params.width = width;
                dot.setLayoutParams(params);
                dot.setBackgroundColor(i == activeIdx ? Color.WHITE : Color.parseColor("#4DFFFFFF"));
            }
        }
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    private void launchPlayer(MediaItem item) {
        Intent intent = new Intent(this, PlayerActivity.class);
        intent.putExtra("media_id", item.getId());
        intent.putExtra("media_type", item.getMediaType());
        intent.putExtra("media_title", item.getTitle());
        startActivity(intent);
    }

    private void showInfoDialog(MediaItem item) {
        new AlertDialog.Builder(this)
                .setTitle(item.getTitle())
                .setMessage(item.getOverview() + "\n\nRelease: " + item.getYear() + "\nRating: " + item.getRating() + "/10")
                .setPositiveButton("▶ Play Now", (d, w) -> launchPlayer(item))
                .setNegativeButton("Close", null)
                .show();
    }

    @Override
    public void onItemClick(MediaItem item) {
        launchPlayer(item);
    }

    @Override
    protected void onDestroy() {
        if (billboardRunnable != null) {
            billboardHandler.removeCallbacks(billboardRunnable);
        }
        super.onDestroy();
    }
}
