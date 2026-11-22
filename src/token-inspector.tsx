import * as React from "react";
import styled from "@emotion/styled/macro";
import type { StoreType } from "leva/dist/declarations/src/types";
import { ds } from "./design-system";
import * as Icon from "./feather-icons";
import { controlBase, floatingSurface, Kbd } from "./ui";
import { TokenImageControl } from "./leva-plugin/leva-plugin-token-image";
import {
  ConditionToggleGrid,
  parseConditions,
  resolveConditions,
  serializeConditions,
} from "./token-conditions";

/**
 * Inspecteur de token.
 *
 * Remplace le panneau générique de `leva` par une interface maison : nom en
 * tête, taille en boutons, bascules lisibles. Les valeurs vivent toujours dans
 * le « store » de chaque token (créé dans map-view), ce composant ne fait que
 * les afficher et les modifier ; il n'affiche que les champs présents dans le
 * store, ce qui le rend utilisable aussi pour une sélection multiple.
 */

type AnyData = Record<string, any>;

const TOKEN_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "character", label: "Personnage" },
  { value: "creature", label: "Créature" },
  { value: "object", label: "Objet" },
  { value: "hazard", label: "Danger" },
  { value: "marker", label: "Marqueur" },
];

const SAVE_AS_CHARACTER_KEY = "Enregistrer comme personnage";

const toNumber = (raw: string, fallback: number): number => {
  const value = parseFloat(raw);
  return Number.isNaN(value) ? fallback : value;
};

/** Accepte la position sous forme de tableau ou d'objet {x, y}. */
const readVector = (value: unknown): [number, number] => {
  if (Array.isArray(value)) return [Number(value[0]), Number(value[1])];
  const vector = value as { x?: number; y?: number } | null;
  return [Number(vector?.x ?? 0), Number(vector?.y ?? 0)];
};

/** Convertit n'importe quelle couleur CSS en #rrggbb pour le sélecteur natif. */
const toHexColor = (color: string): string => {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return "#ffffff";
  context.fillStyle = color;
  const normalized = context.fillStyle;
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : "#ffffff";
};

