import * as React from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled/macro";
import graphql from "babel-plugin-relay/macro";
import { useQuery } from "relay-hooks";
import * as Icon from "../feather-icons";
import { ds } from "../design-system";
import { floatingSurface, Kbd } from "../ui";
import { commandPalette_MapsQuery } from "./__generated__/commandPalette_MapsQuery.graphql";

/** Événement global pour ouvrir la palette depuis n'importe où dans l'app. */
export const OPEN_COMMAND_PALETTE_EVENT = "navis:open-command-palette";

export const openCommandPalette = (): void => {
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
};

export type PaletteCommand = {
  id: string;
  title: string;
  /** Section sous laquelle la commande est rangée. */
  group: string;
  icon: React.ReactElement;
  /** Mots supplémentaires reconnus par la recherche. */
  keywords?: string;
  shortcut?: ReadonlyArray<string>;
  danger?: boolean;
  run: () => void;
};

const MapsQuery = graphql`
  query commandPalette_MapsQuery($needle: String) {
    maps(first: 8, titleNeedle: $needle) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`;

/** Minuscules sans accents, pour que « meteo » trouve « Météo ». */
const normalize = (value: string): string =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const matches = (haystack: string, needle: string): boolean => {
  const normalizedHaystack = normalize(haystack);
  return normalize(needle)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => normalizedHaystack.includes(word));
};

const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
};

type Entry = PaletteCommand & { detail?: string };

export const CommandPalette = (props: {
  commands: ReadonlyArray<PaletteCommand>;
  currentMapId: string;
  onLoadMap: (mapId: string) => void;
  close: () => void;
}): React.ReactElement => {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const trimmedQuery = query.trim();
  const remoteQuery = useDebouncedValue(trimmedQuery, 180);
  const hasRemoteQuery = remoteQuery.length >= 2;

  const mapsResponse = useQuery<commandPalette_MapsQuery>(
    MapsQuery,
    { needle: remoteQuery },
    { skip: !hasRemoteQuery }
  );
  const entries = React.useMemo<Array<Entry>>(() => {
    const result: Array<Entry> = props.commands.filter(
      (command) =>
        trimmedQuery === "" ||
        matches(
          `${command.title} ${command.group} ${command.keywords ?? ""}`,
          trimmedQuery
        )
    );

    // Les résultats distants ne valent que pour la recherche en cours.
    if (trimmedQuery.length >= 2 && hasRemoteQuery) {
      for (const edge of mapsResponse.data?.maps.edges ?? []) {
        if (edge.node.id === props.currentMapId) continue;
        result.push({
          id: `map:${edge.node.id}`,
          title: edge.node.title,
          group: "Cartes",
          icon: <Icon.Map boxSize="16px" />,
          detail: "Charger la carte",
          run: () => props.onLoadMap(edge.node.id),
        });
      }
    }
    return result;
  }, [
    props.commands,
    props.currentMapId,
    trimmedQuery,
    hasRemoteQuery,
    mapsResponse.data,
  ]);

  // La sélection reste dans les bornes quand la liste change.
  React.useEffect(() => {
    setActiveIndex(0);
  }, [trimmedQuery]);
  const safeIndex = Math.min(activeIndex, Math.max(0, entries.length - 1));

  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${safeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeIndex]);

  const runEntry = (entry: Entry | undefined) => {
    if (!entry) return;
    props.close();
    entry.run();
  };

  const isSearching =
    hasRemoteQuery && !mapsResponse.data && !mapsResponse.error;

  let lastGroup: string | null = null;

  return createPortal(
    <Backdrop
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) props.close();
      }}
      onContextMenu={(ev) => ev.stopPropagation()}
    >
      <Window
        role="dialog"
        aria-label="Palette de commandes"
        onKeyDown={(ev) => {
          // la palette garde le clavier : pas de raccourci d'outil derrière
          ev.stopPropagation();
          if (ev.key === "Escape") {
            ev.preventDefault();
            props.close();
          } else if (ev.key === "ArrowDown") {
            ev.preventDefault();
            setActiveIndex(
              entries.length === 0 ? 0 : (safeIndex + 1) % entries.length
            );
          } else if (ev.key === "ArrowUp") {
            ev.preventDefault();
            setActiveIndex(
              entries.length === 0
                ? 0
                : (safeIndex - 1 + entries.length) % entries.length
            );
          } else if (ev.key === "Enter") {
            ev.preventDefault();
            runEntry(entries[safeIndex]);
          }
        }}
      >
        <SearchRow>
          <Icon.Search boxSize="16px" />
          <SearchInput
            autoFocus
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder="Chercher une action ou une carte…"
            aria-label="Chercher une action ou une carte"
            spellCheck={false}
          />
        </SearchRow>
        <List ref={listRef} role="listbox">
          {entries.length === 0 ? (
            <Empty>
              {isSearching
                ? "Recherche…"
                : `Aucun résultat pour « ${trimmedQuery} ».`}
            </Empty>
          ) : (
            entries.map((entry, index) => {
              const header =
                entry.group !== lastGroup ? (
                  <GroupTitle>{entry.group}</GroupTitle>
                ) : null;
              lastGroup = entry.group;
              return (
                <React.Fragment key={entry.id}>
                  {header}
                  <Row
                    role="option"
                    aria-selected={index === safeIndex}
                    data-index={index}
                    isActive={index === safeIndex}
                    danger={entry.danger}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => runEntry(entry)}
                  >
                    <RowIcon>{entry.icon}</RowIcon>
                    <RowTitle>{entry.title}</RowTitle>
                    <RowDetail>{entry.detail ?? ""}</RowDetail>
                    {entry.shortcut ? <Kbd keys={entry.shortcut} /> : null}
                  </Row>
                </React.Fragment>
              );
            })
          )}
        </List>
        <Footer>
          <FooterHint>
            <Kbd keys={["↑", "↓"]} /> Naviguer
          </FooterHint>
          <FooterHint>
            <Kbd keys={["↵"]} /> Exécuter
          </FooterHint>
          <FooterHint>
            <Kbd keys={["esc"]} /> Fermer
          </FooterHint>
        </Footer>
      </Window>
    </Backdrop>,
    document.getElementById("modal")!
  );
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 14vh 16px 16px;
  background: rgba(0, 0, 0, 0.35);
