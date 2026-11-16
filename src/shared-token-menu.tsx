import * as React from "react";
import { Box } from "@chakra-ui/react";
import { useControls, useCreateStore, LevaInputs } from "leva";
import graphql from "babel-plugin-relay/macro";
import { useMutation, useQuery } from "relay-hooks";
import create from "zustand";
import { persist } from "zustand/middleware";
import * as Json from "fp-ts/Json";
import { flow, identity } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as io from "io-ts";
import { ThemedLevaPanel } from "./themed-leva-panel";
import { useSelectedItems, usePropertiesPanel } from "./shared-token-state";
import { levaPluginTokenImage } from "./leva-plugin/leva-plugin-token-image";
import type { sharedTokenMenuUpdateManyMapTokenMutation } from "./__generated__/sharedTokenMenuUpdateManyMapTokenMutation.graphql";
import type { sharedTokenMenuReferenceNoteQuery } from "./__generated__/sharedTokenMenuReferenceNoteQuery.graphql";

import { State, StoreType } from "leva/dist/declarations/src/types";
import { levaPluginNotePreview } from "./leva-plugin/leva-plugin-note-preview";

const firstMapValue = <TItemValue extends any>(
  map: Map<any, TItemValue>
): TItemValue => map.values().next().value as TItemValue;

const referenceIdSelector = (state: State): string | null =>
  (state.data["referenceId"] as any)?.value ?? null;

const TokenMenuExpandedStateModel = io.type({
  isTokenNoteDescriptionExpanded: io.boolean,
  isTokenMenuExpanded: io.boolean,
});

const PersistedValue = <TType extends io.Type<any>>(stateModel: TType) =>
  io.type({
    version: io.number,
    state: stateModel,
  });

type TokenMenuExpandedStateModelType = io.TypeOf<
  typeof TokenMenuExpandedStateModel
>;

type TokenMenuExpandedState = TokenMenuExpandedStateModelType & {
  setIsTokenNoteDescriptionExpanded: (isExpanded: boolean) => void;
  setIsTokenMenuExpanded: (isExpanded: boolean) => void;
};

const defaultTokenMenuExpandedStateModel: Readonly<TokenMenuExpandedStateModelType> =
  {
    isTokenNoteDescriptionExpanded: true,
    isTokenMenuExpanded: true,
  };

const deserializeTokenMenuExpandedState = flow(
  Json.parse,
  E.chainW(PersistedValue(TokenMenuExpandedStateModel).decode),
  E.fold(
    () => ({
      version: 0,
      state: { ...defaultTokenMenuExpandedStateModel },
    }),
    identity
  )
);

const useTokenMenuExpandedState = create<TokenMenuExpandedState>(
  persist(
    (set) => ({
      ...defaultTokenMenuExpandedStateModel,
      setIsTokenNoteDescriptionExpanded: (isTokenNoteDescriptionExpanded) =>
        set({ isTokenNoteDescriptionExpanded }),
      setIsTokenMenuExpanded: (isTokenMenuExpanded) =>
        set({ isTokenMenuExpanded }),
    }),
    {
      name: "tokenMenuExpandedState",
      // we deserialize the value in a safe way :)
      deserialize: deserializeTokenMenuExpandedState as any,
    }
  )
);

const tokenMenuStateSelector = (state: TokenMenuExpandedState) =>
  [state.isTokenMenuExpanded, state.setIsTokenMenuExpanded] as const;
const useTokenMenuState = () =>
  useTokenMenuExpandedState(tokenMenuStateSelector);

const tokenNoteDescriptionStateSelector = (state: TokenMenuExpandedState) =>
  [
    state.isTokenNoteDescriptionExpanded,
    state.setIsTokenNoteDescriptionExpanded,
  ] as const;
const useTokenNoteDescriptionState = () =>
  useTokenMenuExpandedState(tokenNoteDescriptionStateSelector);

export const SharedTokenMenu = (props: { currentMapId: string }) => {
  const [selectedItems] = useSelectedItems();
  const [propertiesPanelHidden] = usePropertiesPanel();

  if (propertiesPanelHidden || selectedItems.size === 0) return null;

  return (
    <div
      style={{
        // À gauche, sous le rail d'outils : le côté droit appartient au suivi
        // de combat et au chat, les deux panneaux se recouvraient.
        position: "absolute",
        left: 70,
        bottom: 64,
        zIndex: 25,
        width: 300,
        maxWidth: "calc(100vw - 82px)",
        maxHeight: "calc(100% - 144px)",
        overflowY: "auto",
        borderRadius: 12,
      }}
      onKeyDown={(ev) => ev.stopPropagation()}
    >
      {selectedItems.size === 1 ? (
        <SingleTokenPanels store={firstMapValue(selectedItems)} />
      ) : (
        <MultiTokenPanel currentMapId={props.currentMapId} />
      )}
    </div>
  );
};

const SharedTokenMenuReferenceNoteQuery = graphql`
  query sharedTokenMenuReferenceNoteQuery($noteId: ID!) {
    note(documentId: $noteId) {
      id
      documentId
      title
      content
    }
  }
`;

const TokenNotePreview = (props: {
  id: string;
  markdown: string;
  title: string;
}) => {
  const store = useCreateStore();

  useControls(
    {
      " ": levaPluginNotePreview({
        value: {
          id: props.id,
          markdown: props.markdown,
        },
      }),
    },
    { store }
  );

  const [show, setShow] = useTokenNoteDescriptionState();

  return (
    <Box marginBottom="3">
      <ThemedLevaPanel
        store={store}
        fill={true}
        hideCopyButton
        titleBar={{
          filter: false,
          drag: false,
          title: props.title,
        }}
        collapsed={{
          collapsed: !show,
          onChange: (collapsed) => setShow(!collapsed),
        }}
      />
    </Box>
  );
};

