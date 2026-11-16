import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useMutation } from "relay-hooks";
import styled from "@emotion/styled/macro";
import { Toolbar } from "../toolbar";
import type { WeatherType } from "../weather-types";
import { weatherControls_MapFragment$key } from "./__generated__/weatherControls_MapFragment.graphql";
import { weatherControls_mapUpdateWeatherMutation } from "./__generated__/weatherControls_mapUpdateWeatherMutation.graphql";
import { ds } from "../design-system";
import * as Icon from "../feather-icons";

const WeatherControlsMapFragment = graphql`
  fragment weatherControls_MapFragment on Map {
    id
    weatherSettings {
      type
      intensity
      windAngle
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

export const WEATHER_OPTIONS: WeatherOption[] = [
  { type: "none", label: "Aucune", icon: Icon.Slash },
  { type: "sun", label: "Soleil", icon: Icon.Sun },
  { type: "cloudy", label: "Nuageux", icon: Icon.Cloud },
  { type: "rain", label: "Pluie", icon: Icon.CloudRain },
  { type: "storm", label: "Orage", icon: Icon.CloudLightning },
  { type: "snow", label: "Neige", icon: Icon.CloudSnow },
  { type: "wind", label: "Vent", icon: Icon.Wind },
  { type: "moon", label: "Nuit", icon: Icon.Moon },
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
    : type === "moon"
    ? { windAngle: 0.7 }
    : type === "cloudy"
    ? { windAngle: 0.6 }
    : type === "wind"
    ? { windAngle: -30 }
    : {}),
});

const Container = styled.div`
  padding: 12px;
  min-width: 292px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
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

const SliderInput = styled.input`
  width: 100%;
`;

export const WeatherControls = (props: {
  map: weatherControls_MapFragment$key;
}): React.ReactElement => {
  const map = useFragment(WeatherControlsMapFragment, props.map);
  const [updateWeather] = useMutation<weatherControls_mapUpdateWeatherMutation>(
    MapUpdateWeatherMutation
  );

  const weather = map.weatherSettings;

  const apply = (patch: Partial<typeof weather>) => {
    updateWeather({
      variables: {
        input: {
          mapId: map.id,
          weatherSettings: {
            type: patch.type ?? weather.type,
            intensity: patch.intensity ?? weather.intensity,
            windAngle: patch.windAngle ?? weather.windAngle,
          },
        },
      },
    });
  };

  return (
    <Toolbar.Popup>
      <Container>
        <Title>Météo</Title>

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

        {weather.type !== "none" && (
          <>
            <SliderRow>
              <SliderLabel>
                <span>
                  {weather.type === "moon" ? "Assombrissement" : "Intensité"}
                </span>
                <span className="value">
                  {Math.round(weather.intensity * 100)}%
                </span>
              </SliderLabel>
              <SliderInput
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={weather.intensity}
                onChange={(e) =>
                  apply({ intensity: parseFloat(e.target.value) })
                }
              />
            </SliderRow>

            {weather.type === "moon" && (
              <SliderRow>
                <SliderLabel>
                  <span>Effets (étoiles & brume)</span>
                  <span className="value">
                    {Math.round(
                      Math.max(0, Math.min(1, weather.windAngle)) * 100
                    )}
                    %
                  </span>
                </SliderLabel>
                <SliderInput
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={Math.max(0, Math.min(1, weather.windAngle))}
                  onChange={(e) =>
                    apply({ windAngle: parseFloat(e.target.value) })
                  }
                />
              </SliderRow>
            )}

            {weather.type === "cloudy" && (
              <SliderRow>
                <SliderLabel>
                  <span>Ombrage</span>
                  <span className="value">
                    {Math.round(
                      Math.max(0, Math.min(1, weather.windAngle)) * 100
                    )}
                    %
                  </span>
                </SliderLabel>
                <SliderInput
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={Math.max(0, Math.min(1, weather.windAngle))}
                  onChange={(e) =>
                    apply({ windAngle: parseFloat(e.target.value) })
                  }
                />
              </SliderRow>
            )}

            {weather.type !== "sun" &&
              weather.type !== "moon" &&
              weather.type !== "cloudy" && (
                <SliderRow>
                  <SliderLabel>
                    <span>Direction du vent</span>
                    <span className="value">
                      {Math.round(weather.windAngle)}°
                    </span>
                  </SliderLabel>
                  <SliderInput
                    type="range"
                    min={-60}
                    max={60}
                    step={5}
                    value={weather.windAngle}
                    onChange={(e) =>
                      apply({ windAngle: parseFloat(e.target.value) })
                    }
                  />
                </SliderRow>
              )}
          </>
        )}
      </Container>
    </Toolbar.Popup>
  );
};
