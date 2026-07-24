import React from "react";
import styled from "@emotion/styled/macro";
import graphql from "babel-plugin-relay/macro";
import {
  Input,
  Flex,
  VStack,
  Tooltip,
  Text,
  Box,
  FormControl,
  FormLabel,
  Switch,
  Stack,
} from "@chakra-ui/react";
import { loose } from "../../chakra-loose";

const InputLoose = loose(Input);
const FlexLoose = loose(Flex);
const VStackLoose = loose(VStack);
const TooltipLoose = loose(Tooltip);
const TextLoose = loose(Text);
const BoxLoose = loose(Box);
const FormControlLoose = loose(FormControl);
const FormLabelLoose = loose(FormLabel);
const SwitchLoose = loose(Switch);
const StackLoose = loose(Stack);
import { useNoteWindows, useNoteWindowActions } from ".";
import { NoteEditorActiveItem } from "../note-editor/note-editor-active-item";
import { useQuery, useMutation, useFragment } from "relay-hooks";
import type {
  tokenInfoAside_nodeQuery,
  tokenInfoAside_nodeQueryResponse,
} from "./__generated__/tokenInfoAside_nodeQuery.graphql";
import { DraggableWindow } from "../../draggable-window";
import * as Icon from "../../feather-icons";
import * as Button from "../../button";
import * as HorizontalNavigation from "../../horizontal-navigation";
import { tokenInfoAside_shareNoteMutation } from "./__generated__/tokenInfoAside_shareNoteMutation.graphql";
import { tokenInfoAside_permissionsPopUpFragment$key } from "./__generated__/tokenInfoAside_permissionsPopUpFragment.graphql";
import { useCurrent } from "../../hooks/use-current";
import { useNoteTitleAutoSave } from "../../hooks/use-note-title-auto-save";
import { useOnClickOutside } from "../../hooks/use-on-click-outside";
import { tokenInfoAside_noteUpdateAccessMutation } from "./__generated__/tokenInfoAside_noteUpdateAccessMutation.graphql";
import { TokenInfoSideBar } from "./token-info-side-bar";
import { tokenInfoAside_NoteCreateMutation } from "./__generated__/tokenInfoAside_NoteCreateMutation.graphql";
import { tokenInfoAside_NoteDeleteMutation } from "./__generated__/tokenInfoAside_NoteDeleteMutation.graphql";
import { useConfirmationDialog } from "../../hooks/use-confirmation-dialog";
import { useViewerRole } from "../../authenticated-app-shell";
import { tokenInfoAside_noteUpdateIsEntryPointMutation } from "./__generated__/tokenInfoAside_noteUpdateIsEntryPointMutation.graphql";

const TokenInfoAside_permissionsPopUpFragment = graphql`
  fragment tokenInfoAside_permissionsPopUpFragment on Note {
    id
    access
    isEntryPoint
  }
`;

const TokenInfoAside_nodeQuery = graphql`
  query tokenInfoAside_nodeQuery($documentId: ID!) @live {
    note(documentId: $documentId) {
      id
      title
      viewerCanEdit
      viewerCanShare
      ...noteEditorActiveItem_nodeFragment
      ...tokenInfoAside_permissionsPopUpFragment
    }
  }
`;

const TokenInfoAside_shareResourceMutation = graphql`
  mutation tokenInfoAside_shareNoteMutation($input: ShareResourceInput!) {
    shareResource(input: $input)
  }
`;

const TokenInfoAside_noteUpdateAccessMutation = graphql`
  mutation tokenInfoAside_noteUpdateAccessMutation(
    $input: NoteUpdateAccessInput!
  ) {
    noteUpdateAccess(input: $input) {
      note {
        id
        access
        viewerCanShare
      }
    }
  }
`;

const TokenInfoAside_nodeUpdateIsEntryPointMutation = graphql`
  mutation tokenInfoAside_noteUpdateIsEntryPointMutation(
    $input: NoteUpdateIsEntryPointInput!
  ) {
    noteUpdateIsEntryPoint(input: $input) {
      note {
        id
        isEntryPoint
      }
    }
  }
`;

const TokenInfoAside_NoteDeleteMutation = graphql`
  mutation tokenInfoAside_NoteDeleteMutation($input: NoteDeleteInput!) {
    noteDelete(input: $input) {
      success
      deletedNoteId
    }
  }
`;

