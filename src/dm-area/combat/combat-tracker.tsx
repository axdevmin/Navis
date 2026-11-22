import * as React from "react";
import {
  ConditionIcon,
  ConditionToggleGrid,
  resolveConditions,
} from "../../token-conditions";
import { UpdateTokenContext } from "../../update-token-context";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useMutation } from "relay-hooks";
import styled from "@emotion/styled/macro";
import { ds } from "../../design-system";
import * as Icon from "../../feather-icons";
import { LIBRARY_DRAG_TYPE, TokenPreset } from "../token-library";
import {
  LIBRARY_CHARACTER_DRAG_TYPE,
  LibraryCharacterDragPayload,
} from "../library/library-character-drag-type";
import type { CombatFaction } from "../../map-typings";
import {
  FACTION_META,
  FACTION_ORDER,
  defaultFactionForTokenType,
  getFactionMeta,
} from "./combat-faction";
import { combatTracker_MapFragment$key } from "./__generated__/combatTracker_MapFragment.graphql";
import { combatTracker_NextTurnMutation } from "./__generated__/combatTracker_NextTurnMutation.graphql";
import { combatTracker_PreviousTurnMutation } from "./__generated__/combatTracker_PreviousTurnMutation.graphql";
import { combatTracker_ReorderMutation } from "./__generated__/combatTracker_ReorderMutation.graphql";
import { combatTracker_RemoveParticipantMutation } from "./__generated__/combatTracker_RemoveParticipantMutation.graphql";
import { combatTracker_EndMutation } from "./__generated__/combatTracker_EndMutation.graphql";
import { combatTracker_UpdateParticipantMutation } from "./__generated__/combatTracker_UpdateParticipantMutation.graphql";
import { combatTracker_AddParticipantMutation } from "./__generated__/combatTracker_AddParticipantMutation.graphql";

const COMBAT_DRAG_TYPE = "application/navis-combat-participant";

const CombatTrackerMapFragment = graphql`
  fragment combatTracker_MapFragment on Map {
    id
    combat {
      isActive
      round
      currentParticipantId
      participants {
        id
        name
        faction
        initiative
        color
        imageUrl
        isVisibleForPlayers
        isDown
        tokenId
      }
    }
    tokens {
      id
      conditions
    }
  }
`;

const NextTurnMutation = graphql`
  mutation combatTracker_NextTurnMutation($input: CombatNextTurnInput!) {
    combatNextTurn(input: $input) {
      updatedMap {
        id
        combat {
          isActive
          round
          currentParticipantId
          participants {
            id
            name
            faction
            initiative
            color
            imageUrl
            isVisibleForPlayers
            isDown
          }
        }
      }
    }
  }
`;

const PreviousTurnMutation = graphql`
  mutation combatTracker_PreviousTurnMutation(
    $input: CombatPreviousTurnInput!
  ) {
    combatPreviousTurn(input: $input) {
      updatedMap {
        id
        combat {
          isActive
          round
          currentParticipantId
          participants {
            id
            name
            faction
            initiative
            color
            imageUrl
            isVisibleForPlayers
            isDown
          }
        }
      }
    }
  }
`;

const ReorderMutation = graphql`
  mutation combatTracker_ReorderMutation(
    $input: CombatReorderParticipantsInput!
  ) {
    combatReorderParticipants(input: $input) {
      updatedMap {
        id
        combat {
          isActive
          round
          currentParticipantId
          participants {
            id
            name
            faction
            initiative
            color
            imageUrl
            isVisibleForPlayers
            isDown
          }
        }
      }
    }
  }
`;

const RemoveParticipantMutation = graphql`
  mutation combatTracker_RemoveParticipantMutation(
    $input: CombatRemoveParticipantInput!
  ) {
    combatRemoveParticipant(input: $input) {
      updatedMap {
        id
        combat {
          isActive
          round
          currentParticipantId
          participants {
            id
            name
            faction
            initiative
            color
            imageUrl
            isVisibleForPlayers
            isDown
          }
        }
      }
    }
  }
`;