export const TokenInspector = (props: {
  store: StoreType;
  title: string;
  /** Replié : seul l'en-tête (nom du token) reste affiché. */
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}): React.ReactElement => {
  const { store } = props;
  // leva modifie `data` sur place : on s'abonne à l'état entier, dont la
  // référence change à chaque écriture, pour voir aussi les changements venus
  // d'ailleurs (annulation, autre écran, joueur).
  const data = store.useStore((state) => state).data as AnyData;

  const has = (key: string) => key in data;
  const valueOf = (key: string) => data[key]?.value;
  const set = (key: string, value: unknown) => {
    try {
      store.setValueAtPath(key, value, true);
    } catch (error) {
      // leva refuse une valeur identique à l'actuelle : rien à faire
    }
  };
  // Pendant une saisie, le token ignore les valeurs qui reviennent du serveur.
  const editProps = (key: string) => ({
    onFocus: () => store.emitOnEditStart(key),
    onBlur: () => store.emitOnEditEnd(key),
  });

  const [positionX, positionY] = readVector(valueOf("position"));
  // leva range le groupe de boutons sous { label, opts: { "×1": fn, … } }
  const rawPresets = data["radiusOptions"]?.opts;
  const sizePresets: Record<string, () => void> | null =
    rawPresets && typeof rawPresets.opts === "object"
      ? rawPresets.opts
      : rawPresets ?? null;

  return (
    <Panel>
      <Header isCollapsed={props.isCollapsed}>
        <CollapseButton
          type="button"
          onClick={props.onToggleCollapsed}
          aria-expanded={!props.isCollapsed}
          aria-label={
            props.isCollapsed
              ? "Déplier les propriétés du token"
              : "Replier les propriétés du token"
          }
          title={props.isCollapsed ? "Déplier" : "Replier"}
        >
          {props.isCollapsed ? (
            <Icon.ChevronRight boxSize="14px" />
          ) : (
            <Icon.ChevronDown boxSize="14px" />
          )}
        </CollapseButton>
        {props.isCollapsed ? (
          // replié : le nom sert de rappel, un clic rouvre le panneau
          <CollapsedTitle type="button" onClick={props.onToggleCollapsed}>
            {(has("text") && String(valueOf("text") ?? "").trim()) ||
              props.title}
          </CollapsedTitle>
        ) : has("text") ? (
          <NameInput
            value={valueOf("text") ?? ""}
            placeholder="Nom du token"
            aria-label="Nom du token"
            onChange={(ev) => set("text", ev.target.value)}
          />
        ) : (
          <HeaderTitle>{props.title}</HeaderTitle>
        )}
      </Header>

      {props.isCollapsed ? null : (
        <>
          {has("radius") ? (
            <Section>
              <Row>
                <RowLabel>
                  Taille
                  <Kbd keys={["+"]} />
                  <Kbd keys={["−"]} />
                </RowLabel>
                <NumberInput
                  type="number"
                  min={1}
                  step={1}
                  aria-label="Taille du token"
                  value={Math.round(Number(valueOf("radius")) * 10) / 10}
                  onChange={(ev) =>
                    set("radius", Math.max(1, toNumber(ev.target.value, 1)))
                  }
                  {...editProps("radius")}
                />
              </Row>
              {sizePresets ? (
                <Segmented
                  role="group"
                  aria-label="Taille en cases de la grille"
                >
                  {Object.entries(sizePresets).map(([label, apply]) => (
                    <SegmentButton
                      key={label}
                      onClick={apply}
                      title={`${label.replace("×", "")} case(s) de la grille`}
                    >
                      {label}
                    </SegmentButton>
                  ))}
                </Segmented>
              ) : null}
            </Section>
          ) : null}

          <Section>
            {has("isVisibleForPlayers") ? (
              <ToggleRow
                label="Visible par les joueurs"
                checked={valueOf("isVisibleForPlayers") === true}
                onChange={(checked) => set("isVisibleForPlayers", checked)}
              />
            ) : null}
            {has("isMovableByPlayers") ? (
              <ToggleRow
                label="Déplaçable par les joueurs"
                checked={valueOf("isMovableByPlayers") === true}
                onChange={(checked) => set("isMovableByPlayers", checked)}
              />
            ) : null}
            {has("isLocked") ? (
              <ToggleRow
                label="Position verrouillée"
                checked={valueOf("isLocked") === true}
                onChange={(checked) => set("isLocked", checked)}
              />
            ) : null}
            {has("isAlive") ? (
              <ToggleRow
                label="Vivant"
                checked={valueOf("isAlive") === true}
                onChange={(checked) => set("isAlive", checked)}
              />
            ) : null}
          </Section>

          {has("conditions") ? (
            <Section>
              <ConditionPicker
                value={parseConditions(valueOf("conditions"))}
                onChange={(ids) => set("conditions", serializeConditions(ids))}
              />
            </Section>
          ) : null}

          <Section>
            {has("color") ? (
              <Row>
                <RowLabel>Couleur</RowLabel>
                <ColorField>
                  <ColorSwatch
                    type="color"
                    aria-label="Couleur du token"
                    value={toHexColor(String(valueOf("color") ?? "#ffffff"))}
                    onChange={(ev) => set("color", ev.target.value)}
                    {...editProps("color")}
                  />
                </ColorField>
              </Row>
            ) : null}
            {has("tokenType") ? (
              <Row>
                <RowLabel>Type</RowLabel>
                <Select
                  aria-label="Type de token"
                  value={String(valueOf("tokenType"))}
                  onChange={(ev) => set("tokenType", ev.target.value)}
                >
                  {TOKEN_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </Row>
            ) : null}
            {has("tokenImageId") ? (
              <Row>
                <RowLabel>Image</RowLabel>
                <TokenImageControl
                  value={valueOf("tokenImageId") ?? null}
                  setValue={(value) => set("tokenImageId", value)}
                />
              </Row>
            ) : null}
          </Section>

          {has("rotation") || has("position") ? (
            <Details>
              <DetailsSummary>Position et rotation</DetailsSummary>
              <Section>
                {has("rotation") ? (
                  <Row>
                    <RowLabel>Rotation</RowLabel>
                    <RangeInput
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      aria-label="Rotation du token"
                      value={Number(valueOf("rotation")) || 0}
                      onChange={(ev) =>
                        set("rotation", toNumber(ev.target.value, 0))
                      }
                      onPointerDown={() => store.emitOnEditStart("rotation")}
                      onPointerUp={() => store.emitOnEditEnd("rotation")}
                      onBlur={() => store.emitOnEditEnd("rotation")}
                    />
                    <ValueHint>
                      {Math.round(Number(valueOf("rotation")))}°
                    </ValueHint>
                  </Row>
                ) : null}
                {has("position") ? (
                  <Row>
                    <RowLabel>Position</RowLabel>
                    <PairInputs>
                      <NumberInput
                        type="number"
                        step={1}
                        aria-label="Position horizontale"
                        value={Math.round(positionX)}
                        onChange={(ev) =>
                          set("position", [
                            toNumber(ev.target.value, positionX),
                            positionY,
                          ])
                        }
                        {...editProps("position")}
                      />
                      <NumberInput
                        type="number"
                        step={1}
                        aria-label="Position verticale"
                        value={Math.round(positionY)}
                        onChange={(ev) =>
                          set("position", [
                            positionX,
                            toNumber(ev.target.value, positionY),
                          ])
                        }
                        {...editProps("position")}
                      />
                    </PairInputs>
                  </Row>
                ) : null}
              </Section>
            </Details>
          ) : null}

          {has(SAVE_AS_CHARACTER_KEY) ? (
            <Footer>
              <FooterButton
                onClick={() => data[SAVE_AS_CHARACTER_KEY].onClick?.()}
              >
                Enregistrer dans la bibliothèque
              </FooterButton>
            </Footer>
          ) : null}
        </>
      )}
    </Panel>
  );
};

/** Ligne « libellé + interrupteur », réutilisée par le panneau Météo. */
export const ToggleRow = (props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}): React.ReactElement => (
  <ToggleLabel>
    <span>{props.label}</span>
    <ToggleInput
      type="checkbox"
      role="switch"
      checked={props.checked}
      onChange={(ev) => props.onChange(ev.target.checked)}
    />
  </ToggleLabel>
);

