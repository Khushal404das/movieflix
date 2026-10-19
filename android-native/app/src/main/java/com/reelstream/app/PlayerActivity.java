package com.reelstream.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

public class PlayerActivity extends AppCompatActivity {
    private WebView webView;
    private FrameLayout customViewContainer;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private ProgressBar progressBar;
    private TextView tvPlayerTitle;
    private TextView tvCurrentServer;

    private int mediaId;
    private String mediaType = "movie";
    private String mediaTitle = "Playing";
    private int currentServerIdx = 0;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_player);

        Intent intent = getIntent();
        mediaId = intent.getIntExtra("media_id", 0);
        mediaType = intent.getStringExtra("media_type");
        if (mediaType == null) mediaType = "movie";
        mediaTitle = intent.getStringExtra("media_title");
        if (mediaTitle == null) mediaTitle = "Playing";

        webView = findViewById(R.id.playerWebView);
        customViewContainer = findViewById(R.id.customPlayerContainer);
        progressBar = findViewById(R.id.playerProgress);
        tvPlayerTitle = findViewById(R.id.tvPlayerTitle);
        tvCurrentServer = findViewById(R.id.tvCurrentServer);

        tvPlayerTitle.setText(mediaTitle);

        ImageButton btnBack = findViewById(R.id.btnBack);
        btnBack.setOnClickListener(v -> finish());

        setupServerPills();
        configureWebView();
        setupBackButton();

        loadServer(0);
    }

    private void setupServerPills() {
        Button btn1 = findViewById(R.id.btnServer1);
        Button btn2 = findViewById(R.id.btnServer2);
        Button btn3 = findViewById(R.id.btnServer3);
        Button btn4 = findViewById(R.id.btnServer4);

        btn1.setOnClickListener(v -> switchServer(0, "VidSrc (4K)"));
        btn2.setOnClickListener(v -> switchServer(1, "Smashy (Multi-Audio)"));
        btn3.setOnClickListener(v -> switchServer(2, "AutoEmbed (Fast)"));
        btn4.setOnClickListener(v -> switchServer(3, "SuperStream"));
    }

    private void switchServer(int idx, String name) {
        currentServerIdx = idx;
        tvCurrentServer.setText(name);
        loadServer(idx);
    }

    private void loadServer(int serverIdx) {
        String url;
        if ("tv".equals(mediaType)) {
            // Season 1 Episode 1 default
            switch (serverIdx) {
                case 1:
                    url = "https://player.smashy.stream/tv/" + mediaId + "?s=1&e=1";
                    break;
                case 2:
                    url = "https://player.autoembed.cc/embed/tv/" + mediaId + "/1/1";
                    break;
                case 3:
                    url = "https://multiembed.mov/?video_id=" + mediaId + "&tmdb=1&s=1&e=1";
                    break;
                default:
                    url = "https://vidsrc.cc/v2/embed/tv/" + mediaId + "/1/1";
                    break;
            }
        } else {
            switch (serverIdx) {
                case 1:
                    url = "https://player.smashy.stream/movie/" + mediaId;
                    break;
                case 2:
                    url = "https://player.autoembed.cc/embed/movie/" + mediaId;
                    break;
                case 3:
                    url = "https://multiembed.mov/?video_id=" + mediaId + "&tmdb=1";
                    break;
                default:
                    url = "https://vidsrc.cc/v2/embed/movie/" + mediaId;
                    break;
            }
        }

        webView.loadUrl(url);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setUserAgentString("Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Prevent aggressive ad redirects opening external apps
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    if (url.contains("vidsrc") || url.contains("smashy") || url.contains("autoembed") || url.contains("multiembed") || url.contains("embed")) {
                        return false;
                    }
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setProgress(newProgress);
                    progressBar.setVisibility(View.VISIBLE);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customView != null) {
                    onHideCustomView();
                    return;
                }
                customView = view;
                customViewCallback = callback;
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);

                getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );

                customViewContainer.addView(customView, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                ));
                customViewContainer.setVisibility(View.VISIBLE);
                webView.setVisibility(View.GONE);
            }

            @Override
            public void onHideCustomView() {
                if (customView == null) return;
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);

                customViewContainer.setVisibility(View.GONE);
                customViewContainer.removeView(customView);
                customView = null;

                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
                webView.setVisibility(View.VISIBLE);
            }
        });
    }

    private void setupBackButton() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (customView != null) {
                    if (webView.getWebChromeClient() != null) {
                        webView.getWebChromeClient().onHideCustomView();
                    }
                } else {
                    finish();
                }
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