const EndMutation = graphql`
  mutation combatTracker_EndMutation($input: CombatEndInput!) {
    combatEnd(input: $input) {
      updatedMap {
        id
        combat {
          isActive
          round
          currentParticipantId
          participants {
            id
            name
            faction
            initiative
            color
            imageUrl
            isVisibleForPlayers
            isDown
          }
        }
      }
    }
  }
`;

const UpdateParticipantMutation = graphql`
  mutation combatTracker_UpdateParticipantMutation(
    $input: CombatUpdateParticipantInput!
  ) {
    combatUpdateParticipant(input: $input) {
      updatedMap {
        id
        combat {
          isActive
          round
          currentParticipantId
          participants {
            id
            name
            faction
            initiative
            color
            imageUrl
            isVisibleForPlayers
            isDown
          }
        }
      }
    }
  }
`;

const AddParticipantMutation = graphql`
  mutation combatTracker_AddParticipantMutation(
    $input: CombatAddParticipantInput!
  ) {
    combatAddParticipant(input: $input) {
      updatedMap {
        id
        combat {
          isActive
          round
          currentParticipantId
          participants {
            id
            name
            faction
            initiative
            color
            imageUrl
            isVisibleForPlayers
            isDown
          }
        }
      }
    }
  }
`;

const Panel = styled.div<{ collapsed: boolean }>`
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  z-index: ${ds.zIndex.aside};
  pointer-events: all;
  width: ${(p) => (p.collapsed ? "auto" : "260px")};
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: ${ds.colors.glassDark};
  backdrop-filter: ${ds.blur.md};
  -webkit-backdrop-filter: ${ds.blur.md};
  border: 1px solid ${ds.colors.borderStrong};
  border-radius: ${ds.radii.lg};
  box-shadow: ${ds.shadows.lg};
  overflow: hidden;
  font-family: ${ds.font.sans};
`;

const Header = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  flex-shrink: 0;
  padding: 10px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};

  svg {
    stroke: ${ds.colors.textSecondary};
  }
`;

const HeaderTitle = styled.span`
  flex: 1;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
