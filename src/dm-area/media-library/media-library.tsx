import * as React from "react";
import { Modal, ModalDialogSize } from "../../modal";
import * as Icon from "../../feather-icons";
import * as Button from "../../button";
import { ISendRequestTask, sendRequest } from "../../http-request";
import useAsyncEffect from "@n1ru4l/use-async-effect";
import { buildApiUrl } from "../../public-url";
import { useGetIsMounted } from "../../hooks/use-get-is-mounted";
import { useInvokeOnScrollEnd } from "../../hooks/use-invoke-on-scroll-end";
import styled from "@emotion/styled/macro";
import { ImageLightBoxModal } from "../../image-lightbox-modal";
import { useShareImageAction } from "../../hooks/use-share-image-action";
import { useSplashShareImageAction } from "../../hooks/use-splash-share-image-action";
import { InputGroup } from "../../input";
import { LoadingSpinner } from "../../loading-spinner";
import { useSelectFileDialog } from "../../hooks/use-select-file-dialog";
import { useAccessToken } from "../../hooks/use-access-token";
import { uploadFile } from "../../upload-file";
import { ProgressBar } from "../../progress-bar";
import * as HorizontalNavigation from "../../horizontal-navigation";
import { CharacterLibraryTab } from "../library/character-library-tab";

type MediaLibraryProps = {
  onClose: () => void;
  mapId: string | null;
};

type MediaLibraryItem = {
  id: string;
  path: string;
  title: string;
};

// Must match the LIMIT used by the backend list endpoint.
const PAGE_SIZE = 20;

const isVideoPath = (path: string) => /\.(mp4|webm|ogg|mov)$/i.test(path);

type MediaLibraryState =
  | {
      mode: "LOADING";
      items: null;
      hasMore: boolean;
    }
  | {
      mode: "LOADED";
      items: Array<MediaLibraryItem>;
      hasMore: boolean;
    }
  | {
      mode: "LOADING_MORE";
      items: Array<MediaLibraryItem>;
      hasMore: boolean;
    };

type MediaLibraryAction =
  | {
      type: "LOAD_INITIAL_RESULT";
      data: {
        items: Array<MediaLibraryItem>;
      };
    }
  | {
      type: "LOAD_MORE_START";
    }
  | {
      type: "LOAD_MORE_RESULT";
      data: {
        items: Array<MediaLibraryItem>;
      };
    }
  | {
      type: "DELETE_ITEM_DONE";
      data: {
        deletedItemId: string;
      };
    }
  | {
      type: "UPDATE_ITEM_DONE";
      data: {
        item: MediaLibraryItem;
      };
    }
  | {
      type: "CREATE_ITEM_DONE";
      data: {
        item: MediaLibraryItem;
      };
    };

const stateReducer: React.Reducer<MediaLibraryState, MediaLibraryAction> = (
  state,
  action
) => {
  switch (action.type) {
    case "LOAD_INITIAL_RESULT": {
      return {
        mode: "LOADED" as const,
        items: action.data.items,
        hasMore: action.data.items.length >= PAGE_SIZE,
      };
    }
    case "LOAD_MORE_START": {
      if (state.mode !== "LOADED") return state;
      return {
        ...state,
        mode: "LOADING_MORE" as const,
      };
    }
    case "LOAD_MORE_RESULT": {
      if (state.mode === "LOADING") return state;
      return {
        mode: "LOADED" as const,
        items: [...state.items, ...action.data.items],
        hasMore: action.data.items.length >= PAGE_SIZE,
      };
    }
    case "DELETE_ITEM_DONE": {
      if (state.mode === "LOADING") return state;
      return {
        ...state,
        items: state.items.filter(
          (item) => item.id !== action.data.deletedItemId
        ),
      };
    }
    case "UPDATE_ITEM_DONE": {
      if (state.mode === "LOADING") return state;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.data.item.id ? action.data.item : item
        ),
      };
    }
    case "CREATE_ITEM_DONE": {
      if (state.mode === "LOADING") return state;
      return {
        ...state,
        items: [action.data.item, ...state.items],
      };
    }
  }
};

