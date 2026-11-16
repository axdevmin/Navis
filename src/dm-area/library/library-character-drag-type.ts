import type { CombatFaction } from "../../map-typings";

export const LIBRARY_CHARACTER_DRAG_TYPE = "application/navis-library-character";

export type LibraryCharacterDragPayload = {
  label: string;
  faction: CombatFaction;
  color: string;
  imageUrl: string | null;
};
