import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useMutation } from "relay-hooks";
import { Box, Menu, MenuItem, MenuDivider, MenuList } from "@chakra-ui/react";
import { loose } from "./chakra-loose";

const BoxLoose = loose(Box);
const MenuLoose = loose(Menu);
const MenuItemLoose = loose(MenuItem);
const MenuDividerLoose = loose(MenuDivider);
const MenuListLoose = loose(MenuList);
import { MapTokenEntity } from "./map-typings";
import { useContextMenu } from "./map-context-menu";
import {
  useSelectedItems,
  usePropertiesPanel,
  useHiddenLabels,
} from "./shared-token-state";
import { defaultFactionForTokenType } from "./dm-area/combat/combat-faction";
import { mapContextMenuRendererMapTokenRemoveManyMutation } from "./__generated__/mapContextMenuRendererMapTokenRemoveManyMutation.graphql";
import { mapContextMenuRendererCombatAddParticipantMutation } from "./__generated__/mapContextMenuRendererCombatAddParticipantMutation.graphql";
import { mapContextMenuRendererMapTokenAddManyMutation } from "./__generated__/mapContextMenuRendererMapTokenAddManyMutation.graphql";
import { mapContextMenuRendererUpdateManyMutation } from "./__generated__/mapContextMenuRendererUpdateManyMutation.graphql";
import { mapContextMenuRenderer_MapFragment$key } from "./__generated__/mapContextMenuRenderer_MapFragment.graphql";

const MapContextMenuRendererUpdateManyMutation = graphql`
  mutation mapContextMenuRendererUpdateManyMutation(
    $input: MapTokenUpdateManyInput!
  ) {
    mapTokenUpdateMany(input: $input)
  }
`;

const MapContextMenuRendererMapTokenRemoveManyMutation = graphql`
  mutation mapContextMenuRendererMapTokenRemoveManyMutation(
    $input: MapTokenRemoveManyInput!
  ) {
    mapTokenRemoveMany(input: $input)
  }
`;

const MapContextMenuRendererMapTokenAddManyMutation = graphql`
  mutation mapContextMenuRendererMapTokenAddManyMutation(
    $input: MapTokenAddManyInput!
  ) {
    mapTokenAddMany(input: $input)
  }
`;

const MapContextMenuRendererCombatAddParticipantMutation = graphql`
  mutation mapContextMenuRendererCombatAddParticipantMutation(
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
            tokenId
          }
        }
      }
    }
  }
`;

const MapFragment = graphql`
  fragment mapContextMenuRenderer_MapFragment on Map {
    id
    tokens {
      id
      x
      y
      rotation
      color
      label
      radius
      isVisibleForPlayers
      isMovableByPlayers
      isLocked
      tokenType
      isAlive
      imageUrl
      tokenImage {
        id
      }
      referenceId
    }
    combat {
      isActive
      participants {
        id
        tokenId
      }
    }
  }
`;

