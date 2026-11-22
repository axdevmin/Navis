import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useMutation } from "relay-hooks";
import styled from "@emotion/styled/macro";
import { Toolbar } from "../toolbar";
import type { TimeOfDay, WeatherType } from "../weather-types";
import { weatherControls_MapFragment$key } from "./__generated__/weatherControls_MapFragment.graphql";
import { weatherControls_mapUpdateWeatherMutation } from "./__generated__/weatherControls_mapUpdateWeatherMutation.graphql";
import { ds } from "../design-system";
import * as Icon from "../feather-icons";
import { ToggleRow } from "../token-inspector";

const WeatherControlsMapFragment = graphql`
  fragment weatherControls_MapFragment on Map {
    id
    weatherSettings {
      type
      intensity
      windAngle
      tokensAboveWeather
      timeOfDay
      timeIntensity
      lightAngle
      fireflies
    }
  }
`;

export const MapUpdateWeatherMutation = graphql`
  mutation weatherControls_mapUpdateWeatherMutation(
    $input: MapUpdateWeatherInput!
  ) {
    mapUpdateWeather(input: $input) {
      updatedMap {
        weatherSettings {
          type
          intensity
          windAngle
          tokensAboveWeather
          timeOfDay
          timeIntensity
          lightAngle
          fireflies
        }
      }
    }
  }
`;

type WeatherOption = {
  type: WeatherType;
  label: string;
  icon: typeof Icon.Cloud;
};

/** Météos proposées ; elles se combinent avec le moment de la journée. */
export const WEATHER_OPTIONS: WeatherOption[] = [
  { type: "none", label: "Aucune", icon: Icon.Slash },
  { type: "cloudy", label: "Nuageux", icon: Icon.Cloud },
  { type: "fog", label: "Brume", icon: Icon.CloudFog },
  { type: "rain", label: "Pluie", icon: Icon.CloudRain },
  { type: "storm", label: "Orage", icon: Icon.CloudLightning },
  { type: "bloodRain", label: "Sang", icon: Icon.CloudBlood },
  { type: "snow", label: "Neige", icon: Icon.CloudSnow },
  { type: "wind", label: "Vent", icon: Icon.Wind },
];

type TimeOption = {
  value: TimeOfDay;
  label: string;
  icon: typeof Icon.Cloud;
  /** Force de départ quand on choisit ce moment. */
  defaultIntensity: number;
};

export const TIME_OF_DAY_OPTIONS: TimeOption[] = [
  {
    value: "morning",
    label: "Matin",
    icon: Icon.Sunrise,
    defaultIntensity: 0.6,
  },
  { value: "day", label: "Journée", icon: Icon.Sun, defaultIntensity: 0 },
  { value: "night", label: "Nuit", icon: Icon.Moon, defaultIntensity: 0.6 },
];

type WeatherValues = {
  type: string;
  intensity: number;
  windAngle: number;
};

/**
 * Réglages à appliquer quand on passe à un autre type de météo : le second
 * curseur change de sens selon le type, d'où une valeur de départ adaptée.
 */
export const getWeatherPatchForType = (
  current: WeatherValues,
  type: WeatherType
): { type: WeatherType; windAngle?: number } => ({
  type,
  ...(type === current.type
    ? {}
    : type === "cloudy"
    ? { windAngle: 0.6 }
    : type === "wind"
    ? { windAngle: -30 }
    : type === "fog"
    ? { windAngle: 0 }
    : {}),
});

const Container = styled.div`
  padding: 12px;
  width: 340px;
  max-width: calc(100vw - 24px);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
`;

const Divider = styled.div`
  height: 1px;
  margin: 2px -12px;
  background: ${ds.colors.border};
`;

/** Matin / Journée / Nuit : un contrôle segmenté sur toute la largeur. */
const Segmented = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  padding: 2px;
  border-radius: ${ds.radii.md};
  background: ${ds.colors.surfaceHover};
`;

const SegmentButton = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  border: none;
  border-radius: ${ds.radii.sm};
  background: ${(p) => (p.isActive ? ds.colors.selected : "transparent")};
  color: ${(p) =>
    p.isActive ? ds.colors.textPrimary : ds.colors.textSecondary};
  font-family: ${ds.font.sans};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background ${ds.transitions.fast}, color ${ds.transitions.fast};

  &:hover {
    color: ${ds.colors.textPrimary};
  }
`;

const WeatherGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
`;

const WeatherBtn = styled.button<{ isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 56px;
  border-radius: ${ds.radii.md};
  border: none;
  background: ${(p) => (p.isActive ? ds.colors.accentMuted : "transparent")};
  color: ${(p) => (p.isActive ? ds.colors.accent : ds.colors.textSecondary)};
  cursor: pointer;
  font-family: ${ds.font.sans};
  font-size: 12px;
  font-weight: 500;
  transition: background ${ds.transitions.fast}, color ${ds.transitions.fast};

  &:hover {
    background: ${(p) =>
      p.isActive ? ds.colors.accentMuted : ds.colors.hover};
    color: ${(p) => (p.isActive ? ds.colors.accent : ds.colors.textPrimary)};
  }
`;

