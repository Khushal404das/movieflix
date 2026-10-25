package com.movieflix.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private static final String APP_URL = "https://reelstream-production.up.railway.app/home";
    
    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private FrameLayout customViewContainer;
    private LinearLayout offlineLayout;
    private Button btnRetry;

    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private int originalSystemUiVisibility;
    private int originalOrientation;

    private long backPressedTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Keep screen on during video streaming
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        webView = findViewById(R.id.webView);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        progressBar = findViewById(R.id.progressBar);
        customViewContainer = findViewById(R.id.customViewContainer);
        offlineLayout = findViewById(R.id.offlineLayout);
        btnRetry = findViewById(R.id.btnRetry);

        setupSwipeRefresh();
        setupWebView();
        setupBackButton();

        btnRetry.setOnClickListener(v -> {
            offlineLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.reload();
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(APP_URL);
        }
    }

    private void setupSwipeRefresh() {
        swipeRefreshLayout.setColorSchemeColors(0xFF00E676, 0xFF00A86B);
        swipeRefreshLayout.setProgressBackgroundColorSchemeColor(0xFF141414);
        swipeRefreshLayout.setOnRefreshListener(() -> {
            offlineLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.reload();
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Hardware acceleration & mixed content for third-party streaming embeds
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }

        CookieManager.getInstance().setAcceptCookie(true);

        String defaultUserAgent = settings.getUserAgentString();
        settings.setUserAgentString(defaultUserAgent + " MovieFlixNative/1.0.0 NetMirrorEngine/3.1");

        // NetMirror JavaScript Bridge for Native Downloads and Fullscreen
        WebAppInterface bridge = new WebAppInterface(this);
        webView.addJavascriptInterface(bridge, "Android");
        webView.addJavascriptInterface(bridge, "MovieFlixBridge");

        // Native Download Listener Interception (NetMirror style)
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                handleNativeDownload(url, contentDisposition, mimeType, null);
            }
        });

        webView.setWebViewClient(new MovieFlixWebViewClient());
        webView.setWebChromeClient(new MovieFlixChromeClient());
    }

    private void handleNativeDownload(String url, String contentDisposition, String mimeType, String customTitle) {
        try {
            Uri uri = Uri.parse(url);
            DownloadManager.Request request = new DownloadManager.Request(uri);
            if (mimeType != null && !mimeType.isEmpty()) {
                request.setMimeType(mimeType);
            }

            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) {
                request.addRequestHeader("cookie", cookies);
            }
            request.addRequestHeader("User-Agent", webView.getSettings().getUserAgentString());
            request.setDescription("Downloading movie / series stream...");

            String filename = (customTitle != null && !customTitle.isEmpty()) 
                    ? customTitle 
                    : URLUtil.guessFileName(url, contentDisposition, mimeType);
            if (!filename.contains(".")) {
                filename += ".mp4";
            }

            request.setTitle(filename);
            request.allowScanningByMediaScanner();
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);

            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                Toast.makeText(getApplicationContext(), "📥 Download started: " + filename, Toast.LENGTH_LONG).show();
            }
        } catch (Exception e) {
            try {
                // Fallback to browser for complex download redirects
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
            } catch (Exception ex) {
                Toast.makeText(getApplicationContext(), "Download error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        @JavascriptInterface
        public void downloadFile(String url, String fileName, String mimeType) {
            runOnUiThread(() -> handleNativeDownload(url, null, mimeType, fileName));
        }

        @JavascriptInterface
        public void showToast(String toast) {
            runOnUiThread(() -> Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void share(String title, String url) {
            runOnUiThread(() -> {
                try {
                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                    shareIntent.setType("text/plain");
                    shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                    shareIntent.putExtra(Intent.EXTRA_TEXT, title + "\n" + url);
                    startActivity(Intent.createChooser(shareIntent, "Share via MovieFlix"));
                } catch (Exception e) {
                    Toast.makeText(mContext, "Could not share", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private void setupBackButton() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (customView != null) {
                    hideCustomView();
                } else if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    if (backPressedTime + 2000 > System.currentTimeMillis()) {
                        finish();
                    } else {
                        Toast.makeText(MainActivity.this, "Press back again to exit MovieFlix", Toast.LENGTH_SHORT).show();
                        backPressedTime = System.currentTimeMillis();
                    }
                }
            }
        });
    }

    private class MovieFlixWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            return handleUrl(url);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleUrl(url);
        }

        private boolean handleUrl(String url) {
            if (url == null) return false;

            // Handle external schemes (e.g. mailto, tel, whatsapp, intent)
            if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("whatsapp:") || url.startsWith("intent:")) {
                try {
                    Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                    if (intent != null) {
                        startActivity(intent);
                        return true;
                    }
                } catch (Exception e) {
                    // Ignore intent parse errors
                }
            }
            return false;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            progressBar.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            progressBar.setVisibility(View.GONE);
            swipeRefreshLayout.setRefreshing(false);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request.isForMainFrame()) {
                swipeRefreshLayout.setRefreshing(false);
                progressBar.setVisibility(View.GONE);
                webView.setVisibility(View.GONE);
                offlineLayout.setVisibility(View.VISIBLE);
            }
        }
    }

    private class MovieFlixChromeClient extends WebChromeClient {
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
        public void onPermissionRequest(PermissionRequest request) {
            request.grant(request.getResources());
        }

        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (customView != null) {
                onHideCustomView();
                return;
            }

            customView = view;
            customViewCallback = callback;
            originalOrientation = getRequestedOrientation();
            originalSystemUiVisibility = getWindow().getDecorView().getSystemUiVisibility();

            // Switch to landscape fullscreen video mode
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
            swipeRefreshLayout.setVisibility(View.GONE);
        }

        @Override
        public void onHideCustomView() {
            hideCustomView();
        }
    }

    private void hideCustomView() {
        if (customView == null) return;

        setRequestedOrientation(originalOrientation);
        getWindow().getDecorView().setSystemUiVisibility(originalSystemUiVisibility);

        customViewContainer.setVisibility(View.GONE);
        customViewContainer.removeView(customView);
        customView = null;

        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }

        swipeRefreshLayout.setVisibility(View.VISIBLE);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
