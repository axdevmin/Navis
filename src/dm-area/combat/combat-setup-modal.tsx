import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useMutation, useQuery } from "relay-hooks";
import styled from "@emotion/styled/macro";
import { Modal, ModalDialogSize } from "../../modal";
import * as Button from "../../button";
import { ds } from "../../design-system";
import * as Icon from "../../feather-icons";
import type { CombatFaction } from "../../map-typings";
import { LIBRARY_DRAG_TYPE, TokenPreset } from "../token-library";
import {
  LIBRARY_CHARACTER_DRAG_TYPE,
  LibraryCharacterDragPayload,
} from "../library/library-character-drag-type";
import {
  FACTION_META,
  FACTION_ORDER,
  defaultFactionForTokenType,
  getFactionMeta,
} from "./combat-faction";
import { combatSetupModal_MapFragment$key } from "./__generated__/combatSetupModal_MapFragment.graphql";
import { combatSetupModal_StartMutation } from "./__generated__/combatSetupModal_StartMutation.graphql";
import { combatSetupModal_LibraryCharactersQuery } from "./__generated__/combatSetupModal_LibraryCharactersQuery.graphql";

const LibraryCharactersQuery = graphql`
  query combatSetupModal_LibraryCharactersQuery {
    libraryCharacters {
      id
      name
      faction
      color
      tokenImage {
        id
        url
      }
    }
  }
`;

const CombatSetupModalMapFragment = graphql`
  fragment combatSetupModal_MapFragment on Map {
    id
    tokens {
      id
      label
      tokenType
      color
      imageUrl
      isVisibleForPlayers
    }
  }
`;

const CombatStartMutation = graphql`
  mutation combatSetupModal_StartMutation($input: CombatStartInput!) {
    combatStart(input: $input) {
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

type DraftParticipant = {
  key: string;
  name: string;
  faction: CombatFaction;
  color: string;
  imageUrl: string | null;
  tokenId: string | null;
  isVisibleForPlayers: boolean;
  included: boolean;
};

let draftKeyCounter = 0;
const nextDraftKey = () => `draft-${draftKeyCounter++}`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 120px;
  padding: 4px;
  border-radius: ${ds.radii.md};
  border: 1px dashed ${ds.colors.border};
`;

const DropHint = styled.div`
  padding: 20px 12px;
  text-align: center;
  font-size: 12px;
  color: ${ds.colors.textMuted};
  font-family: ${ds.font.sans};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: ${ds.radii.md};
  background: ${ds.colors.surfaceHover};
`;

const Avatar = styled.div<{ color: string }>`
  width: 26px;
  height: 26px;
  min-width: 26px;
  border-radius: 50%;
  background: ${(p) => p.color};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const NameInput = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 13px;

  &:focus {
    outline: none;
  }
`;

const FactionButtons = styled.div`
  display: flex;
  gap: 2px;
`;

const FactionButton = styled.button<{ isActive: boolean; factionColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${ds.radii.sm};
  cursor: pointer;
  font-size: 12px;
  border: 1px solid
    ${(p) => (p.isActive ? p.factionColor : ds.colors.border)};
  background: ${(p) => (p.isActive ? `${p.factionColor}33` : "transparent")};

  &:hover {
    border-color: ${(p) => p.factionColor};
  }
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: ${ds.radii.sm};
  background: transparent;
  color: ${ds.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${ds.colors.dangerMuted};
    color: ${ds.colors.danger};
  }
`;

const AddRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 10px;
`;

const AddInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border-radius: ${ds.radii.md};
  border: 1px solid ${ds.colors.border};
  background: ${ds.colors.surface};
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: ${ds.colors.accentBorder};
  }
`;

const HelpText = styled.p`
  margin: 0 0 10px;
  font-size: 12px;
  color: ${ds.colors.textMuted};
  font-family: ${ds.font.sans};
`;

const randomManualColor = () => {
  const colors = ["#5588cc", "#cc5555", "#55aa77", "#cc9944", "#8866cc"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const LibrarySection = styled.div`
  margin-bottom: 12px;
