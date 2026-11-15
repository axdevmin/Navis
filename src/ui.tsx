import * as React from "react";
import styled from "@emotion/styled/macro";
import { ds } from "./design-system";

/**
 * Primitives visuelles partagées de Navis v2.
 * Tout ce qui flotte au-dessus de la carte utilise `floatingSurface`.
 */

/** Surface d'une fenêtre flottante : graphite, filet 1 px, liseré haut. */
export const floatingSurface = `
  background: ${ds.colors.glass};
  backdrop-filter: ${ds.blur.md};
  -webkit-backdrop-filter: ${ds.blur.md};
  border: 1px solid ${ds.colors.borderStrong};
  border-radius: ${ds.radii.lg};
  box-shadow: ${ds.shadows.lg};
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
`;

/** Base d'un contrôle cliquable de 32 px posé sur une surface. */
export const controlBase = `
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  border: none;
  border-radius: ${ds.radii.md};
  background: transparent;
  color: ${ds.colors.textSecondary};
  font-family: ${ds.font.sans};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  white-space: nowrap;
  cursor: pointer;
  transition: background ${ds.transitions.fast}, color ${ds.transitions.fast};

  &:hover {
    background: ${ds.colors.hover};
    color: ${ds.colors.textPrimary};
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;

const KbdBase = styled.kbd<{ tone?: "accent" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 5px;
  font-family: ${ds.font.sans};
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  background: ${(p) =>
    p.tone === "accent"
      ? "rgba(27, 20, 5, 0.14)"
      : "rgba(255, 255, 255, 0.08)"};
  color: ${(p) =>
    p.tone === "accent" ? ds.colors.onAccent : ds.colors.textSecondary};
  box-shadow: ${(p) =>
    p.tone === "accent" ? "none" : "inset 0 -1px 0 rgba(255, 255, 255, 0.08)"};
`;

const KbdGroup = styled.span`
  display: inline-flex;
  gap: 3px;
  flex-shrink: 0;
`;

const isMac =
  typeof window !== "undefined" && /Mac|iP(hone|ad)/.test(navigator.platform);

/** Touche « commande » de la plateforme : ⌘ sur Mac, Ctrl ailleurs. */
export const MOD_KEY = isMac ? "⌘" : "Ctrl";

/** Vrai si l'événement porte le modificateur principal de la plateforme. */
export const hasModKey = (ev: KeyboardEvent | React.KeyboardEvent): boolean =>
  isMac ? ev.metaKey : ev.ctrlKey;

/**
 * Affiche un raccourci sous forme de touches : `<Kbd keys={["mod", "S"]} />`.
 * "mod" est remplacé par ⌘ ou Ctrl selon la plateforme.
 */
export const Kbd = (props: {
  keys: ReadonlyArray<string>;
  onAccent?: boolean;
}): React.ReactElement => (
  <KbdGroup aria-hidden>
    {props.keys.map((key, index) => (
      <KbdBase key={index} tone={props.onAccent ? "accent" : undefined}>
        {key === "mod" ? MOD_KEY : key}
      </KbdBase>
    ))}
  </KbdGroup>
);
