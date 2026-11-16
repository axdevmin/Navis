import * as React from "react";
import styled from "@emotion/styled/macro";
import * as Icon from "../../feather-icons";
import { ds } from "../../design-system";
import { controlBase } from "../../ui";

/** Les trois rayons de la bibliothèque unique du MJ. */
export type LibraryTab = "maps" | "characters" | "images";

const TABS: ReadonlyArray<{
  id: LibraryTab;
  label: string;
  icon: typeof Icon.Map;
}> = [
  { id: "maps", label: "Cartes", icon: Icon.Map },
  { id: "characters", label: "Personnages", icon: Icon.Users },
  { id: "images", label: "Images", icon: Icon.Image },
];

/**
 * En-tête commun de la bibliothèque : le même titre et les mêmes onglets,
 * quel que soit le rayon affiché, pour qu'elle se lise comme une seule
 * fenêtre.
 */
export const LibraryHeader = (props: {
  activeTab: LibraryTab;
  onSelectTab: (tab: LibraryTab) => void;
  /** Absent : la fenêtre ne peut pas être fermée (aucune carte chargée). */
  onClose?: () => void;
}): React.ReactElement => (
  <Header>
    <Title>Bibliothèque</Title>
    <Tabs role="tablist">
      {TABS.map((tab) => (
        <Tab
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === props.activeTab}
          isSelected={tab.id === props.activeTab}
          onClick={() => props.onSelectTab(tab.id)}
        >
          <tab.icon boxSize="14px" />
          <span>{tab.label}</span>
        </Tab>
      ))}
    </Tabs>
    {props.onClose ? (
      <CloseButton
        type="button"
        onClick={props.onClose}
        aria-label="Fermer la bibliothèque"
        title="Fermer (Échap)"
      >
        <Icon.X boxSize="16px" />
      </CloseButton>
    ) : null}
  </Header>
);

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  height: 52px;
  flex-shrink: 0;
  padding: 0 10px 0 16px;
  border-bottom: 1px solid ${ds.colors.border};
  font-family: ${ds.font.sans};
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${ds.colors.textPrimary};
`;

const Tabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: ${ds.radii.md};
  background: rgba(255, 255, 255, 0.05);
  margin-right: auto;
`;

const Tab = styled.button<{ isSelected: boolean }>`
  ${controlBase}
  height: 28px;
  padding: 0 10px;
  gap: 6px;
  border-radius: ${ds.radii.sm};
  color: ${(p) => (p.isSelected ? ds.colors.textPrimary : ds.colors.textMuted)};
  background: ${(p) => (p.isSelected ? ds.colors.selected : "transparent")};

  &:hover {
    background: ${(p) => (p.isSelected ? ds.colors.selected : "transparent")};
  }
`;

const CloseButton = styled.button`
  ${controlBase}
  justify-content: center;
  width: 32px;
  padding: 0;
`;