const initialState: MediaLibraryState = {
  mode: "LOADING",
  items: null,
  hasMore: true,
};

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onClose,
  mapId,
}) => {
  const [activeTab, setActiveTab] = React.useState<"characters" | "images">(
    "characters"
  );
  const [state, dispatch] = React.useReducer(stateReducer, initialState);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(
    null
  );
  const isUploading = uploadProgress !== null;
  const getIsMounted = useGetIsMounted();
  const accessToken = useAccessToken();

  const authHeaders = React.useMemo(
    () => ({
      Authorization: accessToken ? `Bearer ${accessToken}` : null,
    }),
    [accessToken]
  );

  useAsyncEffect(
    function* (onCancel, cast) {
      const task = sendRequest({
        method: "GET",
        headers: authHeaders,
        url: buildApiUrl("/images"),
      });
      onCancel(task.abort);
      const result = yield* cast(task.done);
      if (result.type === "success") {
        const jsonResponse = JSON.parse(result.data);
        dispatch({
          type: "LOAD_INITIAL_RESULT",
          data: {
            items: jsonResponse.data.list,
          },
        });
      }
    },
    [authHeaders]
  );

  const fetchMoreTask = React.useRef<ISendRequestTask | null>(null);
  React.useEffect(
    () => () => {
      fetchMoreTask.current?.abort();
    },
    []
  );

  const fetchMore = React.useCallback(() => {
    if (state.mode !== "LOADED" || state.hasMore === false) return;
    fetchMoreTask.current?.abort();
    dispatch({ type: "LOAD_MORE_START" });

    const task = sendRequest({
      method: "GET",
      headers: authHeaders,
      url: buildApiUrl(`/images?offset=${state.items.length}`),
    });
    fetchMoreTask.current = task;

    task.done.then((result) => {
      if (getIsMounted() === false) return;
      if (result.type === "success") {
        const jsonResponse = JSON.parse(result.data);
        dispatch({
          type: "LOAD_MORE_RESULT",
          data: {
            items: jsonResponse.data.list,
          },
        });
      }
    });
  }, [state, authHeaders, getIsMounted]);

  const deleteImageAction = React.useCallback(
    (id: string) => {
      const task = sendRequest({
        method: "DELETE",
        headers: authHeaders,
        url: buildApiUrl(`/images/${id}`),
      });

      task.done.then((result) => {
        if (getIsMounted() === false) return;
        if (result.type === "success") {
          const jsonResponse = JSON.parse(result.data);
          dispatch({
            type: "DELETE_ITEM_DONE",
            data: {
              deletedItemId: jsonResponse.data.deletedImageId,
            },
          });
        }
      });
    },
    [authHeaders, getIsMounted]
  );

  const updateImageAction = React.useCallback(
    (id: string, { title }: { title: string }) => {
      const task = sendRequest({
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        url: buildApiUrl(`/images/${id}`),
        body: JSON.stringify({
          title,
        }),
      });

      task.done.then((result) => {
        if (getIsMounted() === false) return;
        if (result.type === "success") {
          const jsonResponse = JSON.parse(result.data);
          dispatch({
            type: "UPDATE_ITEM_DONE",
            data: {
              item: jsonResponse.data.image,
            },
          });
        }
      });
    },
    [authHeaders, getIsMounted]
  );

  const onScroll = useInvokeOnScrollEnd(
    React.useCallback(() => {
      if (state.mode === "LOADED") {
        fetchMore();
      }
    }, [state, fetchMore])
  );

  const [reactTreeNode, showSelectFileDialog] = useSelectFileDialog(
    React.useCallback(
      (file) => {
        setUploadError(null);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append("file", file);

        const task = uploadFile({
          url: buildApiUrl("/images"),
          method: "POST",
          body: formData,
          headers: authHeaders,
          onProgress: (progress) => {
            if (getIsMounted()) setUploadProgress(progress.fraction);
          },
        });

        task.done.then((response) => {
          if (getIsMounted() === false) return;
          setUploadProgress(null);
          if (response.type === "abort") return;
          if (response.type === "success") {
            let result: any = null;
            try {
              result = JSON.parse(response.responseText);
            } catch {
              result = null;
            }
            if (result?.data?.item) {
              dispatch({
                type: "CREATE_ITEM_DONE",
                data: {
                  item: result.data.item,
                },
              });
              return;
            }
          }
          let message = "L'import du fichier a échoué.";
          if (response.type === "error" && response.responseText) {
            try {
              const parsed = JSON.parse(response.responseText);
              if (typeof parsed?.error === "string") {
                message = parsed.error;
              }
            } catch {
              // keep the generic message
            }
          }
          setUploadError(message);
        });
      },
      [authHeaders, getIsMounted]
    )
  );

  return (
    <Modal onClickOutside={onClose} onPressEscape={onClose}>
      <Content
        onClick={(ev) => ev.stopPropagation()}
        tabIndex={1}
        style={{ maxWidth: 1600 }}
      >
        <Modal.Header>
          <Modal.Heading2>
            <Icon.BookOpen boxSize="28px" /> Bibliothèque
          </Modal.Heading2>
          <div style={{ marginLeft: 20 }}>
            <HorizontalNavigation.Group>
              <HorizontalNavigation.Button
                isActive={activeTab === "characters"}
                onClick={() => setActiveTab("characters")}
              >
                <Icon.Users boxSize="14px" />
                <span>Personnages</span>
              </HorizontalNavigation.Button>
              <HorizontalNavigation.Button
                isActive={activeTab === "images"}
                onClick={() => setActiveTab("images")}
              >
                <Icon.Image boxSize="14px" />
                <span>Médias</span>
              </HorizontalNavigation.Button>
            </HorizontalNavigation.Group>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <Button.Tertiary
              tabIndex={1}
              style={{ marginLeft: 8 }}
              onClick={onClose}
            >
              Fermer
            </Button.Tertiary>
          </div>
        </Modal.Header>
        {activeTab === "characters" ? (
          <Modal.Body style={{ flex: 1, overflowY: "hidden" }}>
            <CharacterLibraryTab mapId={mapId} />
          </Modal.Body>
        ) : (
          <>
            <Modal.Body
              style={{ flex: 1, overflowY: "scroll" }}
              onScroll={onScroll}
            >
              {uploadError ? (
                <ErrorBanner role="alert">
                  <span>{uploadError}</span>
                  <Button.Tertiary
                    small
                    iconOnly
                    title="Masquer"
                    onClick={() => setUploadError(null)}
                  >
                    <Icon.X boxSize="16px" />
                  </Button.Tertiary>
                </ErrorBanner>
              ) : null}
              {isUploading ? (
                <UploadProgressContainer>
                  <ProgressBar
                    value={uploadProgress}
                    label="Envoi du fichier…"
                  />
                </UploadProgressContainer>
              ) : null}
              {state.mode === "LOADING" ? (
                <CenteredState>
                  <LoadingSpinner state="inProgress" />
                </CenteredState>
              ) : state.items.length === 0 ? (
                <CenteredState>
                  <Icon.Image boxSize="48px" color="#3c4257" />
                  <EmptyStateTitle>
                    Aucun média dans la bibliothèque
                  </EmptyStateTitle>
                  <EmptyStateText>
                    Importez des images, GIF ou vidéos pour les partager avec
                    vos joueurs.
                  </EmptyStateText>
                  <div style={{ marginTop: 16 }}>
                    <Button.Primary
                      onClick={showSelectFileDialog}
                      disabled={isUploading}
                    >
                      <Icon.Plus boxSize="20px" />
                      <span>Importer un fichier</span>
                    </Button.Primary>
                  </div>
                </CenteredState>
              ) : (
                <>
                  <Grid>
                    {state.items.map((item) => (
                      <Item
                        item={item}
                        key={item.id}
                        deleteItem={() => deleteImageAction(item.id)}
                        updateItem={(opts) => updateImageAction(item.id, opts)}
                      />
                    ))}
                  </Grid>
                  {state.mode === "LOADING_MORE" ? (
                    <CenteredState style={{ minHeight: 80 }}>
                      <LoadingSpinner state="inProgress" />
                    </CenteredState>
                  ) : null}
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Modal.Actions>
                <Modal.ActionGroup>
                  <div>
                    <Button.Primary
                      onClick={showSelectFileDialog}
                      role="button"
                      disabled={isUploading}
                    >
                      <Icon.Plus boxSize="24px" />
                      <span>
                        {isUploading ? "Envoi en cours…" : "Importer un fichier"}
                      </span>
                    </Button.Primary>
                  </div>
                </Modal.ActionGroup>
              </Modal.Actions>
            </Modal.Footer>
          </>
        )}
        {reactTreeNode}
      </Content>
    </Modal>
  );
};

const Item: React.FC<{
  item: MediaLibraryItem;
  deleteItem: () => void;
  updateItem: (opts: { title: string }) => void;
}> = ({ item, deleteItem, updateItem }) => {
  const [showLightboxImage, setShowLightBoxImage] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const shareImage = useShareImageAction();
  const splashShareImage = useSplashShareImageAction();
  const isVideo = isVideoPath(item.path);
  const mediaUrl = buildApiUrl(`/images/${item.id}`);

  return (
    <ListItem>
      <ListItemImageContainer
        onClick={() => setShowLightBoxImage(true)}
        title="Agrandir"
      >
        {isVideo ? (
          <>
            <ListItemVideo src={mediaUrl} muted preload="metadata" />
            <VideoBadge>
              <Icon.Play boxSize="12px" /> Vidéo
            </VideoBadge>
          </>
        ) : (
          <ListItemImage src={mediaUrl} loading="lazy" />
        )}
      </ListItemImageContainer>
      <ListItemTitle title={item.title}>{item.title}</ListItemTitle>
      <Menu data-menu>
        <Button.Primary
          small
          title="Modifier"
          iconOnly
          onClick={() => setShowEditModal(true)}
        >
          <Icon.Edit boxSize="16px" />
        </Button.Primary>
        <Button.Primary
          small
          title="Afficher aux joueurs (plein écran)"
          iconOnly
          onClick={() => splashShareImage(item.id)}
        >
          <Icon.Share boxSize="16px" />
        </Button.Primary>
        <Button.Primary
          small
          title="Partager dans le chat"
          iconOnly
          onClick={() => shareImage(item.id)}
        >
          <Icon.MessageCircle boxSize="16px" />
        </Button.Primary>
        <Button.Primary
          small
          title="Agrandir"
          iconOnly
          onClick={() => setShowLightBoxImage(true)}
        >
          <Icon.Maximize boxSize="16px" />
        </Button.Primary>
      </Menu>
      {showLightboxImage ? (
        isVideo ? (
          <VideoLightBoxModal
            src={mediaUrl}
            close={() => setShowLightBoxImage(false)}
          />
        ) : (
          <ImageLightBoxModal
            src={mediaUrl}
            close={() => setShowLightBoxImage(false)}
          />
        )
      ) : null}
      {showEditModal ? (
        <EditImageModal
          title={item.title}
          onClose={() => setShowEditModal(false)}
          onDelete={() => {
            setShowEditModal(false);
            deleteItem();
          }}
          onConfirm={({ title }) => {
            updateItem({ title });
          }}
        />
      ) : null}
    </ListItem>
  );
};

const VideoLightBoxModal: React.FC<{
  src: string;
  close: () => void;
}> = ({ src, close }) => {
  return (
    <Modal onClickOutside={close} onPressEscape={close}>
      <LightBoxVideo
        src={src}
        controls
        autoPlay
        onClick={(ev) => ev.stopPropagation()}
      />
    </Modal>
  );
};

const EditImageModal: React.FC<{
  title: string;
  onClose: () => void;
  onDelete: () => void;
  onConfirm: (opts: { title: string }) => void;
}> = ({ title, onClose, onConfirm, onDelete }) => {
  const [inputValue, setInputValue] = React.useState(title);
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  const onChangeInputValue = React.useCallback(
    (ev) => {
      setInputValue(ev.target.value);
    },
    [setInputValue]
  );

  return (
    <Modal onClickOutside={onClose} onPressEscape={onClose}>
      <Modal.Dialog size={ModalDialogSize.SMALL}>
        <Modal.Header>
          <Modal.Heading3>Modifier le média</Modal.Heading3>
        </Modal.Header>
        <Modal.Body>
          <InputGroup
            autoFocus
            placeholder="Titre"
            value={inputValue}
            onChange={onChangeInputValue}
            error={null}
          />
          {isConfirmingDelete ? (
            <DeleteConfirmText>
              Supprimer définitivement ce média ? Cette action est
              irréversible.
            </DeleteConfirmText>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Modal.Actions>
            <Modal.ActionGroup left>
              {isConfirmingDelete ? (
                <>
                  <div>
                    <Button.Tertiary
                      onClick={() => setIsConfirmingDelete(false)}
                      type="button"
                    >
                      <span>Annuler</span>
                    </Button.Tertiary>
                  </div>
                  <div>
                    <Button.Tertiary onClick={onDelete} type="button" danger>
                      <Icon.Trash boxSize="18px" />
                      <span>Confirmer la suppression</span>
                    </Button.Tertiary>
                  </div>
                </>
              ) : (
                <div>
                  <Button.Tertiary
                    onClick={() => setIsConfirmingDelete(true)}
                    type="button"
                    danger
                  >
                    <Icon.Trash boxSize="18px" />
                    <span>Supprimer</span>
                  </Button.Tertiary>
                </div>
              )}
            </Modal.ActionGroup>
            <Modal.ActionGroup>
              <div>
                <Button.Tertiary onClick={onClose} type="button">
                  <span>Fermer</span>
                </Button.Tertiary>
              </div>
              <div>
                <Button.Primary
                  type="submit"
                  onClick={() => {
                    onClose();
                    onConfirm({ title: inputValue });
                  }}
                >
                  <span>Enregistrer</span>
                </Button.Primary>
              </div>
            </Modal.ActionGroup>
          </Modal.Actions>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
};

const Menu = styled.span`
  display: none;
  position: absolute;
  top: 0;
  right: 0;
  margin-top: 4px;
  margin-right: 4px;
  > * {
    margin-left: 8px;
  }
`;

const Content = styled.div`
  width: 90vw;
  height: 90vh;
  background-color: #0d0f14;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
`;

const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const ListItem = styled.div`
  position: relative;
  border: none;
  display: block;
  width: calc(100% / 4);
  padding: 16px;
  text-align: center;
  margin-bottom: 16px;

  background-color: transparent;

  &:hover [data-menu],
  &:focus-within [data-menu] {
    display: block;
  }
`;

const ListItemImageContainer = styled.button`
  display: block;
  position: relative;
  border: none;
  background-color: transparent;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
`;

const ListItemImage = styled.img`
  max-width: 100%;
  max-height: 150px;
`;

const ListItemVideo = styled.video`
  max-width: 100%;
  max-height: 150px;
`;

const VideoBadge = styled.span`
  position: absolute;
  bottom: 4px;
  left: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 11px;
  pointer-events: none;
`;

const LightBoxVideo = styled.video`
  max-width: 90vw;
  max-height: 90vh;
`;

const ListItemTitle = styled.div`
  padding-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CenteredState = styled.div`
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 24px;
`;

const EmptyStateTitle = styled.div`
  margin-top: 16px;
  font-size: 18px;
  font-weight: bold;
`;

const EmptyStateText = styled.div`
  margin-top: 8px;
  color: #a0a6b8;
`;

const UploadProgressContainer = styled.div`
  margin: 8px 16px;
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 8px 16px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: rgba(220, 38, 38, 0.15);
  border: 1px solid rgba(220, 38, 38, 0.4);
  color: #fca5a5;
`;

const DeleteConfirmText = styled.p`
  margin-top: 12px;
  color: #fca5a5;
`;