`;

const LibrarySectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${ds.colors.textMuted};
  font-family: ${ds.font.sans};
  margin-bottom: 6px;
`;

const LibraryChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const LibraryChip = styled.button<{ factionColor: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 4px;
  border-radius: ${ds.radii.full};
  border: 1px solid ${(p) => p.factionColor};
  background: transparent;
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: ${(p) => `${p.factionColor}22`};
  }
`;

const LibraryChipAvatar = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${(p) => p.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const CombatSetupModal = (props: {
  map: combatSetupModal_MapFragment$key;
  onClose: () => void;
}): React.ReactElement => {
  const map = useFragment(CombatSetupModalMapFragment, props.map);
  const [startCombat] = useMutation<combatSetupModal_StartMutation>(
    CombatStartMutation
  );
  const { data: libraryData } =
    useQuery<combatSetupModal_LibraryCharactersQuery>(LibraryCharactersQuery);

  const [participants, setParticipants] = React.useState<
    Array<DraftParticipant>
  >(() =>
    map.tokens
      .filter((token) => token.tokenType !== "marker")
      .map((token) => ({
        key: token.id,
        name: token.label || "Sans nom",
        faction: defaultFactionForTokenType(token.tokenType),
        color: token.color,
        imageUrl: token.imageUrl,
        tokenId: token.id,
        isVisibleForPlayers: token.isVisibleForPlayers,
        included: token.tokenType === "character" || token.tokenType === "creature",
      }))
  );

  const [manualName, setManualName] = React.useState("");

  const addParticipant = (participant: Omit<DraftParticipant, "key">) => {
    setParticipants((current) => [
      ...current,
      { ...participant, key: nextDraftKey() },
    ]);
  };

  const addManualParticipant = () => {
    const name = manualName.trim();
    if (!name) return;
    addParticipant({
      name,
      faction: "neutral",
      color: randomManualColor(),
      imageUrl: null,
      tokenId: null,
      isVisibleForPlayers: true,
      included: true,
    });
    setManualName("");
  };

  const includedCount = participants.filter((p) => p.included).length;

  return (
    <Modal onPressEscape={props.onClose} onClickOutside={props.onClose}>
      <Modal.Dialog size={ModalDialogSize.SMALL}>
        <Modal.Header>
          <Modal.Heading3>Préparer le combat</Modal.Heading3>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <HelpText>
            Cochez les participants ci-dessous, ajustez leur camp, ou ajoutez
            un personnage de la bibliothèque ou un nom manuellement.
          </HelpText>
          {libraryData && libraryData.libraryCharacters.length > 0 ? (
            <LibrarySection>
              <LibrarySectionTitle>Depuis la bibliothèque</LibrarySectionTitle>
              <LibraryChips>
                {libraryData.libraryCharacters.map((character) => {
                  const meta = getFactionMeta(character.faction);
                  return (
                    <LibraryChip
                      key={character.id}
                      type="button"
                      factionColor={meta.color}
                      onClick={() =>
                        addParticipant({
                          name: character.name,
                          faction: character.faction as CombatFaction,
                          color: character.color,
                          imageUrl: character.tokenImage?.url ?? null,
                          tokenId: null,
                          isVisibleForPlayers: true,
                          included: true,
                        })
                      }
                    >
                      <LibraryChipAvatar color={character.color}>
                        {character.tokenImage ? (
                          <img src={character.tokenImage.url} alt="" />
                        ) : (
                          meta.emoji
                        )}
                      </LibraryChipAvatar>
                      {character.name}
                      <Icon.Plus boxSize="12px" />
                    </LibraryChip>
                  );
                })}
              </LibraryChips>
            </LibrarySection>
          ) : null}
          <List
            onDragOver={(ev) => {
              if (
                ev.dataTransfer.types.includes(LIBRARY_DRAG_TYPE) ||
                ev.dataTransfer.types.includes(LIBRARY_CHARACTER_DRAG_TYPE)
              ) {
                ev.preventDefault();
              }
            }}
            onDrop={(ev) => {
              const characterJson = ev.dataTransfer.getData(
                LIBRARY_CHARACTER_DRAG_TYPE
              );
              if (characterJson) {
                ev.preventDefault();
                const character = JSON.parse(
                  characterJson
                ) as LibraryCharacterDragPayload;
                addParticipant({
                  name: character.label,
                  faction: character.faction,
                  color: character.color,
                  imageUrl: character.imageUrl,
                  tokenId: null,
                  isVisibleForPlayers: true,
                  included: true,
                });
                return;
              }

              const presetJson = ev.dataTransfer.getData(LIBRARY_DRAG_TYPE);
              if (!presetJson) return;
              ev.preventDefault();
              const preset = JSON.parse(presetJson) as TokenPreset;
              addParticipant({
                name: preset.label,
                faction: defaultFactionForTokenType(preset.tokenType),
                color: preset.color,
                imageUrl: preset.imageUrl,
                tokenId: null,
                isVisibleForPlayers: true,
                included: true,
              });
            }}
          >
            {participants.length === 0 ? (
              <DropHint>Aucun participant. Glissez un token ici.</DropHint>
            ) : (
              participants.map((participant) => (
                <Row key={participant.key}>
                  <input
                    type="checkbox"
                    checked={participant.included}
                    onChange={() =>
                      setParticipants((current) =>
                        current.map((p) =>
                          p.key === participant.key
                            ? { ...p, included: !p.included }
                            : p
                        )
                      )
                    }
                  />
                  <Avatar color={participant.color}>
                    {participant.imageUrl ? (
                      <img src={participant.imageUrl} alt="" />
                    ) : null}
                  </Avatar>
                  <NameInput
                    value={participant.name}
                    onChange={(ev) =>
                      setParticipants((current) =>
                        current.map((p) =>
                          p.key === participant.key
                            ? { ...p, name: ev.target.value }
                            : p
                        )
                      )
                    }
                  />
                  <FactionButtons>
                    {FACTION_ORDER.map((faction) => (
                      <FactionButton
                        key={faction}
                        type="button"
                        isActive={participant.faction === faction}
                        factionColor={FACTION_META[faction].color}
                        title={FACTION_META[faction].label}
                        onClick={() =>
                          setParticipants((current) =>
                            current.map((p) =>
                              p.key === participant.key ? { ...p, faction } : p
                            )
                          )
                        }
                      >
                        {FACTION_META[faction].emoji}
                      </FactionButton>
                    ))}
                  </FactionButtons>
                  <RemoveButton
                    title="Retirer de la liste"
                    onClick={() =>
                      setParticipants((current) =>
                        current.filter((p) => p.key !== participant.key)
                      )
                    }
                  >
                    <Icon.X boxSize="13px" />
                  </RemoveButton>
                </Row>
              ))
            )}
          </List>
          <AddRow>
            <AddInput
              placeholder="Ajouter manuellement (nom)…"
              value={manualName}
              onChange={(ev) => setManualName(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  addManualParticipant();
                }
              }}
            />
            <Button.Primary type="button" onClick={addManualParticipant}>
              <Icon.Plus boxSize="16px" />
            </Button.Primary>
          </AddRow>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Actions>
            <Modal.ActionGroup>
              <div>
                <Button.Tertiary onClick={props.onClose}>
                  Annuler
                </Button.Tertiary>
              </div>
              <div>
                <Button.Primary
                  disabled={includedCount === 0}
                  onClick={() => {
                    const selected = participants.filter((p) => p.included);
                    startCombat({
                      variables: {
                        input: {
                          mapId: map.id,
                          participants: selected.map((p) => ({
                            name: p.name,
                            faction: p.faction,
                            color: p.color,
                            imageUrl: p.imageUrl,
                            tokenId: p.tokenId,
                            isVisibleForPlayers: p.isVisibleForPlayers,
                          })),
                        },
                      },
                      onCompleted: () => props.onClose(),
                    });
                  }}
                >
                  Lancer le combat ({includedCount})
                </Button.Primary>
              </div>
            </Modal.ActionGroup>
          </Modal.Actions>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
};
