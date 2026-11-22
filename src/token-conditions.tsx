import * as React from "react";
import * as THREE from "three";
import styled from "@emotion/styled/macro";
import { ds } from "./design-system";

/**
 * États qu'on peut poser sur un token : une icône et une couleur, rien de
 * plus. La liste est volontairement fixe et courte pour rester lisible sur la
 * carte ; elle couvre les états les plus courants des jeux de rôle.
 *
 * Les icônes sont des tracés SVG (grille 24 × 24, trait de 2) dessinés tels
 * quels dans l'interface et sur une texture pour la carte.
 */
export type TokenCondition = {
  id: string;
  label: string;
  color: string;
  paths: Array<string>;
  /** Remplit le tracé au lieu de seulement le dessiner. */
  filled?: boolean;
  /** Trace en pointillés. */
  dashed?: boolean;
};

const DROPLET = "M12 2.69l5.66 5.66a8 8 0 11-11.31 0z";
const CIRCLE = "M12 3a9 9 0 100 18 9 9 0 000-18z";

export const TOKEN_CONDITIONS: Array<TokenCondition> = [
  { id: "poisoned", label: "Empoisonné", color: "#46c17a", paths: [DROPLET] },
  {
    id: "burning",
    label: "En feu",
    color: "#f0843c",
    paths: [
      "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 002.5 2.5z",
    ],
  },
  {
    id: "acid",
    label: "Acide",
    color: "#b5d334",
    paths: [
      "M9 3h6",
      "M10 3v6.5L4.5 19a1.5 1.5 0 001.3 2h12.4a1.5 1.5 0 001.3-2L14 9.5V3",
      "M7.5 15h9",
    ],
  },
  {
    id: "bleeding",
    label: "Saignement",
    color: "#e5484d",
    paths: [DROPLET],
    filled: true,
  },
  {
    id: "frozen",
    label: "Gelé",
    color: "#5ac8fa",
    paths: [
      "M12 2v20",
      "M3.5 7l17 10",
      "M3.5 17l17-10",
      "M9 4l3 2 3-2",
      "M9 20l3-2 3 2",
    ],
  },
  {
    id: "stunned",
    label: "Étourdi",
    color: "#e3c34a",
    paths: [
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    ],
  },
  {
    id: "confused",
    label: "Confus",
    color: "#a77bdb",
    paths: [CIRCLE, "M9.1 9a3 3 0 015.8 1c0 2-2.9 2.5-2.9 4", "M12 17.5h.01"],
  },
  {
    id: "charmed",
    label: "Charmé",
    color: "#e66fa8",
    paths: [
      "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    ],
  },
  {
    id: "frightened",
    label: "Effrayé",
    color: "#c9a0dc",
    paths: [
      "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
      "M12 9v4",
      "M12 17h.01",
    ],
  },
  {
    id: "paralyzed",
    label: "Paralysé",
    color: "#f5d77a",
    paths: ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"],
  },
  {
    id: "blinded",
    label: "Aveuglé",
    color: "#9aa0a6",
    paths: [
      "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94",
      "M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19",
      "M2 2l20 20",
    ],
  },
  {
    id: "restrained",
    label: "Entravé",
    color: "#c08f5a",
    paths: [
      "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71",
      "M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
    ],
  },
  {
    id: "prone",
    label: "À terre",
    color: "#8b95a3",
    paths: ["M12 4v14", "M19 11l-7 7-7-7", "M4 21h16"],
  },
  {
    id: "invisible",
    label: "Invisible",
    color: "#c7d2fe",
    paths: [CIRCLE],
    dashed: true,
  },
  {
    id: "concentrating",
    label: "Concentration",
    color: "#6aa7ff",
    paths: [
      CIRCLE,
      "M12 7a5 5 0 100 10 5 5 0 000-10z",
      "M12 11a1 1 0 100 2 1 1 0 000-2z",
    ],
  },
  {
    id: "blessed",
    label: "Béni",
    color: "#ffe08a",
    paths: [
      "M12 8a4 4 0 100 8 4 4 0 000-8z",
      "M12 2v2",
      "M12 20v2",
      "M4.9 4.9l1.4 1.4",
      "M17.7 17.7l1.4 1.4",
      "M2 12h2",
      "M20 12h2",
      "M4.9 19.1l1.4-1.4",
      "M17.7 6.3l1.4-1.4",
    ],
  },
];

const CONDITIONS_BY_ID = new Map(TOKEN_CONDITIONS.map((c) => [c.id, c]));

/**
 * Pastille « porte une lumière » : la flamme des états, en couleur de
 * lumière. Ce n'est pas un état, elle suit le réglage Lumière du token.
 */
export const LIGHT_BADGE: TokenCondition = {
  id: "light",
  label: "Porte une lumière",
  color: "#ffc061",
  paths: CONDITIONS_BY_ID.get("burning")!.paths,
};

/** États connus, dans l'ordre du catalogue, sans doublon. */
export const resolveConditions = (
  ids: ReadonlyArray<string> | null | undefined
): Array<TokenCondition> => {
  if (!ids || ids.length === 0) return [];
  const wanted = new Set(ids);
  return TOKEN_CONDITIONS.filter((condition) => wanted.has(condition.id));
};

/**
 * Les états transitent par le panneau du token sous forme de texte
 * (« poisoned,burning ») : c'est le format que le magasin de valeurs du
 * panneau sait conserver.
 */
export const serializeConditions = (ids: ReadonlyArray<string>): string =>
  ids.filter((id) => CONDITIONS_BY_ID.has(id)).join(",");

export const parseConditions = (value: unknown): Array<string> =>
  typeof value === "string" && value !== ""
    ? value.split(",").filter((id) => CONDITIONS_BY_ID.has(id))
    : [];

/** Encre des icônes : sombre, lisible sur toutes les couleurs du catalogue. */
const ICON_INK = "#141416";

/** Icône d'un état pour l'interface. */
export const ConditionIcon = (props: {
  condition: TokenCondition;
  size?: number;
  color?: string;
}): React.ReactElement => {
  const { condition } = props;
  const color = props.color ?? "currentColor";
  return (
    <svg
      width={props.size ?? 14}
      height={props.size ?? 14}
      viewBox="0 0 24 24"
      fill={condition.filled ? color : "none"}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={condition.dashed ? "3 3" : undefined}
      aria-hidden="true"
    >
      {condition.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Pastille ronde de l'état pour la carte (une texture par état, partagée par
 * tous les tokens).
 */
export const getConditionTexture = (
  condition: TokenCondition
): THREE.CanvasTexture => {
  const cached = textureCache.get(condition.id);
  if (cached) return cached;

  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;

  // pastille : liseré sombre pour se détacher de n'importe quelle carte
  ctx.fillStyle = "rgba(11, 11, 12, 0.85)";
  ctx.beginPath();
  ctx.arc(center, center, center - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = condition.color;
  ctx.beginPath();
  ctx.arc(center, center, center - 6, 0, Math.PI * 2);
  ctx.fill();

  // icône centrée, à environ 55 % du diamètre
  const iconSize = size * 0.55;
  const scale = iconSize / 24;
  ctx.save();
  ctx.translate(center - iconSize / 2, center - iconSize / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = ICON_INK;
  ctx.fillStyle = ICON_INK;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (condition.dashed) ctx.setLineDash([3, 3]);
  for (const d of condition.paths) {
    const path = new Path2D(d);
    if (condition.filled) ctx.fill(path);
    ctx.stroke(path);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(condition.id, texture);
  return texture;
};

/**
 * Grille d'états à cocher (inspecteur, clic droit, suivi de combat). Un état
 * actif prend sa couleur ; le nom s'affiche au survol.
 */
export const ConditionToggleGrid = (props: {
  value: ReadonlyArray<string>;
  onChange: (ids: Array<string>) => void;
  columns?: number;
}): React.ReactElement => {
  const active = new Set(props.value);
  return (
    <ToggleGrid
      role="group"
      aria-label="États du token"
      columns={props.columns ?? 8}
    >
      {TOKEN_CONDITIONS.map((condition) => {
        const isOn = active.has(condition.id);
        return (
          <ToggleButton
            key={condition.id}
            type="button"
            title={condition.label}
            aria-label={condition.label}
            aria-pressed={isOn}
            tint={condition.color}
            isOn={isOn}
            onClick={(ev) => {
              ev.stopPropagation();
              props.onChange(
                isOn
                  ? props.value.filter((id) => id !== condition.id)
                  : [...props.value, condition.id]
              );
            }}
          >
            <ConditionIcon
              condition={condition}
              size={15}
              color={isOn ? ICON_INK : undefined}
            />
          </ToggleButton>
        );
      })}
    </ToggleGrid>
  );
};

const ToggleGrid = styled.div<{ columns: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.columns}, 28px);
  gap: 4px;
`;

const ToggleButton = styled.button<{ tint: string; isOn: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: ${ds.radii.sm};
  border: 1px solid ${(p) => (p.isOn ? p.tint : ds.colors.border)};
  background: ${(p) => (p.isOn ? p.tint : "transparent")};
  color: ${(p) => p.tint};
  cursor: pointer;
  transition: background ${ds.transitions.fast},
    border-color ${ds.transitions.fast};

  &:hover {
    border-color: ${(p) => p.tint};
    background: ${(p) => (p.isOn ? p.tint : ds.colors.surfaceHover)};
  }
`;
