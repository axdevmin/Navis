package com.navis.tv;

import android.content.Context;
import android.content.SharedPreferences;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Locale;

/** Stores the Navis server address and the player password across restarts. */
final class Prefs {

    private static final String FILE = "navis-tv";
    private static final String KEY_SERVER_URL = "serverUrl";
    private static final String KEY_PASSWORD = "password";
    private static final String KEY_START_ON_BOOT = "startOnBoot";
    private static final String KEY_LOW_PERFORMANCE = "lowPerformance";
    private static final String KEY_RENDER_SCALE = "renderScale";

    /** TV boxes and projectors are slow enough that this is the sane default. */
    static final boolean DEFAULT_LOW_PERFORMANCE = true;
    static final float DEFAULT_RENDER_SCALE = 0.75f;

    private final SharedPreferences prefs;

    Prefs(Context context) {
        prefs = context.getApplicationContext()
                .getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    /** The saved address, or the one baked in at build time on a fresh install. */
    String getServerUrl() {
        String stored = prefs.getString(KEY_SERVER_URL, "");
        return stored.isEmpty()
                ? normalizeServerUrl(BuildConfig.DEFAULT_SERVER_URL)
                : stored;
    }

    String getPassword() {
        // An explicitly saved empty password must win over the build time one.
        return prefs.contains(KEY_PASSWORD)
                ? prefs.getString(KEY_PASSWORD, "")
                : BuildConfig.DEFAULT_PASSWORD;
    }

    boolean getStartOnBoot() {
        return prefs.getBoolean(KEY_START_ON_BOOT, true);
    }

    boolean getLowPerformanceMode() {
        return prefs.getBoolean(KEY_LOW_PERFORMANCE, DEFAULT_LOW_PERFORMANCE);
    }

    /** Fraction of the native resolution the board is rendered at. */
    float getRenderScale() {
        return prefs.getFloat(KEY_RENDER_SCALE, DEFAULT_RENDER_SCALE);
    }

    void save(
            String serverUrl,
            String password,
            boolean startOnBoot,
            boolean lowPerformance,
            float renderScale) {
        prefs.edit()
                .putString(KEY_SERVER_URL, normalizeServerUrl(serverUrl))
                .putString(KEY_PASSWORD, password == null ? "" : password.trim())
                .putBoolean(KEY_START_ON_BOOT, startOnBoot)
                .putBoolean(KEY_LOW_PERFORMANCE, lowPerformance)
                .putFloat(KEY_RENDER_SCALE, renderScale)
                .apply();
    }

    boolean isConfigured() {
        return !getServerUrl().isEmpty();
    }

    /**
     * Whether the settings screen was already validated on this device. Used to
     * show it once on a fresh install, so the player password can be entered
     * with the native form rather than inside the web page.
     */
    boolean hasBeenReviewed() {
        return prefs.contains(KEY_SERVER_URL);
    }

    /**
     * Accepts what someone can realistically type with a TV remote, such as
     * "192.168.1.20:3000", and turns it into a usable base URL.
     */
    static String normalizeServerUrl(String raw) {
        String value = raw == null ? "" : raw.trim();
        if (value.isEmpty()) {
            return "";
        }
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            value = "http://" + value;
        }
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    /**
     * The player board URL. "map_only" hides the chat, the toolbar and the
     * side panels, which is what a projector should display.
     */
    String buildBoardUrl() {
        StringBuilder url = new StringBuilder(getServerUrl()).append("/?map_only");
        String password = getPassword();
        if (!password.isEmpty()) {
            url.append("&password=").append(encode(password));
        }
        if (getLowPerformanceMode()) {
            url.append("&perf=low");
        }
        float scale = getRenderScale();
        if (scale < 0.999f) {
            // Locale.US matters: a French locale would produce "0,75" and break
            // the query string.
            url.append("&scale=").append(String.format(Locale.US, "%.2f", scale));
        }
        return url.toString();
    }

    private static String encode(String value) {
        try {
            return URLEncoder.encode(value, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            // UTF-8 is always available; returning the raw value keeps the app usable.
            return value;
        }
    }
}