const TokenInfoAside_NoteCreateMutation = graphql`
  mutation tokenInfoAside_NoteCreateMutation($input: NoteCreateInput!) {
    noteCreate(input: $input) {
      note {
        id
        documentId
        title
        content
        access
      }
    }
  }
`;

const NoteEditorSideReference = styled.div`
  position: absolute;
  left: calc(100% + 12px);
  top: 25%;
  width: 300px;
  background: #1a1b2e;
  border-left: 1px solid #333366;
  border-radius: 5px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
`;

const WindowContext = React.createContext("NON_EXISTING_WINDOW");
export const useWindowContext = () => React.useContext(WindowContext);

const extractNode = (
  input: tokenInfoAside_nodeQueryResponse | null | undefined
) => {
  if (!input?.note) return null;
  return input.note;
};

const TitleAutoSaveInput = (props: { id: string; title: string }) => {
  const [title, setTitle] = useNoteTitleAutoSave(props.id, props.title);
  return (
    <InputLoose
      variant="filled"
      size="sm"
      value={title}
      width="100%"
      maxWidth="500px"
      onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
        setTitle(ev.target.value)
      }
    />
  );
};

const PermissionMenuContainer = styled.div`
  background-color: #1a1b2e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  border-radius: 5px;
  padding: 8px;
  position: absolute;
  z-index: 900;
`;

const PermissionsMenu = (props: {
  close: () => void;
  position: { x: number; y: number };
  fragmentRef: tokenInfoAside_permissionsPopUpFragment$key;
}) => {
  const data = useFragment(
    TokenInfoAside_permissionsPopUpFragment,
    props.fragmentRef
  );
  const [updateNoteAccess] =
    useMutation<tokenInfoAside_noteUpdateAccessMutation>(
      TokenInfoAside_noteUpdateAccessMutation
    );
  const [updateIsEntryPoint] =
    useMutation<tokenInfoAside_noteUpdateIsEntryPointMutation>(
      TokenInfoAside_nodeUpdateIsEntryPointMutation
    );
  const ref = React.useRef<null | HTMLDivElement>(null);
  useOnClickOutside<HTMLDivElement>(ref, props.close);

  return (
    <PermissionMenuContainer
      ref={ref}
      style={{
        top: props.position.y,
        left: props.position.x,
      }}
    >
      <StackLoose spacing="2">
        <FormControlLoose size="xs">
          <FormLabelLoose fontSize="sm">Access</FormLabelLoose>
          <HorizontalNavigation.Group>
            <TooltipLoose label="Only the DM can access this note.">
              <HorizontalNavigation.Button
                small
                isActive={data.access === "admin"}
                onClick={() =>
                  updateNoteAccess({
                    variables: { input: { id: data.id, access: "admin" } },
                  })
                }
              >
                Admin
              </HorizontalNavigation.Button>
            </TooltipLoose>
            <TooltipLoose label="Everyone can access this note.">
              <HorizontalNavigation.Button
                small
                isActive={data.access === "public"}
                onClick={() =>
                  updateNoteAccess({
                    variables: { input: { id: data.id, access: "public" } },
                  })
                }
              >
                Public
              </HorizontalNavigation.Button>
            </TooltipLoose>
          </HorizontalNavigation.Group>
        </FormControlLoose>
        <TooltipLoose label="Whether the note is a entry point.">
          <FormControlLoose display="flex" alignItems="center" size="xs">
            <FormLabelLoose fontSize="sm" htmlFor="is-entry-point-toggle" mb="0">
              Entry Point
            </FormLabelLoose>
            <SwitchLoose
              size="sm"
              id="is-entry-point-toggle"
              isChecked={data.isEntryPoint}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                updateIsEntryPoint({
                  variables: {
                    input: { id: data.id, isEntryPoint: ev.target.checked },
                  },
                  optimisticResponse: {
                    noteUpdateIsEntryPoint: {
                      note: {
                        id: data.id,
                        isEntryPoint: ev.target.checked,
                      },
                    },
                  },
                });
              }}
            />
          </FormControlLoose>
        </TooltipLoose>
      </StackLoose>
    </PermissionMenuContainer>
  );
};