export const ContextMenuRenderer = (props: {
  map: mapContextMenuRenderer_MapFragment$key;
}) => {
  const map = useFragment(MapFragment, props.map);

  const getTokens = React.useCallback(
    (tokenIds: Set<string>) => {
      const hits = new Map<string, MapTokenEntity>();
      for (const token of map.tokens) {
        if (tokenIds.has(token.id)) {
          hits.set(token.id, {
            ...token,
            tokenImageId: token.tokenImage?.id ?? null,
            tokenType: (token.tokenType as any) ?? "marker",
            isAlive: token.isAlive ?? true,
            imageUrl: token.imageUrl ?? null,
            reference: token.referenceId
              ? {
                  id: token.referenceId,
                  type: "note",
                }
              : null,
          });
        }
      }
      return hits;
    },
    [map.tokens]
  );

  const { state, showContextMenu } = useContextMenu();
  const [selectedItems, clearSelectedItems] = useSelectedItems();
  const [propertiesPanelHidden, togglePropertiesPanel] = usePropertiesPanel();
  const [hiddenLabelTokenIds, toggleLabelVisibility] = useHiddenLabels();

  const [mapTokenDeleteMany] =
    useMutation<mapContextMenuRendererMapTokenRemoveManyMutation>(
      MapContextMenuRendererMapTokenRemoveManyMutation
    );
  const [mapTokenAddMany] =
    useMutation<mapContextMenuRendererMapTokenAddManyMutation>(
      MapContextMenuRendererMapTokenAddManyMutation
    );
  const [updateManyTokens] =
    useMutation<mapContextMenuRendererUpdateManyMutation>(
      MapContextMenuRendererUpdateManyMutation
    );
  const [combatAddParticipant] =
    useMutation<mapContextMenuRendererCombatAddParticipantMutation>(
      MapContextMenuRendererCombatAddParticipantMutation
    );

  if (state === null) return null;

  // Panel is only visible when a token is selected AND not hidden
  const panelIsVisible = !propertiesPanelHidden && selectedItems.size > 0;

  const mi = (
    color: string,
    hoverBg: string,
    onClick: () => void,
    children: React.ReactNode
  ) => (
    <MenuItemLoose
      bg="transparent"
      color={color}
      _hover={{ bg: hoverBg, color: "#ffffff" }}
      onClick={onClick}
    >
      {children}
    </MenuItemLoose>
  );

  const duplicateToken = (tokenId: string, offsetX = 15, offsetY = 15) => {
    const token = map.tokens.find((t) => t.id === tokenId);
    if (!token) return;
    mapTokenAddMany({
      variables: {
        input: {
          mapId: map.id,
          tokens: [
            {
              x: token.x + offsetX,
              y: token.y + offsetY,
              color: token.color,
              label: token.label,
              radius: token.radius,
              rotation: token.rotation,
              isVisibleForPlayers: token.isVisibleForPlayers,
              isMovableByPlayers: token.isMovableByPlayers,
              isLocked: token.isLocked,
              tokenType: token.tokenType as any,
              imageUrl: token.imageUrl ?? undefined,
            },
          ],
        },
      },
    });
  };

  const combatTokenIds = new Set(
    (map.combat?.participants ?? [])
      .map((participant) => participant.tokenId)
      .filter((tokenId): tokenId is string => tokenId != null)
  );

  const addTokenToCombat = (tokenId: string) => {
    const token = map.tokens.find((t) => t.id === tokenId);
    if (!token || combatTokenIds.has(token.id)) return;
    combatAddParticipant({
      variables: {
        input: {
          mapId: map.id,
          participant: {
            name: token.label || "Sans nom",
            faction: defaultFactionForTokenType(
              (token.tokenType as any) ?? "marker"
            ),
            color: token.color,
            imageUrl: token.imageUrl ?? null,
            tokenId: token.id,
            isVisibleForPlayers: token.isVisibleForPlayers,
          },
        },
      },
    });
  };

  const duplicateSelection = () => {
    const tokens = map.tokens.filter((t) => selectedItems.has(t.id));
    mapTokenAddMany({
      variables: {
        input: {
          mapId: map.id,
          tokens: tokens.map((token) => ({
            x: token.x + 15,
            y: token.y + 15,
            color: token.color,
            label: token.label,
            radius: token.radius,
            rotation: token.rotation,
            isVisibleForPlayers: token.isVisibleForPlayers,
            isMovableByPlayers: token.isMovableByPlayers,
            isLocked: token.isLocked,
            tokenType: token.tokenType as any,
            imageUrl: token.imageUrl ?? undefined,
          })),
        },
      },
    });
  };

  return (
    <BoxLoose
      position="absolute"
      left={state.clientPosition.x}
      top={state.clientPosition.y}
      onContextMenu={(ev: React.MouseEvent) => ev.preventDefault()}
    >
      <MenuLoose defaultIsOpen={true} onClose={() => showContextMenu(null)}>
        <MenuListLoose
          bg="#1a1a2e"
          borderColor="#333366"
          boxShadow="0 4px 20px rgba(0,0,0,0.6)"
          py="4px"
          minW="200px"
        >
          {state.target?.type === "token" ? (() => {
            const token = map.tokens.find((t) => t.id === state.target?.id);
            const isVisible = token?.isVisibleForPlayers ?? false;
            const isLabelHidden = hiddenLabelTokenIds.has(state.target.id);
            const hasMultiSelection = selectedItems.size > 1 && selectedItems.has(state.target.id);
            return (
              <>
                {mi(isVisible ? "#fbbf24" : "#86efac", "#2a2a4e", () => {
                  updateManyTokens({
                    variables: {
                      input: {
                        mapId: map.id,
                        tokenIds: [state.target!.id],
                        properties: { isVisibleForPlayers: !isVisible },
                      },
                    },
                  });
                }, isVisible ? "👁 Masquer aux joueurs" : "👁 Afficher aux joueurs")}
                {mi("#ddddff", "#2a2a4e",
                  () => toggleLabelVisibility(state.target!.id),
                  isLabelHidden ? "Afficher le texte" : "Masquer le texte"
                )}
                {mi("#ddddff", "#2a2a4e", togglePropertiesPanel,
                  panelIsVisible ? "Masquer les propriétés" : "Afficher les propriétés"
                )}
                {map.combat?.isActive &&
                  token &&
                  !combatTokenIds.has(token.id) &&
                  mi("#86efac", "#1a2e1a", () => addTokenToCombat(token.id),
                    "⚔ Ajouter au combat"
                  )}
                <MenuDividerLoose borderColor="#333366" my="2px" />
                {mi("#ddddff", "#2a2a4e",
                  () => duplicateToken(state.target!.id),
                  "Dupliquer"
                )}
                {hasMultiSelection && mi("#ddddff", "#2a2a4e", duplicateSelection,
                  `Dupliquer la sélection (${selectedItems.size})`
                )}
                {hasMultiSelection && (
                  <MenuItemLoose
                    bg="transparent"
                    color="#ff6b6b"
                    _hover={{ bg: "#3a1a1a", color: "#ff9999" }}
                    onClick={() => {
                      clearSelectedItems();
                      mapTokenDeleteMany({
                        variables: {
                          input: { mapId: map.id, tokenIds: Array.from(selectedItems.keys()) },
                        },
                      });
                    }}
                  >
                    Supprimer la sélection ({selectedItems.size})
                  </MenuItemLoose>
                )}
                <MenuItemLoose
                  bg="transparent"
                  color="#ff6b6b"
                  _hover={{ bg: "#3a1a1a", color: "#ff9999" }}
                  onClick={() => {
                    mapTokenDeleteMany({
                      variables: {
                        input: { mapId: map.id, tokenIds: [state.target!.id] },
                      },
                    });
                  }}
                >
                  Supprimer
                </MenuItemLoose>
              </>
            );
          })() : selectedItems.size > 0 ? (
            <>
              {mi("#ddddff", "#2a2a4e", togglePropertiesPanel,
                panelIsVisible ? "Masquer les propriétés" : "Afficher les propriétés"
              )}
              <MenuDividerLoose borderColor="#333366" my="2px" />
              {mi("#ddddff", "#2a2a4e", duplicateSelection,
                `Dupliquer la sélection (${selectedItems.size})`
              )}
              <MenuItemLoose
                bg="transparent"
                color="#ff6b6b"
                _hover={{ bg: "#3a1a1a", color: "#ff9999" }}
                onClick={() => {
                  clearSelectedItems();
                  mapTokenDeleteMany({
                    variables: {
                      input: { mapId: map.id, tokenIds: Array.from(selectedItems.keys()) },
                    },
                  });
                }}
              >
                Supprimer la sélection ({selectedItems.size})
              </MenuItemLoose>
            </>
          ) : null}
        </MenuListLoose>
      </MenuLoose>
    </BoxLoose>
  );
};
