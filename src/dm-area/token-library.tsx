import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useQuery } from "relay-hooks";
import styled from "@emotion/styled/macro";
import type { CombatFaction, TokenType } from "../map-typings";
import { buildUrl } from "../public-url";
import { getFactionMeta } from "./combat/combat-faction";
import {
  LIBRARY_CHARACTER_DRAG_TYPE,
  LibraryCharacterDragPayload,
} from "./library/library-character-drag-type";
import { tokenLibrary_Query } from "./__generated__/tokenLibrary_Query.graphql";

const TokenLibraryQuery = graphql`
  query tokenLibrary_Query {
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

const TOKEN_TYPE_COLORS: Record<TokenType, string> = {
  character: "#4488ff",
  creature: "#ff4444",
  object: "#ffaa33",
  hazard: "#ff6633",
  marker: "#aa44ff",
};

export type TokenPreset = {
  label: string;
  tokenType: TokenType;
  color: string;
  emoji: string;
  imageUrl: string;
};

const LIBRARY: Array<{ category: string; tokens: TokenPreset[] }> = [
  {
    category: "Personnages",
    tokens: [
      {
        label: "Guerrier",
        tokenType: "character",
        color: "#3355cc",
        emoji: "⚔",
        imageUrl: buildUrl("/images/tokens/warrior.svg"),
      },
      {
        label: "Mage",
        tokenType: "character",
        color: "#8833cc",
        emoji: "✨",
        imageUrl: buildUrl("/images/tokens/mage.svg"),
      },
      {
        label: "Rôdeur",
        tokenType: "character",
        color: "#336633",
        emoji: "🏹",
        imageUrl: buildUrl("/images/tokens/ranger.svg"),
      },
      {
        label: "Clerc",
        tokenType: "character",
        color: "#ccaa33",
        emoji: "✝",
        imageUrl: buildUrl("/images/tokens/cleric.svg"),
      },
      {
        label: "Roublard",
        tokenType: "character",
        color: "#333333",
        emoji: "🗡",
        imageUrl: buildUrl("/images/tokens/rogue.svg"),
      },
      {
        label: "Barbare",
        tokenType: "character",
        color: "#993333",
        emoji: "💪",
        imageUrl: buildUrl("/images/tokens/barbarian.svg"),
      },
    ],
  },
  {
    category: "Créatures",
    tokens: [
      {
        label: "Dragon",
        tokenType: "creature",
        color: "#cc2222",
        emoji: "🐉",
        imageUrl: buildUrl("/images/tokens/dragon.svg"),
      },
      {
        label: "Gobelin",
        tokenType: "creature",
        color: "#44aa44",
        emoji: "👺",
        imageUrl: buildUrl("/images/tokens/goblin.svg"),
      },
      {
        label: "Mort-Vivant",
        tokenType: "creature",
        color: "#557755",
        emoji: "💀",
        imageUrl: buildUrl("/images/tokens/undead.svg"),
      },
      {
        label: "Démon",
        tokenType: "creature",
        color: "#880022",
        emoji: "😈",
        imageUrl: buildUrl("/images/tokens/demon.svg"),
      },
      {
        label: "Loup",
        tokenType: "creature",
        color: "#776655",
        emoji: "🐺",
        imageUrl: buildUrl("/images/tokens/wolf.svg"),
      },
      {
        label: "Araignée",
        tokenType: "creature",
        color: "#222222",
        emoji: "🕷",
        imageUrl: buildUrl("/images/tokens/spider.svg"),
      },
    ],
  },
  {
    category: "Objets",
    tokens: [
      {
        label: "Coffre",
        tokenType: "object",
        color: "#886633",
        emoji: "📦",
        imageUrl: buildUrl("/images/tokens/chest.svg"),
      },
      {
        label: "Torche",
        tokenType: "object",
        color: "#cc7722",
        emoji: "🕯",
        imageUrl: buildUrl("/images/tokens/torch.svg"),
      },
      {
        label: "Potion",
        tokenType: "object",
        color: "#cc3366",
        emoji: "⚗",
        imageUrl: buildUrl("/images/tokens/potion.svg"),
      },
      {
        label: "Tonneau",
        tokenType: "object",
        color: "#774433",
        emoji: "🍺",
        imageUrl: buildUrl("/images/tokens/barrel.svg"),
      },
      {
        label: "Porte",
        tokenType: "object",
        color: "#664422",
        emoji: "🚪",
        imageUrl: buildUrl("/images/tokens/door.svg"),
      },
      {
        label: "Autel",
        tokenType: "object",
        color: "#555577",
        emoji: "⛩",
        imageUrl: buildUrl("/images/tokens/altar.svg"),
      },
    ],
  },
  {
    category: "Dangers",
    tokens: [
      {
        label: "Feu",
        tokenType: "hazard",
        color: "#dd4411",
        emoji: "🔥",
        imageUrl: buildUrl("/images/tokens/fire.svg"),
      },
      {
        label: "Piège",
        tokenType: "hazard",
        color: "#cc8822",
        emoji: "⚙",
        imageUrl: buildUrl("/images/tokens/trap.svg"),
      },
      {
        label: "Acide",
        tokenType: "hazard",
        color: "#88cc11",
        emoji: "☣",
        imageUrl: buildUrl("/images/tokens/acid.svg"),
      },
      {
        label: "Glace",
        tokenType: "hazard",
        color: "#44aacc",
        emoji: "❄",
        imageUrl: buildUrl("/images/tokens/ice.svg"),
      },
      {
        label: "Éclair",
        tokenType: "hazard",
        color: "#cccc11",
        emoji: "⚡",
        imageUrl: buildUrl("/images/tokens/lightning.svg"),
      },
      {
        label: "Poison",
        tokenType: "hazard",
        color: "#558833",
        emoji: "☠",
        imageUrl: buildUrl("/images/tokens/poison.svg"),
      },
    ],
  },
];

export const LIBRARY_DRAG_TYPE = "application/navis-token-preset";

const PanelContainer = styled.div`
  background: #1a1a2e;
  border: 1px solid #333366;
  border-radius: 8px;
  width: 280px;
  max-height: 480px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  user-select: none;