const WindowRenderer = (props: {
  windowId: string;
  noteId: string | null;
  close: () => void;
  focus: () => void;
  navigateNext: null | (() => void);
  navigateBack: null | (() => void);
  replaceCurrent: (noteId: string | null) => void;
  initialShowLibrary: boolean;
}) => {
  const isSkipped = props.noteId === null;
  const data = useQuery<tokenInfoAside_nodeQuery>(
    TokenInfoAside_nodeQuery,
    React.useMemo(() => ({ documentId: props.noteId ?? "" }), [props.noteId]),
    React.useMemo(
      () => ({ skip: isSkipped, fetchPolicy: "store-and-network" }),
      [isSkipped]
    )
  );

  const [showLibrary, setShowLibrary] = React.useState(
    props.initialShowLibrary
  );

  const isLoading = !data.data && !data.error && !isSkipped;

  const [, node] = useCurrent(extractNode(data.data), isLoading, 300);

  const [isEditMode, setIsEditMode] = React.useState(false);
  const sideBarRef = React.useRef<HTMLDivElement>(null);

  const [shareNoteMutation] = useMutation<tokenInfoAside_shareNoteMutation>(
    TokenInfoAside_shareResourceMutation
  );

  const [createNoteMutation] = useMutation<tokenInfoAside_NoteCreateMutation>(
    TokenInfoAside_NoteCreateMutation
  );
  const [deleteNoteMutation] = useMutation<tokenInfoAside_NoteDeleteMutation>(
    TokenInfoAside_NoteDeleteMutation
  );

  const [permissionPopUpNode, setPermissionPopUpNode] =
    React.useState<React.ReactNode>(null);
  const viewerRole = useViewerRole();
  const isDm = viewerRole === "DM";

  const canEditOptions =
    node?.viewerCanEdit && isDm
      ? [
          {
            onClick: () => setIsEditMode((isEditMode) => !isEditMode),
            title: isEditMode ? "Save" : "Edit",
            icon: isEditMode ? (
              <Icon.Save boxSize="16px" />
            ) : (
              <Icon.Edit boxSize="16px" />
            ),
            isDisabled: props.noteId === null || !data.data,
          },
          {
            onClick: () => {
              showConfirmationDialog({
                header: "Supprimer la note",
                body: "Voulez-vous vraiment supprimer cette note ?",
                cancelButtonText: "Annuler",
                confirmButtonText: "Supprimer",
                onConfirm: () => {
                  const noteId = node.id;

                  deleteNoteMutation({
                    variables: {
                      input: { noteId },
                    },
                    onCompleted: () => {
                      props.replaceCurrent(null);
                      setIsEditMode(false);
                    },
                  });
                },
              });
            },
            title: "Supprimer la note",
            icon: <Icon.Trash boxSize="16px" />,
            isDisabled: props.noteId === null || !data.data,
          },
          {
            onClick: (ev: React.MouseEvent) => {
              if (!node) return;
              const coords = ev.currentTarget.getBoundingClientRect();
              setPermissionPopUpNode(
                <PermissionsMenu
                  close={() => setPermissionPopUpNode(null)}
                  position={{ x: coords.left, y: coords.bottom }}
                  fragmentRef={node}
                />
              );
            },
            title: "Edit access",
            icon: <Icon.Eye boxSize="16px" />,
            isDisabled: props.noteId === null || !data.data,
          },
        ]
      : [];

  const canShareOptions = node?.viewerCanShare
    ? [
        {
          onClick: () =>
            node
              ? shareNoteMutation({
                  variables: { input: { contentId: node.id } },
                })
              : () => undefined,
          title: "Share",
          icon: <Icon.Share boxSize="16px" />,
          isDisabled: props.noteId === null || !data.data,
        },
      ]
    : [];

  const options = [...canEditOptions, ...canShareOptions];

  // Ref with callback for resizing the editor.
  const editorOnResizeRef = React.useRef(() => undefined);

  const actions = useNoteWindowActions();
  const [confirmationDialog, showConfirmationDialog] = useConfirmationDialog();

  const createNewNote = () => {
    createNoteMutation({
      variables: {
        input: {
          title: "<Untitled Note>",
          content: "",
          isEntryPoint: true,
        },
      },
      onCompleted: (data) => {
        actions.showNoteInWindow(
          data.noteCreate.note.documentId,
          props.windowId
        );
        setIsEditMode(true);
      },
    });
  };

  return (
    <WindowContext.Provider value={props.windowId}>
      {confirmationDialog}
      <DraggableWindow
        onMouseDown={props.focus}
        onKeyDown={(ev) => {
          ev.stopPropagation();
          if (ev.key !== "Escape") {
            return;
          }
          if (!isEditMode) {
            props.close();
          }
        }}
        headerLeftContent={
          <>
            <TooltipLoose label="Open library">
              <Button.Tertiary
                small
                iconOnly
                onClick={() => setShowLibrary((showLibrary) => !showLibrary)}
              >
                <Icon.BookOpen boxSize="16px" />
              </Button.Tertiary>
            </TooltipLoose>
            {isDm ? (
              <TooltipLoose label="Create new note">
                <Button.Tertiary
                  small
                  iconOnly
                  onClick={() => {
                    createNewNote();
                  }}
                >
                  <Icon.FilePlus boxSize="16px" />
                </Button.Tertiary>
              </TooltipLoose>
            ) : null}

            <Button.Tertiary
              small
              iconOnly
              onClick={props.navigateBack || undefined}
              disabled={!props.navigateBack}
              style={{ paddingLeft: 4, paddingRight: 4 }}
            >
              <Icon.ChevronLeft boxSize="16px" />
            </Button.Tertiary>
            <Button.Tertiary
              small
              iconOnly
              onClick={props.navigateNext || undefined}
              disabled={!props.navigateNext}
              style={{ paddingLeft: 4, paddingRight: 4 }}
            >
              <Icon.ChevronRight boxSize="16px" />
            </Button.Tertiary>
          </>
        }
        headerContent={
          node ? (
            isEditMode ? (
              <TitleAutoSaveInput
                id={node.id}
                title={node.title}
                key={node.id}
              />
            ) : (
              node.title
            )
          ) : isLoading ? (
            "Chargement..."
          ) : isSkipped ? null : (
            "Introuvable"
          )
        }
        bodyContent={
          node ? (
            <>
              <NoteEditorActiveItem
                key={node.id}
                isEditMode={isEditMode}
                toggleIsEditMode={() =>
                  setIsEditMode((isEditMode) => !isEditMode)
                }
                nodeRef={node}
                sideBarRef={sideBarRef}
                editorOnResizeRef={editorOnResizeRef}
              />
              <NoteEditorSideReference>
                <div ref={sideBarRef} />
              </NoteEditorSideReference>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              {isLoading ? (
                "Chargement..."
              ) : isSkipped ? (
                <>
                  <VStackLoose>
                    {viewerRole === "DM" ? (
                      <>
                        <TextLoose>Ouvrir ou créer une nouvelle note</TextLoose>
                        <BoxLoose>
                          <Button.Primary
                            small
                            onClick={() => {
                              createNewNote();
                            }}
                          >
                            <Icon.FilePlus boxSize="16px" />
                            <span>Créer une note</span>
                          </Button.Primary>
                        </BoxLoose>
                      </>
                    ) : (
                      <TextLoose>Ouvrir une note !</TextLoose>
                    )}
                  </VStackLoose>
                </>
              ) : (
                "Cette note n'existe plus."
              )}
            </div>
          )
        }
        close={props.close}
        options={options}
        onDidResize={() => {
          editorOnResizeRef.current?.();
        }}
        sideBarContent={
          showLibrary ? (
            <FlexLoose height="100%" flexDirection="column">
              <TokenInfoSideBar
                windowId={props.windowId}
                activeNoteId={props.noteId}
              />
            </FlexLoose>
          ) : null
        }
      />
      {permissionPopUpNode}
    </WindowContext.Provider>
  );
};

export const TokenInfoAside = () => {
  const noteWindowActions = useNoteWindowActions();
  const noteWindows = useNoteWindows();

  return (
    <>
      {noteWindows.windows.map((window) => (
        <WindowRenderer
          key={window.id}
          windowId={window.id}
          noteId={window.history[window.currentIndex]}
          navigateBack={
            window.currentIndex > 0
              ? () => noteWindowActions.navigateBack(window.id)
              : null
          }
          navigateNext={
            window.currentIndex < window.history.length - 1
              ? () => noteWindowActions.navigateNext(window.id)
              : null
          }
          replaceCurrent={(noteId: string | null) =>
            noteWindowActions.replaceCurrent(window.id, noteId)
          }
          close={() => noteWindowActions.destroyWindow(window.id)}
          focus={() => noteWindowActions.focusWindow(window.id)}
          initialShowLibrary={window.initialShowLibrary}
        />
      ))}
    </>
  );
};
