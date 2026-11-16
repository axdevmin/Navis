import * as React from "react";
import styled from "@emotion/styled/macro";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useMutation } from "relay-hooks";
import * as Icon from "../feather-icons";
import { Toolbar } from "../toolbar";
import { ds } from "../design-system";
import { controlBase, floatingSurface } from "../ui";
import { mapNotes_MapFragment$key } from "./__generated__/mapNotes_MapFragment.graphql";
import { mapNotes_MapUpdateDescriptionMutation } from "./__generated__/mapNotes_MapUpdateDescriptionMutation.graphql";

const MapNotesFragment = graphql`
  fragment mapNotes_MapFragment on Map {
    id
    title
    description
  }
`;

const MapUpdateDescriptionMutation = graphql`
  mutation mapNotes_MapUpdateDescriptionMutation(
    $input: MapUpdateDescriptionInput!
  ) {
    mapUpdateDescription(input: $input) {
      updatedMap {
        id
        description
      }
    }
  }
`;

/** Délai sans frappe avant l'enregistrement automatique. */
const AUTOSAVE_DELAY_MS = 700;

type SaveState = "saved" | "pending" | "error";

/**
 * Notes de la carte : un simple bloc de texte attaché à la carte affichée.
 * Ce sont les mêmes notes que celles de la fenêtre « Cartes ».
 * Le panneau reste ouvert pendant qu'on manipule la carte.
 */
export const MapNotesButton = (props: {
  map: mapNotes_MapFragment$key;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}): React.ReactElement => {
  const map = useFragment(MapNotesFragment, props.map);
  const hasNotes = map.description.trim() !== "";

  return (
    <Toolbar.Item isOpen={props.isOpen} hasIndicator={hasNotes}>
      <Toolbar.Button
        onClick={() => props.setIsOpen(!props.isOpen)}
        title="Notes de cette carte"
      >
        <Icon.FileText boxSize="16px" />
        <Icon.Label>Notes</Icon.Label>
      </Toolbar.Button>
      {props.isOpen ? (
        // la clé remet le brouillon à zéro quand on change de carte
        <MapNotesPanel
          key={map.id}
          mapId={map.id}
          title={map.title}
          description={map.description}
          close={() => props.setIsOpen(false)}
        />
      ) : null}
    </Toolbar.Item>
  );
};

const MapNotesPanel = (props: {
  mapId: string;
  title: string;
  description: string;
  close: () => void;
}): React.ReactElement => {
  const [mutate] = useMutation<mapNotes_MapUpdateDescriptionMutation>(
    MapUpdateDescriptionMutation
  );
  const [draft, setDraft] = React.useState(props.description);
  const [saveState, setSaveState] = React.useState<SaveState>("saved");

  // Dernière valeur connue du serveur et dernière valeur saisie, lisibles
  // depuis les minuteries et le démontage.
  const savedRef = React.useRef(props.description);
  const draftRef = React.useRef(draft);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const value = draftRef.current;
    if (value === savedRef.current) {
      return;
    }
    savedRef.current = value;
    mutate({
      variables: { input: { mapId: props.mapId, newDescription: value } },
    })
      .then(() => {
        if (draftRef.current === value) {
          setSaveState("saved");
        }
      })
      .catch(() => {
        // on retentera à la prochaine frappe ou à la fermeture
        savedRef.current = props.description;
        setSaveState("error");
      });
  }, [mutate, props.mapId, props.description]);

  // Une modification venue d'ailleurs (fenêtre Cartes) remplace le texte
  // seulement si rien n'est en cours de saisie ici.
  React.useEffect(() => {
    if (draftRef.current === savedRef.current) {
      savedRef.current = props.description;
      draftRef.current = props.description;
      setDraft(props.description);
    }
  }, [props.description]);

  // Rien ne se perd à la fermeture du panneau ou au changement de carte.
  const saveRef = React.useRef(save);
  React.useEffect(() => {
    saveRef.current = save;
  });
  React.useEffect(() => () => saveRef.current(), []);

  return (
    <Panel
      onKeyDown={(ev) => {
        // la saisie ne doit déclencher aucun raccourci de la carte
        ev.stopPropagation();
        if (ev.key === "Escape") {
          props.close();
        }
      }}
    >
      <Header>
        <HeaderTitle>
          Notes <HeaderMap>· {props.title}</HeaderMap>
        </HeaderTitle>
        <SaveStatus state={saveState} aria-live="polite">
          {saveState === "saved"
            ? "Enregistré"
            : saveState === "pending"
            ? "Enregistrement…"
            : "Non enregistré"}
        </SaveStatus>
        <CloseButton onClick={props.close} aria-label="Fermer les notes">
          <Icon.X boxSize="14px" />
        </CloseButton>
      </Header>
      <TextArea
        autoFocus
        value={draft}
        placeholder="Ce qu'il faut avoir sous les yeux pour cette carte : pièges, PNJ, descriptions à lire…"
        spellCheck={false}
        onChange={(ev) => {
          const value = ev.target.value;
          draftRef.current = value;
          setDraft(value);
          setSaveState("pending");
          if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(save, AUTOSAVE_DELAY_MS);
        }}
        onBlur={save}
      />
    </Panel>
  );
};

const Panel = styled.div`
  ${floatingSurface}
  background: ${ds.colors.surface};
  position: absolute;
  bottom: calc(100% + 12px);
  /* le bouton Notes est au bout du dock : le panneau s'aligne à droite */
  right: -6px;
  width: 380px;
  max-width: calc(100vw - 24px);
  display: flex;
  flex-direction: column;
  z-index: 100;
  text-align: left;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 12px;
  border-bottom: 1px solid ${ds.colors.border};
`;

const HeaderTitle = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
`;

const HeaderMap = styled.span`
  font-weight: 400;
  color: ${ds.colors.textMuted};
`;

const SaveStatus = styled.span<{ state: SaveState }>`
  flex-shrink: 0;
  font-size: 12px;
  color: ${(p) =>
    p.state === "error" ? ds.colors.danger : ds.colors.textMuted};
`;

const CloseButton = styled.button`
  ${controlBase}
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
`;

const TextArea = styled.textarea`
  display: block;
  width: 100%;
  height: 300px;
  max-height: calc(100vh - 220px);
  padding: 12px;
  border: none;
  outline: none !important;
  resize: vertical;
  background: transparent;
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 14px;
  line-height: 1.55;
  border-radius: 0 0 ${ds.radii.lg} ${ds.radii.lg};

  &::placeholder {
    color: ${ds.colors.textMuted};
  }
`;
