import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useQuery, useMutation } from "relay-hooks";
import styled from "@emotion/styled/macro";
import { ds } from "../../design-system";
import * as Icon from "../../feather-icons";
import * as Button from "../../button";
import type { CombatFaction } from "../../map-typings";
import { FACTION_META, FACTION_ORDER } from "../combat/combat-faction";
import { useTokenImageUpload } from "../token-image-upload";
import {
  LIBRARY_CHARACTER_DRAG_TYPE,
  LibraryCharacterDragPayload,
} from "./library-character-drag-type";
import { characterLibraryTab_Query } from "./__generated__/characterLibraryTab_Query.graphql";
import { characterLibraryTab_CreateMutation } from "./__generated__/characterLibraryTab_CreateMutation.graphql";
import { characterLibraryTab_DeleteMutation } from "./__generated__/characterLibraryTab_DeleteMutation.graphql";
import { characterLibraryTab_AddToMapMutation } from "./__generated__/characterLibraryTab_AddToMapMutation.graphql";

const Query = graphql`
  query characterLibraryTab_Query {
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

const CreateMutation = graphql`
  mutation characterLibraryTab_CreateMutation(
    $input: LibraryCharacterCreateInput!
  ) {
    libraryCharacterCreate(input: $input) {
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

const DeleteMutation = graphql`
  mutation characterLibraryTab_DeleteMutation(
    $input: LibraryCharacterDeleteInput!
  ) {
    libraryCharacterDelete(input: $input)
  }
`;

const AddToMapMutation = graphql`
  mutation characterLibraryTab_AddToMapMutation(
    $input: MapTokenAddManyInput!
  ) {
    mapTokenAddMany(input: $input)
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 16px;
`;

const CreateForm = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: ${ds.radii.md};
  border: 1px solid ${ds.colors.border};
  background: ${ds.colors.surfaceHover};
`;

const PortraitButton = styled.button<{ hasImage: boolean }>`
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  border: 1px dashed ${ds.colors.border};
  background: ${ds.colors.surface};
  color: ${ds.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    border-color: ${ds.colors.accentBorder};
    color: ${ds.colors.accent};
  }
`;

const NameInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border-radius: ${ds.radii.sm};
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

const FactionButtons = styled.div`
  display: flex;
  gap: 4px;
`;

const FactionButton = styled.button<{
  isActive: boolean;
  factionColor: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${ds.radii.sm};
  cursor: pointer;
  font-size: 14px;
  border: 1px solid
    ${(p) => (p.isActive ? p.factionColor : ds.colors.border)};
  background: ${(p) => (p.isActive ? `${p.factionColor}33` : "transparent")};

  &:hover {
    border-color: ${(p) => p.factionColor};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  grid-auto-rows: min-content;
  align-content: start;
  align-items: start;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: ${ds.radii.md};
  border: 2px solid ${(p: { factionColor: string }) => p.factionColor};
  background: ${ds.colors.surfaceHover};
  cursor: grab;

  &:hover [data-delete] {
    display: flex;
  }

  &:active {
    cursor: grabbing;
  }
`;

const Avatar = styled.div<{ color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${(p) => p.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CardName = styled.div`
  font-size: 12px;
  color: ${ds.colors.textPrimary};
  text-align: center;
  word-break: break-word;
  font-family: ${ds.font.sans};
`;

const DeleteButton = styled.button`
  display: none;
  position: absolute;
  top: 4px;
  right: 4px;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${ds.radii.sm};
  border: none;
  background: ${ds.colors.overlay};
  color: ${ds.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${ds.colors.dangerMuted};
    color: ${ds.colors.danger};
  }
`;

const AddToMapButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 4px 6px;
  border-radius: ${ds.radii.sm};
  border: 1px solid ${ds.colors.border};
  background: transparent;
  color: ${ds.colors.textSecondary};
  font-family: ${ds.font.sans};
  font-size: 10px;
  cursor: pointer;

  &:hover {
    background: ${ds.colors.accentMuted};
    border-color: ${ds.colors.accentBorder};
    color: ${ds.colors.accent};
  }
`;

const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
  color: ${ds.colors.textMuted};
  font-family: ${ds.font.sans};
  font-size: 13px;
`;

export const CharacterLibraryTab = (props: {
  mapId: string | null;
}): React.ReactElement => {
  const { data, retry } = useQuery<characterLibraryTab_Query>(Query);
  const [createCharacter] =
    useMutation<characterLibraryTab_CreateMutation>(CreateMutation);
  const [deleteCharacter] =
    useMutation<characterLibraryTab_DeleteMutation>(DeleteMutation);
  const [addToMap] =
    useMutation<characterLibraryTab_AddToMapMutation>(AddToMapMutation);
  const [modalNode, showCropper] = useTokenImageUpload();

  const [name, setName] = React.useState("");
  const [faction, setFaction] = React.useState<CombatFaction>("neutral");
  const [portraitId, setPortraitId] = React.useState<string | null>(null);
  const [portraitUrl, setPortraitUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    createCharacter({
      variables: {
        input: {
          name: trimmedName,
          faction,
          color: FACTION_META[faction].color,
          tokenImageId: portraitId,
        },
      },
      onCompleted: () => retry(),
    });
    setName("");
    setPortraitId(null);
    setPortraitUrl(null);
  };

  return (
    <Container>
      <CreateForm>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(ev) => {
            const file = ev.target.files?.[0];
            ev.target.value = "";
            if (!file) return;
            const objectUrl = URL.createObjectURL(file);
            showCropper(file, [], ({ tokenImageId }) => {
              setPortraitId(tokenImageId);
            });
            setPortraitUrl(objectUrl);
          }}
        />
        <PortraitButton
          type="button"
          hasImage={portraitUrl !== null}
          title="Choisir un portrait"
          onClick={() => fileInputRef.current?.click()}
        >
          {portraitUrl ? <img src={portraitUrl} alt="" /> : <Icon.Image boxSize="18px" />}
        </PortraitButton>
        <NameInput
          placeholder="Nom du personnage…"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              submit();
            }
          }}
        />
        <FactionButtons>
          {FACTION_ORDER.map((option) => (
            <FactionButton
              key={option}
              type="button"
              isActive={faction === option}
              factionColor={FACTION_META[option].color}
              title={FACTION_META[option].label}
              onClick={() => setFaction(option)}
            >
              {FACTION_META[option].emoji}
            </FactionButton>
          ))}
        </FactionButtons>
        <Button.Primary type="button" onClick={submit}>
          <Icon.Plus boxSize="16px" />
          <span>Ajouter</span>
        </Button.Primary>
      </CreateForm>

      {!data || data.libraryCharacters.length === 0 ? (
        <EmptyState>
          Aucun personnage enregistré. Créez-en un ci-dessus pour le
          réutiliser sur la carte ou en combat.
        </EmptyState>
      ) : (
        <Grid>
          {data.libraryCharacters.map((character) => {
            const meta = FACTION_META[character.faction as CombatFaction] ??
              FACTION_META.neutral;
            const payload: LibraryCharacterDragPayload = {
              label: character.name,
              faction: character.faction as CombatFaction,
              color: character.color,
              imageUrl: character.tokenImage?.url ?? null,
            };
            return (
              <Card
                key={character.id}
                factionColor={meta.color}
                draggable
                onDragStart={(ev) => {
                  ev.dataTransfer.setData(
                    LIBRARY_CHARACTER_DRAG_TYPE,
                    JSON.stringify(payload)
                  );
                  ev.dataTransfer.effectAllowed = "copy";
                }}
              >
                <DeleteButton
                  data-delete
                  title="Supprimer"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    deleteCharacter({
                      variables: { input: { id: character.id } },
                      onCompleted: () => retry(),
                    });
                  }}
                >
                  <Icon.X boxSize="12px" />
                </DeleteButton>
                <Avatar color={character.color}>
                  {character.tokenImage ? (
                    <img src={character.tokenImage.url} alt="" />
                  ) : (
                    meta.emoji
                  )}
                </Avatar>
                <CardName>{character.name}</CardName>
                {props.mapId ? (
                  <AddToMapButton
                    type="button"
                    title="Ajouter un token sur la carte"
                    onClick={() =>
                      addToMap({
                        variables: {
                          input: {
                            mapId: props.mapId!,
                            tokens: [
                              {
                                color: character.color,
                                x: 0,
                                y: 0,
                                rotation: 0,
                                label: character.name,
                                isVisibleForPlayers: false,
                                isMovableByPlayers: true,
                                isLocked: false,
                                tokenType: "character",
                                isAlive: true,
                                imageUrl: character.tokenImage?.url ?? null,
                              },
                            ],
                          },
                        },
                      })
                    }
                  >
                    <Icon.Map boxSize="12px" />
                    <span>Carte</span>
                  </AddToMapButton>
                ) : null}
              </Card>
            );
          })}
        </Grid>
      )}
      {modalNode}
    </Container>
  );
};
