package com.navis.tv;

import android.app.Activity;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Full screen WebView showing the Navis player board, meant to stay on a
 * projector or a TV for a whole game session.
 */
public class MainActivity extends Activity {

    private static final long RETRY_DELAY_MS = 3000;
    private static final long RETRY_DELAY_MAX_MS = 15000;
    private static final long EXIT_CONFIRM_WINDOW_MS = 2500;

    private WebView webView;
    private View statusOverlay;
    private TextView statusTitle;
    private TextView statusDetail;

    private Prefs prefs;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable pendingRetry;
    private long retryDelay = RETRY_DELAY_MS;
    private boolean pageLoaded;
    private String loadedUrl = "";
    private long lastBackPress;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = new Prefs(this);
        webView = findViewById(R.id.web_view);
        statusOverlay = findViewById(R.id.status_overlay);
        statusTitle = findViewById(R.id.status_title);
        statusDetail = findViewById(R.id.status_detail);

        // A board on a projector must never be interrupted by the screen saver.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        configureWebView();

        // On a fresh install the address is already known (baked in at build
        // time), but the player password is not: show the form once.
        if (!prefs.hasBeenReviewed()) {
            openSetup();
        }
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        // The player view keeps its state in localStorage.
        settings.setDomStorageEnabled(true);
        // Video and GIF maps have to start on their own: nobody clicks on a projector.
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }
        webView.setBackgroundColor(getResources().getColor(R.color.navis_background));

        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                pageLoaded = true;
                retryDelay = RETRY_DELAY_MS;
                hideStatus();
            }

            @Override
            public void onReceivedError(
                    WebView view, WebResourceRequest request, WebResourceError error) {
                // Sub resources fail all the time without breaking the board:
                // only a failure of the page itself is worth reporting.
                if (request != null && request.isForMainFrame()) {
                    onLoadFailed();
                }
            }

            @SuppressWarnings("deprecation")
            @Override
            public void onReceivedError(
                    WebView view, int errorCode, String description, String failingUrl) {
                if (failingUrl != null && failingUrl.equals(loadedUrl)) {
                    onLoadFailed();
                }
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        enterImmersiveMode();

        if (!prefs.isConfigured()) {
            return;
        }

        String url = prefs.buildBoardUrl();
        // Reload only when the settings changed or nothing is displayed yet,
        // so returning to the app does not restart an ongoing session.
        if (!pageLoaded || !url.equals(loadedUrl)) {
            load(url);
        }
    }

    @Override
    protected void onPause() {
        cancelRetry();
        super.onPause();
    }

    private void load(String url) {
        cancelRetry();
        loadedUrl = url;
        pageLoaded = false;
        showStatus(getString(R.string.status_connecting), url);
        webView.loadUrl(url);
    }

    private void onLoadFailed() {
        pageLoaded = false;
        boolean offline = !isNetworkAvailable();
        showStatus(
                getString(offline ? R.string.status_offline : R.string.status_unreachable),
                getString(R.string.status_retry_hint, loadedUrl));
        scheduleRetry();
    }

    private void scheduleRetry() {
        cancelRetry();
        pendingRetry = new Runnable() {
            @Override
            public void run() {
                pendingRetry = null;
                // Backing off avoids hammering a server that is still booting.
                retryDelay = Math.min(retryDelay * 2, RETRY_DELAY_MAX_MS);
                webView.loadUrl(loadedUrl);
            }
        };
        handler.postDelayed(pendingRetry, retryDelay);
    }

    private void cancelRetry() {
        if (pendingRetry != null) {
            handler.removeCallbacks(pendingRetry);
            pendingRetry = null;
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager manager =
                (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (manager == null) {
            return true;
        }
        NetworkInfo info = manager.getActiveNetworkInfo();
        return info != null && info.isConnected();
    }

    private void showStatus(String title, String detail) {
        statusTitle.setText(title);
        statusDetail.setText(detail);
        statusOverlay.setVisibility(View.VISIBLE);
    }

    private void hideStatus() {
        statusOverlay.setVisibility(View.GONE);
    }

    private void openSetup() {
        startActivity(new Intent(this, SetupActivity.class));
    }

    private void enterImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_MENU:
            case KeyEvent.KEYCODE_SETTINGS:
            case KeyEvent.KEYCODE_INFO:
                openSetup();
                return true;
            case KeyEvent.KEYCODE_MEDIA_PLAY:
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
                // Reconnect right away instead of waiting for the next retry.
                if (!pageLoaded && prefs.isConfigured()) {
                    load(prefs.buildBoardUrl());
                    return true;
                }
                return super.onKeyDown(keyCode, event);
            case KeyEvent.KEYCODE_BACK:
                // A single press must not close the board in the middle of a game.
                long now = System.currentTimeMillis();
                if (now - lastBackPress < EXIT_CONFIRM_WINDOW_MS) {
                    finish();
                } else {
                    lastBackPress = now;
                    Toast.makeText(this, R.string.exit_confirm, Toast.LENGTH_SHORT).show();
                }
                return true;
            default:
                return super.onKeyDown(keyCode, event);
        }
    }

    @Override
    protected void onDestroy() {
        cancelRetry();
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
