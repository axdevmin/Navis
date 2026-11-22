import * as React from "react";

/**
 * Sources de lumière qu'un token peut porter. Le type règle d'un coup la
 * couleur, la portée par défaut et la façon dont la flamme vacille.
 */
export type LightSourceId =
  | "torch"
  | "candle"
  | "campfire"
  | "fireplace"
  | "lantern"
  | "magic";

export type LightSource = {
  id: LightSourceId;
  label: string;
  /** Couleur de la lueur, de 0 à 1. */
  color: [number, number, number];
  /** Portée par défaut, en cases. */
  defaultRadius: number;
  /** Ampleur du vacillement (0 : lumière fixe). */
  flicker: number;
  /** Vitesse du vacillement. */
  flickerSpeed: number;
};

export const LIGHT_SOURCES: Array<LightSource> = [
  {
    id: "torch",
    label: "Torche",
    color: [1, 0.6, 0.25],
    defaultRadius: 4,
    flicker: 0.12,
    flickerSpeed: 9,
  },
  {
    id: "candle",
    label: "Bougie",
    color: [1, 0.75, 0.42],
    defaultRadius: 2,
    flicker: 0.1,
    flickerSpeed: 7,
  },
  {
    id: "campfire",
    label: "Feu de camp",
    color: [1, 0.5, 0.18],
    defaultRadius: 6,
    flicker: 0.14,
    flickerSpeed: 8,
  },
  {
    id: "fireplace",
    label: "Cheminée",
    color: [1, 0.55, 0.22],
    defaultRadius: 5,
    flicker: 0.1,
    flickerSpeed: 6,
  },
  {
    id: "lantern",
    label: "Lanterne",
    color: [1, 0.82, 0.55],
    defaultRadius: 5,
    flicker: 0.03,
    flickerSpeed: 3,
  },
  {
    id: "magic",
    label: "Magique",
    color: [0.55, 0.7, 1],
    defaultRadius: 5,
    flicker: 0.06,
    flickerSpeed: 1.6,
  },
];

const LIGHT_SOURCES_BY_ID = new Map(LIGHT_SOURCES.map((s) => [s.id, s]));

export const getLightSource = (
  id: string | null | undefined
): LightSource | null =>
  id ? LIGHT_SOURCES_BY_ID.get(id as LightSourceId) ?? null : null;

/** Lumière des pièces éclairées : chaude, sans vacillement. */
export const ROOM_LIGHT_COLOR: [number, number, number] = [1, 0.72, 0.42];

/** Une lumière prête à dessiner, dans le repère de la scène. */
export type SceneLight = {
  id: string;
  x: number;
  y: number;
  /** Portée dans le repère de la scène. */
  radius: number;
  source: LightSource;
};

export type MapLighting = {
  lights: Array<SceneLight>;
  /** Pièces éclairées : polygones dans le repère de la scène. */
  litRooms: Array<Array<[number, number]>>;
};

export const MapLightingContext = React.createContext<MapLighting>({
  lights: [],
  litRooms: [],
});

/**
 * Positions en direct des tokens qui portent une lumière, mises à jour à
 * chaque image pendant qu'on les déplace : la lueur suit le token sans
 * attendre l'enregistrement.
 */
export const liveLightPositions = new Map<string, [number, number]>();

/** Une vision sans mémoire : seul ce cercle est visible dans le brouillard. */
export type SceneVision = {
  /** Identifiant du token (positions en direct). */
  id: string;
  x: number;
  y: number;
  radius: number;
};

export type MapVision = {
  /** Cercles de vision, dans le repère de la scène. */
  visions: Array<SceneVision>;
  /** Mêmes cercles en pixels de l'image (tokens cachés ou non). */
  imageVisions: Array<{ x: number; y: number; radius: number }>;
  /** Pièces fermées (polygones dans le repère de la scène). */
  closedRooms: Array<Array<[number, number]>>;
  /** Pièces fermées, sommets en pixels de l'image. */
  closedRoomsImage: Array<ReadonlyArray<number>>;
};

export const MapVisionContext = React.createContext<MapVision>({
  visions: [],
  imageVisions: [],
  closedRooms: [],
  closedRoomsImage: [],
});
