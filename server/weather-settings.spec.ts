import { normalizeWeatherSettings } from "./maps";

describe("normalizeWeatherSettings", () => {
  it("donne des réglages complets par défaut", () => {
    expect(normalizeWeatherSettings(null)).toEqual({
      type: "none",
      intensity: 0.5,
      windAngle: 0,
      tokensAboveWeather: false,
      timeOfDay: "day",
      timeIntensity: 0,
      lightAngle: -30,
      fireflies: 0.5,
    });
  });

  it("convertit l'ancienne météo Soleil en journée ensoleillée", () => {
    const settings = normalizeWeatherSettings({
      type: "sun",
      intensity: 0.8,
      windAngle: 40,
    });
    expect(settings.type).toBe("none");
    expect(settings.timeOfDay).toBe("day");
    expect(settings.timeIntensity).toBe(0.8);
    expect(settings.lightAngle).toBe(40);
  });

  it("convertit l'ancienne météo Nuit en nuit, lucioles comprises", () => {
    const settings = normalizeWeatherSettings({
      type: "moon",
      intensity: 0.6,
      windAngle: 0.3,
    });
    expect(settings.type).toBe("none");
    expect(settings.timeOfDay).toBe("night");
    expect(settings.timeIntensity).toBe(0.6);
    expect(settings.fireflies).toBe(0.3);
  });

  it("garde une nuit pluvieuse telle quelle", () => {
    const settings = normalizeWeatherSettings({
      type: "rain",
      intensity: 0.7,
      windAngle: -20,
      timeOfDay: "night",
      timeIntensity: 0.5,
    });
    expect(settings.type).toBe("rain");
    expect(settings.timeOfDay).toBe("night");
    expect(settings.windAngle).toBe(-20);
  });

  it("accepte le moment Intérieur et refuse un moment inconnu", () => {
    expect(
      normalizeWeatherSettings({ type: "none", timeOfDay: "indoor" } as any)
        .timeOfDay
    ).toBe("indoor");
    expect(
      normalizeWeatherSettings({ type: "none", timeOfDay: "dusk" } as any)
        .timeOfDay
    ).toBe("day");
  });

  it("borne les valeurs hors limites", () => {
    const settings = normalizeWeatherSettings({
      type: "rain",
      intensity: 4,
      windAngle: -400,
      timeIntensity: -1,
    });
    expect(settings.intensity).toBe(1);
    expect(settings.windAngle).toBe(-60);
    expect(settings.timeIntensity).toBe(0);
  });
});