const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: ${ds.colors.textSecondary};
  font-family: ${ds.font.sans};

  span.value {
    color: ${ds.colors.textMuted};
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
`;

/** Même taille de texte que les libellés des curseurs. */
const ToggleWrap = styled.div`
  font-size: 12px;
  font-family: ${ds.font.sans};
`;

const SliderInput = styled.input`
  width: 100%;
`;

const Slider = (props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}): React.ReactElement => (
  <SliderRow>
    <SliderLabel>
      <span>{props.label}</span>
      <span className="value">{props.format(props.value)}</span>
    </SliderLabel>
    <SliderInput
      type="range"
      aria-label={props.label}
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value}
      onChange={(e) => props.onChange(parseFloat(e.target.value))}
    />
  </SliderRow>
);

const percent = (value: number) => `${Math.round(value * 100)}%`;
const degrees = (value: number) => `${Math.round(value)}°`;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const WeatherControls = (props: {
  map: weatherControls_MapFragment$key;
}): React.ReactElement => {
  const map = useFragment(WeatherControlsMapFragment, props.map);
  const [updateWeather] = useMutation<weatherControls_mapUpdateWeatherMutation>(
    MapUpdateWeatherMutation
  );

  const weather = map.weatherSettings;
  const timeOfDay = weather.timeOfDay as TimeOfDay;

  type Patch = {
    type?: WeatherType;
    intensity?: number;
    windAngle?: number;
    tokensAboveWeather?: boolean;
    timeOfDay?: TimeOfDay;
    timeIntensity?: number;
    lightAngle?: number;
    fireflies?: number;
  };

  const apply = (patch: Patch) => {
    updateWeather({
      variables: {
        input: {
          mapId: map.id,
          weatherSettings: {
            type: patch.type ?? (weather.type as WeatherType),
            intensity: patch.intensity ?? weather.intensity,
            windAngle: patch.windAngle ?? weather.windAngle,
            tokensAboveWeather:
              patch.tokensAboveWeather ?? weather.tokensAboveWeather,
            timeOfDay: patch.timeOfDay ?? timeOfDay,
            timeIntensity: patch.timeIntensity ?? weather.timeIntensity,
            lightAngle: patch.lightAngle ?? weather.lightAngle,
            fireflies: patch.fireflies ?? weather.fireflies,
          },
        },
      },
    });
  };

  const selectTime = (option: TimeOption) => {
    if (option.value === timeOfDay) return;
    apply({
      timeOfDay: option.value,
      timeIntensity: option.defaultIntensity,
    });
  };

  return (
    <Toolbar.Popup>
      <Container>
        <SectionTitle>Moment de la journée</SectionTitle>
        <Segmented role="radiogroup" aria-label="Moment de la journée">
          {TIME_OF_DAY_OPTIONS.map((option) => (
            <SegmentButton
              key={option.value}
              role="radio"
              aria-checked={timeOfDay === option.value}
              isActive={timeOfDay === option.value}
              onClick={() => selectTime(option)}
            >
              <option.icon boxSize="14px" />
              {option.label}
            </SegmentButton>
          ))}
        </Segmented>

        <Slider
          label={
            timeOfDay === "night"
              ? "Obscurité"
              : timeOfDay === "morning"
              ? "Lumière du matin"
              : "Ensoleillement"
          }
          value={weather.timeIntensity}
          min={0}
          max={1}
          step={0.05}
          format={percent}
          onChange={(timeIntensity) => apply({ timeIntensity })}
        />
        {timeOfDay === "night" ? (
          <Slider
            label="Lucioles"
            value={weather.fireflies}
            min={0}
            max={1}
            step={0.05}
            format={percent}
            onChange={(fireflies) => apply({ fireflies })}
          />
        ) : (
          <Slider
            label="Direction de la lumière"
            value={weather.lightAngle}
            min={-60}
            max={60}
            step={5}
            format={degrees}
            onChange={(lightAngle) => apply({ lightAngle })}
          />
        )}

        <Divider />

        <SectionTitle>Météo</SectionTitle>
        <WeatherGrid>
          {WEATHER_OPTIONS.map((opt) => (
            <WeatherBtn
              key={opt.type}
              isActive={weather.type === opt.type}
              onClick={() => apply(getWeatherPatchForType(weather, opt.type))}
            >
              <opt.icon boxSize="18px" />
              <span>{opt.label}</span>
            </WeatherBtn>
          ))}
        </WeatherGrid>

        {weather.type !== "none" ? (
          <>
            <Slider
              label={weather.type === "fog" ? "Densité" : "Intensité"}
              value={weather.intensity}
              min={0}
              max={1}
              step={0.05}
              format={percent}
              onChange={(intensity) => apply({ intensity })}
            />
            {weather.type === "cloudy" ? (
              <Slider
                label="Ombrage"
                value={clamp01(weather.windAngle)}
                min={0}
                max={1}
                step={0.05}
                format={percent}
                onChange={(windAngle) => apply({ windAngle })}
              />
            ) : (
              <Slider
                label={
                  weather.type === "fog"
                    ? "Direction de la dérive"
                    : "Direction du vent"
                }
                value={weather.windAngle}
                min={-60}
                max={60}
                step={5}
                format={degrees}
                onChange={(windAngle) => apply({ windAngle })}
              />
            )}
          </>
        ) : null}

        <Divider />

        <ToggleWrap>
          <ToggleRow
            label="Tokens au-dessus de la météo"
            checked={weather.tokensAboveWeather}
            onChange={(tokensAboveWeather) => apply({ tokensAboveWeather })}
          />
        </ToggleWrap>
      </Container>
    </Toolbar.Popup>
  );
};