`;

const RoundBadge = styled.span`
  font-size: 11px;
  color: ${ds.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

const EndButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: ${ds.radii.sm};
  border: none;
  background: transparent;
  color: ${ds.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${ds.colors.dangerMuted};
    color: ${ds.colors.danger};
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: ${ds.radii.sm};
  border: none;
  background: transparent;
  color: ${ds.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${ds.colors.accentMuted};
    color: ${ds.colors.accent};
  }
`;

const AddForm = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid ${ds.colors.border};
  flex-shrink: 0;
`;

const AddFormInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  border-radius: ${ds.radii.sm};
  border: 1px solid ${ds.colors.border};
  background: ${ds.colors.surface};
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 12px;

  &:focus {
    outline: none;
    border-color: ${ds.colors.accentBorder};
  }
`;

const AddFormFactionButton = styled.button<{
  isActive: boolean;
  factionColor: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: ${ds.radii.sm};
  cursor: pointer;
  font-size: 11px;
  border: 1px solid ${(p) => (p.isActive ? p.factionColor : ds.colors.border)};
  background: ${(p) => (p.isActive ? `${p.factionColor}33` : "transparent")};

  &:hover {
    border-color: ${(p) => p.factionColor};
  }
`;

const AddFormConfirmButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: ${ds.radii.sm};
  border: 1px solid ${ds.colors.accentBorder};
  background: ${ds.colors.accentMuted};
  color: ${ds.colors.accent};
  cursor: pointer;

  &:hover {
    background: rgba(227, 181, 101, 0.2);
  }
`;

const List = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Row = styled.div<{ isCurrent: boolean; isDragOver: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  /* marge à gauche pour les pastilles d'état autour de l'avatar */
  padding: 6px 8px 6px 12px;
  border-radius: ${ds.radii.md};
  background: ${(p) => (p.isCurrent ? ds.colors.accentMuted : "transparent")};
  border: 1px solid
    ${(p) => (p.isCurrent ? ds.colors.accentBorder : "transparent")};
  border-top: ${(p) =>
    p.isDragOver ? `2px solid ${ds.colors.accent}` : undefined};
  transition: background ${ds.transitions.fast};

  &:hover {
    background: ${(p) =>
      p.isCurrent ? ds.colors.accentMuted : ds.colors.surfaceHover};
  }

  &:hover [data-row-actions] > button,
  &:focus-within [data-row-actions] > button {
    display: flex;
  }
`;

const Avatar = styled.div<{ color: string; isDown: boolean }>`
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background: ${(p) => p.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.65);
  opacity: ${(p) => (p.isDown ? 0.4 : 1)};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/** Avatar et ses pastilles d'état ; cliquable pour régler les états. */
const AvatarWrap = styled.button<{ isClickable: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: ${(p) => (p.isClickable ? "pointer" : "default")};

  &:hover > div:first-of-type {
    box-shadow: ${(p) =>
      p.isClickable ? `0 0 0 2px ${ds.colors.borderStrong}` : "none"};
  }
`;

/** Places des pastilles autour de l'avatar (en degrés), comme sur la carte. */
const AVATAR_BADGE_ANGLES = [100, 145, 190, 235, 330, 285];

/** Pastilles d'état disposées autour de l'avatar. */
const AvatarConditionBadges = (props: {
  conditions: ReadonlyArray<string>;
}): React.ReactElement | null => {
  const conditions = resolveConditions(props.conditions).slice(
    0,
    AVATAR_BADGE_ANGLES.length
  );
  if (conditions.length === 0) return null;
  const size = 14;
  const distance = 20;
  return (
    <>
      {conditions.map((condition, index) => {
        // même disposition que sur la carte
        const angle = (AVATAR_BADGE_ANGLES[index] / 180) * Math.PI;
        const x = 14 + Math.cos(angle) * distance - size / 2;
        const y = 14 - Math.sin(angle) * distance - size / 2;
        return (
          <AvatarBadge
            key={condition.id}
            title={condition.label}
            style={{
              left: x,
              top: y,
              width: size,
              height: size,
              background: condition.color,
            }}
          >
            <ConditionIcon condition={condition} size={10} color="#141416" />
          </AvatarBadge>
        );
      })}
    </>
  );
};

const AvatarBadge = styled.span`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 0 0 1.5px rgba(11, 11, 12, 0.85);
  pointer-events: none;
`;

const ConditionTray = styled.div`
  padding: 4px 8px 8px;
  margin-top: -2px;
`;

const Name = styled.span<{ isDown: boolean; isEditable: boolean }>`
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: ${ds.colors.textPrimary};
  opacity: ${(p) => (p.isDown ? 0.5 : 1)};
  text-decoration: ${(p) => (p.isDown ? "line-through" : "none")};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: ${(p) => (p.isEditable ? "text" : "inherit")};

  &:hover {
    text-decoration: ${(p) => (p.isEditable ? "underline" : undefined)};
  }
`;

const NameInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 1px 4px;
  border-radius: ${ds.radii.sm};
  border: 1px solid ${ds.colors.accentBorder};
  background: ${ds.colors.surface};
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 13px;

  &:focus {
    outline: none;
  }
`;

const InitiativeBadge = styled.span`
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: ${ds.colors.textMuted};
  min-width: 18px;
  text-align: right;
`;

const RowActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: ${ds.radii.sm};
  background: transparent;
  color: ${ds.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${ds.colors.surfaceActive};
    color: ${ds.colors.textPrimary};
  }
`;

/**
 * Les actions d'une ligne n'apparaissent qu'au survol (ou au clavier) : au
 * repos, une ligne ne montre que l'essentiel. Un état qui compte, comme
 * « masqué aux joueurs », reste affiché en permanence.
 */
const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  margin: -4px -4px -4px 0;

  > button:not([data-persistent]) {
    display: none;
  }

  @media (hover: none) {
    > button:not([data-persistent]) {
      display: flex;
    }
  }
`;

const Footer = styled.div`
  flex-shrink: 0;
  padding: 8px;
  border-top: 1px solid ${ds.colors.border};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FooterButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const PreviousTurnButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  border-radius: ${ds.radii.md};
  border: 1px solid ${ds.colors.border};
  background: ${ds.colors.surfaceHover};
  color: ${ds.colors.textSecondary};
  cursor: pointer;

  &:hover {
    background: ${ds.colors.surfaceActive};
    color: ${ds.colors.textPrimary};
  }
`;

const NextTurnButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  padding: 8px;
  border-radius: ${ds.radii.md};
  border: 1px solid ${ds.colors.accentBorder};
  background: ${ds.colors.accentMuted};
  color: ${ds.colors.accent};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: ${ds.font.sans};

  &:hover {
    background: rgba(227, 181, 101, 0.2);
  }
`;

const KeyHint = styled.div`
  text-align: center;
  font-size: 10px;
  color: ${ds.colors.textMuted};
  font-family: ${ds.font.sans};
`;

const EmptyState = styled.div`
  padding: 12px;
  font-size: 12px;
  color: ${ds.colors.textMuted};
  text-align: center;
`;

export const CombatTracker = (props: {
  map: combatTracker_MapFragment$key;
  isEditable: boolean;
}): React.ReactElement | null => {
  const map = useFragment(CombatTrackerMapFragment, props.map);
  const [collapsed, setCollapsed] = React.useState(false);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newFaction, setNewFaction] = React.useState<CombatFaction>("neutral");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  // participant dont on règle les états (une rangée d'icônes sous sa ligne)
  const [conditionsForId, setConditionsForId] = React.useState<string | null>(
    null
  );
  const updateToken = React.useContext(UpdateTokenContext);
  const conditionsByTokenId = new Map(
    map.tokens.map((token) => [token.id, token.conditions] as const)
  );

  const [nextTurn] =
    useMutation<combatTracker_NextTurnMutation>(NextTurnMutation);
  const [previousTurn] =
    useMutation<combatTracker_PreviousTurnMutation>(PreviousTurnMutation);
  const [reorder] = useMutation<combatTracker_ReorderMutation>(ReorderMutation);
  const [removeParticipant] =
    useMutation<combatTracker_RemoveParticipantMutation>(
      RemoveParticipantMutation
    );
  const [endCombat] = useMutation<combatTracker_EndMutation>(EndMutation);
  const [updateParticipant] =
    useMutation<combatTracker_UpdateParticipantMutation>(
      UpdateParticipantMutation
    );
  const [addParticipant] = useMutation<combatTracker_AddParticipantMutation>(
    AddParticipantMutation
  );

  const combat = map.combat;
  const mapId = map.id;

  // Automatically keep the active participant visible: with many participants
  // the list scrolls down as the round advances and jumps back to the top on
  // a new round. Useful on player screens projected on a table where nobody
  // can scroll manually. The scroll offset is computed manually and the
  // active row is centered in the list.
  const listRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!combat.isActive || !combat.currentParticipantId || collapsed) return;
    const frame = requestAnimationFrame(() => {
      const list = listRef.current;
      if (!list || list.scrollHeight <= list.clientHeight) return;
      const row = list.querySelector<HTMLElement>(
        `[data-participant-id="${combat.currentParticipantId}"]`
      );
      if (!row) return;
      const rowTopInList = row.offsetTop - list.offsetTop;
      const target = rowTopInList - (list.clientHeight - row.clientHeight) / 2;
      list.scrollTo({
        top: Math.max(0, Math.min(target, list.scrollHeight)),
        behavior: "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [combat.isActive, combat.currentParticipantId, collapsed]);

  React.useEffect(() => {
    if (!props.isEditable || !combat.isActive) return;

    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      );
    };

    const listener = (ev: KeyboardEvent) => {
      if (isTypingTarget(ev.target)) return;
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        nextTurn({ variables: { input: { mapId } } });
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        previousTurn({ variables: { input: { mapId } } });
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [props.isEditable, combat.isActive, mapId, nextTurn, previousTurn]);

  if (!combat.isActive) {
    return null;
  }

  // Players must not see participants that are hidden by the DM.
  const participants = props.isEditable
    ? combat.participants
    : combat.participants.filter(
        (participant) => participant.isVisibleForPlayers
      );

  const moveParticipant = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const ids = participants.map((p) => p.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = ids.filter((id) => id !== draggedId);
    const insertAt = reordered.indexOf(targetId);
    reordered.splice(insertAt, 0, draggedId);
    reorder({
      variables: { input: { mapId: map.id, participantIds: reordered } },
    });
  };

  const commitRename = (participantId: string) => {
    const trimmed = editValue.trim();
    const current = participants.find((p) => p.id === participantId);
    if (trimmed && current && trimmed !== current.name) {
      updateParticipant({
        variables: {
          input: { mapId: map.id, participantId, name: trimmed },
        },
      });
    }
    setEditingId(null);
  };

  const submitNewParticipant = () => {
    const name = newName.trim();
    if (!name) return;
    addParticipant({
      variables: {
        input: {
          mapId: map.id,
          participant: {
            name,
            faction: newFaction,
            color: FACTION_META[newFaction].color,
            imageUrl: null,
            tokenId: null,
            isVisibleForPlayers: true,
          },
        },
      },
    });
    setNewName("");
  };

  return (
    <Panel collapsed={collapsed}>
      <Header onClick={() => setCollapsed((v) => !v)}>
        <Icon.Users boxSize="16px" />
        <HeaderTitle>Combat</HeaderTitle>
        <RoundBadge>Manche {combat.round}</RoundBadge>
        {collapsed ? (
          <Icon.ChevronLeft boxSize="16px" />
        ) : (
          <Icon.ChevronRight boxSize="16px" />
        )}
        {props.isEditable && !collapsed ? (
          <AddButton
            title="Ajouter un participant"
            onClick={(ev) => {
              ev.stopPropagation();
              setIsAdding((v) => !v);
            }}
          >
            <Icon.Plus boxSize="14px" />
          </AddButton>
        ) : null}
        {props.isEditable && !collapsed ? (
          <EndButton
            title="Terminer le combat"
            onClick={(ev) => {
              ev.stopPropagation();
              endCombat({ variables: { input: { mapId: map.id } } });
            }}
          >
            <Icon.X boxSize="14px" />
          </EndButton>
        ) : null}
      </Header>

      {collapsed ? null : (
        <>
          {props.isEditable && isAdding ? (
            <AddForm onClick={(ev) => ev.stopPropagation()}>
              <AddFormInput
                autoFocus
                placeholder="Nom du participant…"
                value={newName}
                onChange={(ev) => setNewName(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    submitNewParticipant();
                  } else if (ev.key === "Escape") {
                    setIsAdding(false);
                  }
                }}
              />
              {FACTION_ORDER.map((faction) => (
                <AddFormFactionButton
                  key={faction}
                  type="button"
                  isActive={newFaction === faction}
                  factionColor={FACTION_META[faction].color}
                  title={FACTION_META[faction].label}
                  onClick={() => setNewFaction(faction)}
                >
                  {FACTION_META[faction].emoji}
                </AddFormFactionButton>
              ))}
              <AddFormConfirmButton
                title="Ajouter"
                onClick={submitNewParticipant}
              >
                <Icon.Check boxSize="14px" />
              </AddFormConfirmButton>
            </AddForm>
          ) : null}
          <List
            ref={listRef}
            onDragOver={(ev) => {
              if (
                props.isEditable &&
                (ev.dataTransfer.types.includes(LIBRARY_DRAG_TYPE) ||
                  ev.dataTransfer.types.includes(LIBRARY_CHARACTER_DRAG_TYPE))
              ) {
                ev.preventDefault();
              }
            }}
            onDrop={(ev) => {
              if (!props.isEditable) return;

              const characterJson = ev.dataTransfer.getData(
                LIBRARY_CHARACTER_DRAG_TYPE
              );
              if (characterJson) {
                ev.preventDefault();
                const character = JSON.parse(
                  characterJson
                ) as LibraryCharacterDragPayload;
                addParticipant({
                  variables: {
                    input: {
                      mapId: map.id,
                      participant: {
                        name: character.label,
                        faction: character.faction,
                        color: character.color,
                        imageUrl: character.imageUrl,
                        tokenId: null,
                        isVisibleForPlayers: true,
                      },
                    },
                  },
                });
                return;
              }

              const presetJson = ev.dataTransfer.getData(LIBRARY_DRAG_TYPE);
              if (!presetJson) return;
              ev.preventDefault();
              const preset = JSON.parse(presetJson) as TokenPreset;
              addParticipant({
                variables: {
                  input: {
                    mapId: map.id,
                    participant: {
                      name: preset.label,
                      faction: defaultFactionForTokenType(preset.tokenType),
                      color: preset.color,
                      imageUrl: preset.imageUrl,
                      tokenId: null,
                      isVisibleForPlayers: true,
                    },
                  },
                },
              });
            }}
          >
            {participants.length === 0 ? (
              <EmptyState>Aucun participant</EmptyState>
            ) : (
              participants.map((participant) => {
                const isCurrent =
                  participant.id === combat.currentParticipantId;
                const faction = getFactionMeta(participant.faction);
                const tokenId = participant.tokenId;
                const conditions =
                  (tokenId ? conditionsByTokenId.get(tokenId) : null) ?? [];
                const canEditConditions = props.isEditable && tokenId != null;
                const isConditionsOpen =
                  canEditConditions && conditionsForId === participant.id;
                return (
                  <React.Fragment key={participant.id}>
                    <Row
                      data-participant-id={participant.id}
                      isCurrent={isCurrent}
                      isDragOver={dragOverId === participant.id}
                      draggable={props.isEditable}
                      onDragStart={(ev) => {
                        ev.dataTransfer.setData(
                          COMBAT_DRAG_TYPE,
                          participant.id
                        );
                        ev.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(ev) => {
                        if (ev.dataTransfer.types.includes(COMBAT_DRAG_TYPE)) {
                          ev.preventDefault();
                          setDragOverId(participant.id);
                        }
                      }}
                      onDragLeave={() => {
                        setDragOverId((current) =>
                          current === participant.id ? null : current
                        );
                      }}
                      onDrop={(ev) => {
                        const draggedId =
                          ev.dataTransfer.getData(COMBAT_DRAG_TYPE);
                        setDragOverId(null);
                        if (!draggedId) return;
                        ev.preventDefault();
                        ev.stopPropagation();
                        moveParticipant(draggedId, participant.id);
                      }}
                    >
                      <AvatarWrap
                        type="button"
                        tabIndex={canEditConditions ? undefined : -1}
                        isClickable={canEditConditions}
                        title={canEditConditions ? "États" : undefined}
                        aria-label={
                          canEditConditions
                            ? `États de ${participant.name}`
                            : undefined
                        }
                        aria-expanded={
                          canEditConditions ? isConditionsOpen : undefined
                        }
                        onClick={() => {
                          if (!canEditConditions) return;
                          setConditionsForId(
                            isConditionsOpen ? null : participant.id
                          );
                        }}
                      >
                        <Avatar
                          color={participant.color}
                          isDown={participant.isDown}
                        >
                          {participant.imageUrl ? (
                            <img src={participant.imageUrl} alt="" />
                          ) : (
                            faction.emoji
                          )}
                        </Avatar>
                        <AvatarConditionBadges conditions={conditions} />
                      </AvatarWrap>
                      {props.isEditable && editingId === participant.id ? (
                        <NameInput
                          autoFocus
                          value={editValue}
                          onChange={(ev) => setEditValue(ev.target.value)}
                          onClick={(ev) => ev.stopPropagation()}
                          onBlur={() => commitRename(participant.id)}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter") {
                              ev.preventDefault();
                              commitRename(participant.id);
                            } else if (ev.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                        />
                      ) : (
                        <Name
                          isDown={participant.isDown}
                          isEditable={props.isEditable}
                          title={
                            props.isEditable
                              ? "Cliquer pour renommer"
                              : undefined
                          }
                          onClick={() => {
                            if (!props.isEditable) return;
                            setEditingId(participant.id);
                            setEditValue(participant.name);
                          }}
                        >
                          {participant.name}
                        </Name>
                      )}
                      <InitiativeBadge>
                        {participant.initiative}
                      </InitiativeBadge>
                      {props.isEditable ? (
                        <RowActions data-row-actions>
                          <RowActionButton
                            title={
                              participant.isDown ? "Relever" : "Mettre K.O."
                            }
                            onClick={() =>
                              updateParticipant({
                                variables: {
                                  input: {
                                    mapId: map.id,
                                    participantId: participant.id,
                                    isDown: !participant.isDown,
                                  },
                                },
                              })
                            }
                          >
                            <Icon.Skull boxSize="14px" />
                          </RowActionButton>
                          <RowActionButton
                            data-persistent={
                              participant.isVisibleForPlayers ? undefined : true
                            }
                            title={
                              participant.isVisibleForPlayers
                                ? "Masquer aux joueurs"
                                : "Montrer aux joueurs"
                            }
                            onClick={() =>
                              updateParticipant({
                                variables: {
                                  input: {
                                    mapId: map.id,
                                    participantId: participant.id,
                                    isVisibleForPlayers:
                                      !participant.isVisibleForPlayers,
                                  },
                                },
                              })
                            }
                          >
                            {participant.isVisibleForPlayers ? (
                              <Icon.Eye boxSize="13px" />
                            ) : (
                              <Icon.EyeOff boxSize="13px" />
                            )}
                          </RowActionButton>
                          <RowActionButton
                            title="Retirer du combat"
                            onClick={() =>
                              removeParticipant({
                                variables: {
                                  input: {
                                    mapId: map.id,
                                    participantId: participant.id,
                                  },
                                },
                              })
                            }
                          >
                            <Icon.X boxSize="13px" />
                          </RowActionButton>
                        </RowActions>
                      ) : null}
                    </Row>
                    {isConditionsOpen && tokenId ? (
                      <ConditionTray>
                        <ConditionToggleGrid
                          columns={7}
                          value={conditions}
                          onChange={(next) =>
                            updateToken(tokenId, { conditions: next })
                          }
                        />
                      </ConditionTray>
                    ) : null}
                  </React.Fragment>
                );
              })
            )}
          </List>
          {props.isEditable ? (
            <Footer>
              <FooterButtons>
                <PreviousTurnButton
                  title="Tour précédent (←)"
                  onClick={() =>
                    previousTurn({ variables: { input: { mapId: map.id } } })
                  }
                >
                  <Icon.ChevronLeft boxSize="14px" />
                </PreviousTurnButton>
                <NextTurnButton
                  onClick={() =>
                    nextTurn({ variables: { input: { mapId: map.id } } })
                  }
                >
                  <Icon.Play boxSize="14px" />
                  Tour suivant
                </NextTurnButton>
              </FooterButtons>
              <KeyHint>← → pour naviguer entre les tours</KeyHint>
            </Footer>
          ) : null}
        </>
      )}
    </Panel>
  );
};