const Panel = styled.div`
  ${floatingSurface}
  background: ${ds.colors.surface};
  display: flex;
  flex-direction: column;
  font-size: 13px;
`;

const Header = styled.div<{ isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: ${(p) =>
    p.isCollapsed ? "none" : `1px solid ${ds.colors.border}`};
`;

const CollapseButton = styled.button`
  ${controlBase}
  flex-shrink: 0;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
`;

const CollapsedTitle = styled.button`
  ${controlBase}
  flex: 1;
  min-width: 0;
  padding: 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${ds.colors.textPrimary};
  font-size: 14px;
  font-weight: 600;
  text-align: left;
`;

const HeaderTitle = styled.div`
  padding: 4px 4px;
  font-weight: 600;
`;

const fieldBase = `
  height: 28px;
  padding: 0 8px;
  border-radius: ${ds.radii.sm};
  border: 1px solid ${ds.colors.borderStrong};
  background: rgba(255, 255, 255, 0.04);
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 13px;
  outline: none;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:focus {
    border-color: ${ds.colors.accentBorder};
    box-shadow: 0 0 0 3px rgba(227, 181, 101, 0.16);
  }
`;

const NameInput = styled.input`
  ${fieldBase}
  width: 100%;
  height: 32px;
  border-color: transparent;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
`;

/**
 * États du token : une grille d'icônes à cocher. Un état actif prend sa
 * couleur ; les noms des états actifs sont rappelés au-dessus.
 */
const ConditionPicker = (props: {
  value: Array<string>;
  onChange: (ids: Array<string>) => void;
}): React.ReactElement => {
  const activeConditions = resolveConditions(props.value);
  return (
    <>
      <Row>
        <RowLabel>États</RowLabel>
        {activeConditions.length > 0 ? (
          <ConditionSummary>
            {activeConditions.map((c) => c.label).join(", ")}
          </ConditionSummary>
        ) : (
          <ConditionSummary muted>Aucun</ConditionSummary>
        )}
      </Row>
      <ConditionToggleGrid value={props.value} onChange={props.onChange} />
    </>
  );
};

const ConditionSummary = styled.span<{ muted?: boolean }>`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: ${(p) => (p.muted ? ds.colors.textMuted : ds.colors.textPrimary)};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;

  & + & {
    border-top: 1px solid ${ds.colors.border};
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 32px;
`;

const RowLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: ${ds.colors.textSecondary};
`;

const NumberInput = styled.input`
  ${fieldBase}
  width: 84px;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const PairInputs = styled.div`
  display: flex;
  gap: 6px;

  > input {
    width: 72px;
  }
`;

const Segmented = styled.div`
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: ${ds.radii.md};
  background: rgba(255, 255, 255, 0.05);
`;

const SegmentButton = styled.button`
  ${controlBase}
  flex: 1;
  justify-content: center;
  height: 28px;
  padding: 0;
  border-radius: ${ds.radii.sm};
  font-variant-numeric: tabular-nums;

  &:hover {
    background: ${ds.colors.selected};
  }
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 32px;
  color: ${ds.colors.textSecondary};
  cursor: pointer;
`;

/** Interrupteur : une case à cocher native habillée, donc accessible. */
const ToggleInput = styled.input`
  appearance: none;
  -webkit-appearance: none;
  flex-shrink: 0;
  position: relative;
  width: 34px;
  height: 20px;
  margin: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.14);
  cursor: pointer;
  transition: background ${ds.transitions.fast};

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${ds.colors.textPrimary};
    transition: transform ${ds.transitions.fast};
  }

  &:checked {
    background: ${ds.colors.accent};
  }

  &:checked::after {
    transform: translateX(14px);
    background: ${ds.colors.onAccent};
  }
