import once from "lodash/once";

export type GraphicsQuality = "high" | "low";

export type GraphicsSettings = {
  quality: GraphicsQuality;
  /** Upper bound applied to window.devicePixelRatio. */
  maxPixelRatio: number;
  antialias: boolean;
  /** Multiplier applied to the weather particle counts. */
  weatherParticleScale: number;
  /**
   * Maximum number of weather simulation updates per second.
   * 0 means "every rendered frame".
   */
  weatherUpdateHz: number;
};

const HIGH_QUALITY: GraphicsSettings = {
  quality: "high",
  maxPixelRatio: 2,
  antialias: true,
  weatherParticleScale: 1,
  weatherUpdateHz: 0,
};

const LOW_QUALITY: GraphicsSettings = {
  quality: "low",
  // One device pixel per CSS pixel: a 1080p screen is already 2 megapixels to
  // shade every frame, which is what most TV boxes and projectors can afford.
  maxPixelRatio: 1,
  // Multisampling is one of the most expensive settings on a weak GPU.
  antialias: false,
  weatherParticleScale: 0.2,
  weatherUpdateHz: 30,
};

export const GRAPHICS_QUALITY_STORAGE_KEY = "navis.graphicsQuality";

const parseQuality = (value: string | null): GraphicsQuality | null =>
  value === "low" || value === "high" ? value : null;

/**
 * Quality is resolved once at startup, in this order:
 *
 *  1. the "perf" query parameter, which is how the Android TV app pins it;
 *  2. a preference persisted in localStorage;
 *  3. a deliberately conservative hardware heuristic.
 */
const detectQuality = (): GraphicsQuality => {
  if (typeof window === "undefined") return "high";

  const fromUrl = parseQuality(
    new URLSearchParams(window.location.search).get("perf")
  );
  if (fromUrl) return fromUrl;

  try {
    const stored = parseQuality(
      window.localStorage.getItem(GRAPHICS_QUALITY_STORAGE_KEY)
    );
    if (stored) return stored;
  } catch (err) {
    // localStorage can throw when cookies are blocked; fall through.
  }

  // Only obviously constrained devices are downgraded automatically, so a
  // regular desktop is never silently degraded.
  const cores = window.navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0 && cores <= 2) return "low";

  return "high";
};

export const getGraphicsSettings = once((): GraphicsSettings =>
  detectQuality() === "low" ? LOW_QUALITY : HIGH_QUALITY
);

/**
 * Explicit render scale from the "scale" query parameter, between 0.4 and 2.
 * Rendering below 1 is the strongest lever available on a device that is
 * limited by how many pixels it can shade, and it is the only one that still
 * helps when the device already reports a pixel ratio of 1. It is exposed as a
 * parameter so it can be dialed in on the target hardware without a rebuild.
 */
const getRenderScaleOverride = once((): number | null => {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("scale");
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(value, 0.4), 2);
});

/** Device pixel ratio to render at, capped for the active quality level. */
export const getCanvasPixelRatio = (): number => {
  const override = getRenderScaleOverride();
  if (override !== null) return override;
  const ratio =
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  return Math.min(ratio, getGraphicsSettings().maxPixelRatio);
};

/**
 * Persists a quality preference and reports whether a reload is required for
 * it to take effect (the WebGL context is created once, at startup).
 */
export const setStoredGraphicsQuality = (quality: GraphicsQuality): boolean => {
  try {
    window.localStorage.setItem(GRAPHICS_QUALITY_STORAGE_KEY, quality);
  } catch (err) {
    return false;
  }
  return quality !== getGraphicsSettings().quality;
};