const NoteAsidePreview = (props: { noteId: string }) => {
  const noteProps = useQuery<sharedTokenMenuReferenceNoteQuery>(
    SharedTokenMenuReferenceNoteQuery,
    { noteId: props.noteId }
  );

  if (noteProps.data?.note == null) {
    return null;
  }

  return (
    <TokenNotePreview
      id={noteProps.data.note.documentId}
      markdown={noteProps.data.note.content}
      title={noteProps.data.note.title}
    />
  );
};

const SingleTokenPanels = (props: { store: StoreType }) => {
  const referenceId = props.store.useStore(referenceIdSelector);

  const [show, setShow] = useTokenMenuState();

  return (
    <>
      {referenceId == null ? null : <NoteAsidePreview noteId={referenceId} />}
      <ThemedLevaPanel
        store={props.store}
        fill={true}
        hideCopyButton
        titleBar={{
          filter: false,
          drag: false,
          title: "Token — touches + et − pour la taille",
        }}
        collapsed={{
          collapsed: !show,
          onChange: (collapsed) => setShow(!collapsed),
        }}
      />
    </>
  );
};

const SharedTokenMenuUpdateManyMapTokenMutation = graphql`
  mutation sharedTokenMenuUpdateManyMapTokenMutation(
    $input: MapTokenUpdateManyInput!
  ) {
    mapTokenUpdateMany(input: $input)
  }
`;

const MultiTokenPanel = (props: { currentMapId: string }) => {
  const store = useCreateStore();
  const [selectedItems] = useSelectedItems();

  const allSelectedItemsRef = React.useRef(selectedItems);
  React.useEffect(() => {
    allSelectedItemsRef.current = selectedItems;
  });

  let tokenImageId: null | string = null;
  for (const store of selectedItems.values()) {
    let currentTokenImageId = store.get("tokenImageId");
    if (currentTokenImageId) {
      tokenImageId = "__ID_THAT_WILL_NOT_COLLIDE_SO_WE_CAN_CHOOSE_ANY_IMAGE__";
      break;
    }
  }

  const [mutate] = useMutation<sharedTokenMenuUpdateManyMapTokenMutation>(
    SharedTokenMenuUpdateManyMapTokenMutation
  );

  const [, set] = useControls(
    () => {
      const firstItem = selectedItems.values().next().value;

      return {
        color: {
          type: LevaInputs.COLOR,
          label: "Couleur",
          value: firstItem.get("color"),
          onChange: (color: string, _, { initial, fromPanel }) => {
            if (initial || !fromPanel) {
              return;
            }
            for (const store of allSelectedItemsRef.current.values()) {
              store.set({ color }, false);
            }
          },
          onEditEnd: (color: string) => {
            mutate({
              variables: {
                input: {
                  mapId: props.currentMapId,
                  tokenIds: Array.from(allSelectedItemsRef.current.keys()),
                  properties: {
                    color,
                  },
                },
              },
            });
          },
        },
        isVisibleForPlayers: {
          type: LevaInputs.BOOLEAN,
          label: "Visibles par les joueurs",
          value: firstItem.get("isVisibleForPlayers"),
          onChange: (
            isVisibleForPlayers: boolean,
            _,
            { initial, fromPanel }
          ) => {
            if (initial || !fromPanel) {
              return;
            }
            for (const store of allSelectedItemsRef.current.values()) {
              store.set({ isVisibleForPlayers }, false);
            }
            mutate({
              variables: {
                input: {
                  mapId: props.currentMapId,
                  tokenIds: Array.from(allSelectedItemsRef.current.keys()),
                  properties: {
                    isVisibleForPlayers,
                  },
                },
              },
            });
          },
        },
        isMovableByPlayers: {
          type: LevaInputs.BOOLEAN,
          label: "Déplaçables par les joueurs",
          value: firstItem.get("isMovableByPlayers"),
          onChange: (
            isMovableByPlayers: boolean,
            _,
            { initial, fromPanel }
          ) => {
            if (initial || !fromPanel) {
              return;
            }
            for (const store of allSelectedItemsRef.current.values()) {
              store.set({ isMovableByPlayers }, false);
            }
            mutate({
              variables: {
                input: {
                  mapId: props.currentMapId,
                  tokenIds: Array.from(allSelectedItemsRef.current.keys()),
                  properties: {
                    isMovableByPlayers,
                  },
                },
              },
            });
          },
        },
        tokenImageId: levaPluginTokenImage({
          value: tokenImageId,
          onChange: (
            tokenImageId: null | string,
            _,
            { initial, fromPanel }
          ) => {
            if (initial || !fromPanel) {
              return;
            }
            for (const store of allSelectedItemsRef.current.values()) {
              store.set({ tokenImageId }, false);
            }
            mutate({
              variables: {
                input: {
                  mapId: props.currentMapId,
                  tokenIds: Array.from(allSelectedItemsRef.current.keys()),
                  properties: {
                    tokenImageId,
                  },
                },
              },
            });
          },
          transient: false,
        }),
      };
    },
    { store }
  );

  // Workaround as dependency array does not seem to work atm :(
  React.useEffect(() => {
    set({ tokenImageId });
  }, [tokenImageId]);

  const [show, setShow] = useTokenMenuState();

  return (
    <ThemedLevaPanel
      store={store}
      fill={true}
      hideCopyButton
      titleBar={{
        filter: false,
        drag: false,
        title: `${selectedItems.size} tokens sélectionnés`,
      }}
      collapsed={{
        collapsed: !show,
        onChange: (collapsed) => setShow(!collapsed),
      }}
    />
  );
};
