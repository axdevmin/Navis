import type { CombatFaction } from "../../map-typings";
import { ds } from "../../design-system";

export const FACTION_META: Record<
  CombatFaction,
  { label: string; color: string; emoji: string }
> = {
  hero: { label: "Héros", color: ds.colors.accent, emoji: "🛡" },
  enemy: { label: "Ennemi", color: ds.colors.danger, emoji: "👹" },
  neutral: { label: "Neutre", color: "#d4a94e", emoji: "➖" },
};

export const FACTION_ORDER: Array<CombatFaction> = ["hero", "enemy", "neutral"];

/**
 * Relay enums include a "%future added value" fallback member for forward
 * compatibility; this guards against indexing FACTION_META with it.
 */
export const getFactionMeta = (faction: string) =>
  FACTION_META[faction as CombatFaction] ?? FACTION_META.neutral;

export const defaultFactionForTokenType = (
  tokenType: string
): CombatFaction => {
  switch (tokenType) {
    case "character":
      return "hero";
    case "creature":
    case "hazard":
      return "enemy";
    default:
      return "neutral";
  }
};