`;

const ColorField = styled.div`
  display: flex;
  align-items: center;
`;

const ColorSwatch = styled.input`
  width: 44px;
  height: 28px;
  padding: 0;
  border: 1px solid ${ds.colors.borderStrong};
  border-radius: ${ds.radii.sm};
  background: transparent;
  cursor: pointer;

  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }
`;

const Select = styled.select`
  ${fieldBase}
  min-width: 132px;
  cursor: pointer;
`;

const RangeInput = styled.input`
  flex: 1;
  min-width: 0;
`;

const ValueHint = styled.span`
  width: 36px;
  text-align: right;
  color: ${ds.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

const Details = styled.details`
  border-top: 1px solid ${ds.colors.border};

  > div {
    padding-top: 0;
  }
`;

const DetailsSummary = styled.summary`
  padding: 8px 12px;
  color: ${ds.colors.textMuted};
  font-size: 12px;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: ${ds.colors.textPrimary};
  }
`;

const Footer = styled.div`
  padding: 8px;
  border-top: 1px solid ${ds.colors.border};
`;

const FooterButton = styled.button`
  ${controlBase}
  width: 100%;
  justify-content: center;
  background: ${ds.colors.hover};
  color: ${ds.colors.textPrimary};

  &:hover {
    background: ${ds.colors.selected};
  }
`;
