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

export type WeatherSettings = {
  type: WeatherType;
  intensity: number;
  windAngle: number;
  /** Les tokens passent par-dessus la météo au lieu d'être voilés par elle. */
  tokensAboveWeather?: boolean;
};