`;

const Window = styled.div`
  ${floatingSurface}
  background: rgba(20, 20, 22, 0.96);
  width: 100%;
  max-width: 620px;
  max-height: min(520px, 72vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SearchRow = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid ${ds.colors.border};
  color: ${ds.colors.textMuted};
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none !important;
  background: transparent;
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 15px;
  letter-spacing: -0.01em;

  &::placeholder {
    color: ${ds.colors.textMuted};
  }
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 6px;
`;

const GroupTitle = styled.div`
  padding: 10px 10px 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${ds.colors.textMuted};
`;

const Row = styled.button<{ isActive: boolean; danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: none;
  border-radius: ${ds.radii.md};
  background: ${(p) => (p.isActive ? ds.colors.selected : "transparent")};
  color: ${(p) => (p.danger ? ds.colors.danger : ds.colors.textPrimary)};
  font-family: ${ds.font.sans};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  text-align: left;
  cursor: pointer;
`;

const RowIcon = styled.span`
  display: flex;
  flex-shrink: 0;
  color: ${ds.colors.textSecondary};

  ${Row}[aria-selected="true"] & {
    color: inherit;
  }
`;

const RowTitle = styled.span`
  flex-shrink: 0;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowDetail = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${ds.colors.textMuted};
  font-weight: 400;
`;

const Empty = styled.div`
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: ${ds.colors.textMuted};
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 8px 12px;
  border-top: 1px solid ${ds.colors.border};
  background: rgba(255, 255, 255, 0.02);
  flex-shrink: 0;
`;

const FooterHint = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${ds.colors.textMuted};
`;