`;

const PanelHeader = styled.div`
  padding: 10px 14px 8px;
  font-size: 13px;
  font-weight: 700;
  color: #aaaadd;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 1px solid #2a2a4a;
  position: sticky;
  top: 0;
  background: #1a1a2e;
  z-index: 1;
`;

const CategoryTitle = styled.div`
  padding: 8px 14px 4px;
  font-size: 10px;
  font-weight: 700;
  color: #7777aa;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 4px 10px 8px;
`;

const TokenButton = styled.button<{ typeColor: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px 5px;
  background: #12122a;
  border: 2px solid ${(p) => p.typeColor};
  border-radius: 8px;
  cursor: grab;
  transition: background 0.15s, transform 0.1s;
  color: #ddddff;
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  word-break: break-word;

  &:hover {
    background: #1e1e3e;
    transform: scale(1.04);
  }

  &:active {
    transform: scale(0.96);
    cursor: grabbing;
  }
`;

const TokenPreviewImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  pointer-events: none;
`;

const CharacterAvatarFallback = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(p) => p.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  pointer-events: none;
`;

export const TokenLibrary = () => {
  const { data } = useQuery<tokenLibrary_Query>(TokenLibraryQuery);

  const onDragStart = (
    ev: React.DragEvent<HTMLButtonElement>,
    preset: TokenPreset
  ) => {
    ev.dataTransfer.setData(LIBRARY_DRAG_TYPE, JSON.stringify(preset));
    ev.dataTransfer.effectAllowed = "copy";
  };

  const onCharacterDragStart = (
    ev: React.DragEvent<HTMLButtonElement>,
    payload: LibraryCharacterDragPayload
  ) => {
    ev.dataTransfer.setData(LIBRARY_CHARACTER_DRAG_TYPE, JSON.stringify(payload));
    ev.dataTransfer.effectAllowed = "copy";
  };

  return (
    <PanelContainer>
      <PanelHeader>Bibliothèque de tokens</PanelHeader>
      {data && data.libraryCharacters.length > 0 ? (
        <React.Fragment>
          <CategoryTitle>Personnages</CategoryTitle>
          <TokenGrid>
            {data.libraryCharacters.map((character) => {
              const faction = getFactionMeta(character.faction);
              const payload: LibraryCharacterDragPayload = {
                label: character.name,
                faction: character.faction as CombatFaction,
                color: character.color,
                imageUrl: character.tokenImage?.url ?? null,
              };
              return (
                <TokenButton
                  key={character.id}
                  typeColor={faction.color}
                  title={`Glisser pour placer : ${character.name}`}
                  draggable
                  onDragStart={(ev) => onCharacterDragStart(ev, payload)}
                >
                  {character.tokenImage ? (
                    <TokenPreviewImage
                      src={character.tokenImage.url}
                      alt={character.name}
                      draggable={false}
                    />
                  ) : (
                    <CharacterAvatarFallback color={character.color}>
                      {faction.emoji}
                    </CharacterAvatarFallback>
                  )}
                  {character.name}
                </TokenButton>
              );
            })}
          </TokenGrid>
        </React.Fragment>
      ) : null}
      {LIBRARY.map((section) => (
        <React.Fragment key={section.category}>
          <CategoryTitle>{section.category}</CategoryTitle>
          <TokenGrid>
            {section.tokens.map((preset) => (
              <TokenButton
                key={preset.label}
                typeColor={TOKEN_TYPE_COLORS[preset.tokenType]}
                title={`Glisser pour placer : ${preset.label}`}
                draggable
                onDragStart={(ev) => onDragStart(ev, preset)}
              >
                <TokenPreviewImage
                  src={preset.imageUrl}
                  alt={preset.label}
                  draggable={false}
                />
                {preset.label}
              </TokenButton>
            ))}
          </TokenGrid>
        </React.Fragment>
      ))}
    </PanelContainer>
  );
};
