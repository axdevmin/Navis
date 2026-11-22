export type WeatherType =
  | "none"
  | "rain"
  | "storm"
  | "snow"
  | "sun"
  | "moon"
  | "wind"
  | "cloudy"
  | "fog"
  | "bloodRain";

export type TimeOfDay = "morning" | "day" | "night";

export type WeatherSettings = {
  /** Précipitations et ciel ("sun" et "moon" ne sont plus utilisés). */
  type: WeatherType;
  intensity: number;
  windAngle: number;
  /** Les tokens passent par-dessus la météo au lieu d'être voilés par elle. */
  tokensAboveWeather?: boolean;
  /** Moment de la journée, indépendant de la météo (nuit + pluie…). */
  timeOfDay?: TimeOfDay;
  /** Force de l'effet du moment : lumière du matin, soleil, obscurité. */
  timeIntensity?: number;
  /** Direction de la lumière, de −60° (gauche) à 60° (droite). */
  lightAngle?: number;
  /** Lucioles la nuit, de 0 à 1. */
  fireflies?: number;
};
