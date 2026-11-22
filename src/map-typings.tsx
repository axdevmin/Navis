export type TokenType =
  | "character"
  | "creature"
  | "object"
  | "hazard"
  | "marker";

export type CombatFaction = "hero" | "enemy" | "neutral";

export type MapGridEntity = {
  color: string;
  offsetX: number;
  offsetY: number;
  columnWidth: number;
  columnHeight: number;
};

export type MapTokenEntity = {
  id: string;
  radius: number;
  rotation: number;
  color: string;
  label: string;
  x: number;
  y: number;
  isVisibleForPlayers: boolean;
  isMovableByPlayers: boolean;
  isLocked: boolean;
  isAlive: boolean;
  tokenType: TokenType;
  imageUrl: string | null;
  /** Identifiants des états (empoisonné, en feu…), voir token-conditions. */
  conditions?: Array<string>;
  reference: null | {
    type: "note";
    id: string;
  };
  tokenImageId: string | null;
};

export type MapEntity = {
  id: string;
  showGridToPlayers: boolean;
  showGrid: boolean;
  grid: null | MapGridEntity;
  tokens: Array<MapTokenEntity>;
};

export type MarkedAreaEntity = {
  id: string;
  x: number;
  y: number;
};
