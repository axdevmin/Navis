import "./offscreen-canvas-polyfill";
import * as React from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";
import styled from "@emotion/styled/macro";
import { Box, Center, Heading, Text } from "@chakra-ui/react";
import { loose } from "../chakra-loose";

const BoxLoose = loose(Box);
const CenterLoose = loose(Center);
const HeadingLoose = loose(Heading);
const TextLoose = loose(Text);
import { commitMutation } from "relay-runtime";
import { useQuery, useRelayEnvironment } from "relay-hooks";
import graphql from "babel-plugin-relay/macro";
import { SelectMapModal } from "./select-map-modal";
import { ImportFileModal } from "./import-file-modal";
import { MediaLibrary } from "./media-library";
import { useSocket } from "../socket";
import { buildApiUrl } from "../public-url";
import { AuthenticationScreen } from "../authentication-screen";
import { SplashScreen } from "../splash-screen";
import { FetchContext } from "./fetch-context";
import { ISendRequestTask, sendRequest } from "../http-request";
import { AuthenticatedAppShell } from "../authenticated-app-shell";
import { AccessTokenProvider } from "../hooks/use-access-token";
import { usePersistedState } from "../hooks/use-persisted-state";
import { DmMap } from "./dm-map";
import { Socket } from "socket.io-client";
import { MapTokenEntity } from "../map-typings";
import { isFileDrag } from "../hooks/use-drop-zone";
import { LIBRARY_DRAG_TYPE, TokenPreset } from "./token-library";
import {
  LIBRARY_CHARACTER_DRAG_TYPE,
  LibraryCharacterDragPayload,
} from "./library/library-character-drag-type";
import { useRandomBackground } from "../hooks/use-random-background";
import { useNoteWindowActions } from "./token-info-aside";
import { MapControlInterface } from "../map-view";
import { useTokenImageUpload } from "./token-image-upload";
import { dmAreaTokenAddManyMutation } from "./__generated__/dmAreaTokenAddManyMutation.graphql";
import { dmArea_MapQuery } from "./__generated__/dmArea_MapQuery.graphql";
import { ErrorBoundary } from "../error-boundary";

const useLoadedMapId = () =>
  usePersistedState<string | null>("loadedMapId", {
    encode: (value) => JSON.stringify(value),
    decode: (rawValue) => {
      if (typeof rawValue === "string") {
        try {
          const parsedValue = JSON.parse(rawValue);
          if (typeof parsedValue === "string") {
            return parsedValue;
          }
          // eslint-disable-next-line no-empty
        } catch (e) {}
      }

      return null;
    },
  });

const useDmPassword = () =>
  usePersistedState<string>("dmPassword", {
    encode: (value) => JSON.stringify(value),
    decode: (value) => {
      try {
        if (typeof value === "string") {
          const parsedValue = JSON.parse(value);
          if (typeof parsedValue === "string") {
            return parsedValue;
          }
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
      return "";
    },
  });

type Mode =
  | {
      title: "LOADING";
      data: null;
    }
  | {
      title: "SHOW_MAP_LIBRARY";
    }
  | {
      title: "EDIT_MAP";
    }
  | {
      title: "MEDIA_LIBRARY";
    };

const createInitialMode = (): Mode => ({
  title: "LOADING",
  data: null,
});

type TokenPartial = Omit<Partial<MapTokenEntity>, "id">;

const LoadedMapDiv = styled.div`
  display: flex;
  height: 100vh;
  background-color: black;
  /* Mobile Chrome 100vh issue with address bar */
  @media screen and (max-width: 580px) and (-webkit-min-device-pixel-ratio: 0) {
    height: calc(100vh - 56px);
  }
`;

const DmAreaTokenAddManyMutation = graphql`
  mutation dmAreaTokenAddManyMutation($input: MapTokenAddManyInput!) {
    mapTokenAddMany(input: $input)
  }
`;

const DmArea_MapQuery = graphql`
  query dmArea_MapQuery($loadedMapId: ID!, $noMap: Boolean!) @live {
    map(id: $loadedMapId) @skip(if: $noMap) {
      id
      ...dmMap_DMMapFragment
    }
    activeMap {
      id
    }
  }
`;

const Content = ({
  socket,
  password: dmPassword,
  onLogout,
}: {
  socket: Socket;
  password: string;
  onLogout: () => void;
}): React.ReactElement => {
  const [loadedMapId, setLoadedMapId] = useLoadedMapId();
  const randomBackground = useRandomBackground();

  const dmAreaResponse = useQuery<dmArea_MapQuery>(
    DmArea_MapQuery,
    {
      loadedMapId: loadedMapId ?? "",
      noMap: loadedMapId === null,
    },
    {}
  );

  React.useEffect(() => {
    if (loadedMapId === null && dmAreaResponse.data?.activeMap) {
      setLoadedMapId(dmAreaResponse.data.activeMap.id);
    }
  }, [dmAreaResponse.data?.activeMap?.id, loadedMapId]);

  // EDIT_MAP, SHOW_MAP_LIBRARY
  const [mode, setMode] = React.useState<Mode>(createInitialMode);

  const localFetch = React.useCallback(
    (input, init = {}) => {
      return fetch(buildApiUrl(input), {
        ...init,
        headers: {
          Authorization: dmPassword ? `Bearer ${dmPassword}` : undefined,
          ...init.headers,
        },
      }).then((res) => {
        if (res.status === 401) {
          console.error("Unauthenticated access.");
          throw new Error("Unauthenticated access.");
        }
        return res;
      });
    },
    [dmPassword]
  );

  const updateToken = React.useCallback(
    (id: string, updates: TokenPartial) => {
      localFetch(`/map/${loadedMapId}/token/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...updates, socketId: socket.id }),
      });
    },
    [loadedMapId, localFetch, socket.id]
  );

  const dmPasswordRef = React.useRef(dmPassword);

  React.useEffect(() => {
    dmPasswordRef.current = dmPassword;
  });

  const sendLiveMapTaskRef = React.useRef<null | ISendRequestTask>(null);
  const sendLiveMap = React.useCallback(
    async (canvas: HTMLCanvasElement) => {
      const loadedMapId = dmAreaResponse.data?.map?.id;

      if (!loadedMapId) {
        return;
      }

      if (sendLiveMapTaskRef.current) {
        sendLiveMapTaskRef.current.abort();
      }
      const blob = await new Promise<Blob>((res) => {
        canvas.toBlob((blob) => {
          res(blob!);
        });
      });

      const image = new File([blob], "fog.live.png", {
        type: "image/png",
      });

      const formData = new FormData();
      formData.append("image", image);

      const task = sendRequest({
        url: buildApiUrl(`/map/${loadedMapId}/send`),
        method: "POST",
        body: formData,
        headers: {
          Authorization: dmPassword ? `Bearer ${dmPassword}` : null,
        },
      });
      sendLiveMapTaskRef.current = task;
      const result = await task.done;
      if (result.type !== "success") {
        return;
      }
    },
    [dmAreaResponse.data?.map?.id, dmPassword]
  );

  const sendProgressFogTaskRef = React.useRef<null | ISendRequestTask>(null);
  const saveFogProgress = React.useCallback(
    async (canvas: HTMLCanvasElement) => {
      const loadedMapId = dmAreaResponse.data?.map?.id;

      if (!loadedMapId) {
        return;
      }

      if (sendLiveMapTaskRef.current) {
        sendLiveMapTaskRef.current.abort();
      }
      const blob = await new Promise<Blob>((res) => {
        canvas.toBlob((blob) => {
          res(blob!);
        });
      });

      const formData = new FormData();

      formData.append(
        "image",
        new File([blob], "fog.png", {
          type: "image/png",
        })
      );

      const task = sendRequest({
        url: buildApiUrl(`/map/${loadedMapId}/fog`),
        method: "POST",
        body: formData,
        headers: {
          Authorization: dmPassword ? `Bearer ${dmPassword}` : null,
        },
      });
      sendProgressFogTaskRef.current = task;
      const result = await task.done;
      if (result.type !== "success") {
        return;
      }
    },
    [dmAreaResponse.data?.map?.id, dmPassword]
  );

  const hideMap = React.useCallback(async () => {
    await localFetch("/active-map", {
      method: "POST",
      body: JSON.stringify({
        mapId: null,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }, [localFetch]);

  const showMapModal = React.useCallback(() => {
    setMode({ title: "SHOW_MAP_LIBRARY" });
  }, []);

  const [importModalFile, setImportModalFile] = React.useState<null | File>(
    null
  );

  const actions = useNoteWindowActions();
  const controlRef = React.useRef<MapControlInterface | null>(null);

  const dragRef = React.useRef(0);
  const [isDraggingFile, setIsDraggingFile] = React.useState(false);

  const objectUrlCleanupRef = React.useRef<null | (() => void)>(null);
  React.useEffect(
    () => () => {
      objectUrlCleanupRef.current?.();
    },
    []
  );
  const [cropperNode, selectFile] = useTokenImageUpload();
  const relayEnvironment = useRelayEnvironment();

  return (
    <ErrorBoundary>
      <FetchContext.Provider value={localFetch}>
        {!dmAreaResponse.data?.map && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundImage: `url("${randomBackground}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              zIndex: 0,
            }}
          />
        )}
        {(dmAreaResponse.error === null &&
          // because it is a live query isLoading is always true
          // thanks relay :D
          // so we wanna show the map library if the data is loaded aka data is not undefined but data.map is undefined :D
          dmAreaResponse.data &&
          !dmAreaResponse.data.map) ||
        mode.title === "SHOW_MAP_LIBRARY" ? (
          <SelectMapModal
            canClose={dmAreaResponse.data?.map !== null}
            loadedMapId={loadedMapId}
            liveMapId={dmAreaResponse.data?.map?.id ?? null}
            closeModal={() => {
              setMode({ title: "EDIT_MAP" });
            }}
            setLoadedMapId={(loadedMapId) => {
              setMode({ title: "EDIT_MAP" });
              setLoadedMapId(loadedMapId);
            }}
          />
        ) : null}
        {dmAreaResponse.error ? (
          <CenterLoose height="100vh" flexDirection="column" color="white">
            <HeadingLoose size="lg" mb={4}>
              Erreur de chargement
            </HeadingLoose>
            <TextLoose>{dmAreaResponse.error.message}</TextLoose>
          </CenterLoose>
        ) : null}
        {mode.title === "MEDIA_LIBRARY" ? (
          <MediaLibrary
            mapId={dmAreaResponse.data?.map?.id ?? null}
            onClose={() => {
              setMode({ title: "EDIT_MAP" });
            }}
          />
        ) : null}
        {dmAreaResponse.data?.map != null ? (
          <LoadedMapDiv
            onDragEnter={(ev) => {
              if (isFileDrag(ev) === false) {
                return;
              }
              ev.dataTransfer.dropEffect = "copy";
              dragRef.current++;
              setIsDraggingFile(dragRef.current !== 0);
              ev.preventDefault();
            }}
            onDragLeave={(ev) => {
              if (isFileDrag(ev) === false) {
                return;
              }
              dragRef.current--;
              setIsDraggingFile(dragRef.current !== 0);
              ev.preventDefault();
            }}
            onDragOver={(ev) => {
              const isLibraryDrag = ev.dataTransfer.types.includes(
                LIBRARY_DRAG_TYPE
              );
              const isLibraryCharacterDrag = ev.dataTransfer.types.includes(
                LIBRARY_CHARACTER_DRAG_TYPE
              );
              if (!isFileDrag(ev) && !isLibraryDrag && !isLibraryCharacterDrag) {
                return;
              }
              ev.preventDefault();
            }}
            onDrop={(ev) => {
              ev.preventDefault();

              const context = controlRef.current?.getContext();
              if (!context) return;

              const characterJson = ev.dataTransfer.getData(
                LIBRARY_CHARACTER_DRAG_TYPE
              );
              if (characterJson) {
                const character = JSON.parse(
                  characterJson
                ) as LibraryCharacterDragPayload;
                const coords = context.helper.coordinates.screenToImage([
                  ev.clientX,
                  ev.clientY,
                ]);
                commitMutation<dmAreaTokenAddManyMutation>(relayEnvironment, {
                  mutation: DmAreaTokenAddManyMutation,
                  variables: {
                    input: {
                      mapId: dmAreaResponse.data!.map!.id,
                      tokens: [
                        {
                          color: character.color,
                          x: coords[0],
                          y: coords[1],
                          rotation: 0,
                          label: character.label,
                          isVisibleForPlayers: false,
                          isMovableByPlayers: false,
                          isLocked: false,
                          tokenType: "character",
                          isAlive: true,
                          imageUrl: character.imageUrl,
                        },
                      ],
                    },
                  },
                });
                return;
              }

              const presetJson = ev.dataTransfer.getData(LIBRARY_DRAG_TYPE);
              if (presetJson) {
                const preset = JSON.parse(presetJson) as TokenPreset;
                const coords = context.helper.coordinates.screenToImage([
                  ev.clientX,
                  ev.clientY,
                ]);
                commitMutation<dmAreaTokenAddManyMutation>(relayEnvironment, {
                  mutation: DmAreaTokenAddManyMutation,
                  variables: {
                    input: {
                      mapId: dmAreaResponse.data!.map!.id,
                      tokens: [
                        {
                          color: preset.color,
                          x: coords[0],
                          y: coords[1],
                          rotation: 0,
                          label: preset.label,
                          isVisibleForPlayers: false,
                          isMovableByPlayers: false,
                          isLocked: false,
                          tokenType: preset.tokenType,
                          isAlive: true,
                          imageUrl: preset.imageUrl,
                        },
                      ],
                    },
                  },
                });
                return;
              }

              if (!isFileDrag(ev)) return;

              dragRef.current = 0;
              setIsDraggingFile(dragRef.current !== 0);

              const [file] = Array.from(ev.dataTransfer.files);

              if (!file?.type.match(/image/)) {
                return;
              }
              const coords = context.helper.coordinates.screenToImage([
                ev.clientX,
                ev.clientY,
              ]);

              const addTokenWithImageId = (tokenImageId: string) => {
                commitMutation<dmAreaTokenAddManyMutation>(relayEnvironment, {
                  mutation: DmAreaTokenAddManyMutation,
                  variables: {
                    input: {
                      mapId: dmAreaResponse.data!.map!.id,
                      tokens: [
                        {
                          color: "#3355cc",
                          x: coords[0],
                          y: coords[1],
                          rotation: 0,
                          isVisibleForPlayers: false,
                          isMovableByPlayers: false,
                          isLocked: false,
                          tokenImageId,
                          tokenType: "character",
                          label: "",
                        },
                      ],
                    },
                  },
                });
              };

              selectFile(file, [], ({ tokenImageId }) => {
                addTokenWithImageId(tokenImageId);
              });
            }}
          >
            {cropperNode}
            {isDraggingFile ? (
              <CenterLoose
                position="absolute"
                top="0"
                width="100%"
                zIndex={99999999}
                justifyContent="center"
              >
                <DropZone
                  onDragEnter={(ev) => {
                    if (isFileDrag(ev) === false) {
                      return;
                    }
                    ev.dataTransfer.dropEffect = "copy";
                    dragRef.current++;
                    setIsDraggingFile(dragRef.current !== 0);
                    ev.preventDefault();
                  }}
                  onDragLeave={(ev) => {
                    if (isFileDrag(ev) === false) {
                      return;
                    }
                    dragRef.current--;
                    setIsDraggingFile(dragRef.current !== 0);
                    ev.preventDefault();
                  }}
                  onDragOver={(ev) => {
                    if (isFileDrag(ev) === false) {
                      return;
                    }
                    ev.preventDefault();
                  }}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    if (isFileDrag(ev) === false) {
                      return;
                    }

                    dragRef.current = 0;
                    setIsDraggingFile(dragRef.current !== 0);

                    ev.stopPropagation();
                    const [file] = Array.from(ev.dataTransfer.files);
                    if (file) {
                      setImportModalFile(file);
                    }
                  }}
                >
                  Import Map or Media Library Item
                </DropZone>
              </CenterLoose>
            ) : null}
            <div
              style={{
                flex: 1,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <DmMap
                controlRef={controlRef}
                password={dmPassword}
                map={dmAreaResponse.data.map}
                liveMapId={dmAreaResponse.data?.activeMap?.id ?? null}
                sendLiveMap={sendLiveMap}
                saveFogProgress={saveFogProgress}
                hideMap={hideMap}
                showMapModal={showMapModal}
                openNotes={() => {
                  actions.showNoteInWindow(null, "note-editor", true);
                }}
                openMediaLibrary={() => {
                  setMode({ title: "MEDIA_LIBRARY" });
                }}
                updateToken={updateToken}
                onLogout={onLogout}
              />
            </div>
          </LoadedMapDiv>
        ) : null}
        {importModalFile ? (
          <ImportFileModal
            file={importModalFile}
            close={() => setImportModalFile(null)}
          />
        ) : null}
      </FetchContext.Provider>
    </ErrorBoundary>
  );
};

const DmAreaRenderer = ({
  password,
  onLogout,
}: {
  password: string;
  onLogout: () => void;
}): React.ReactElement => {
  const socket = useSocket();

  return (
    <AccessTokenProvider value={password}>
      <AuthenticatedAppShell
        socket={socket}
        password={password}
        isMapOnly={false}
        role="DM"
      >
        <Content socket={socket} password={password} onLogout={onLogout} />
      </AuthenticatedAppShell>
    </AccessTokenProvider>
  );
};

export const DmArea = () => {
  const [dmPassword, setDmPassword] = useDmPassword();
  // "authenticate" | "authenticated"
  const [mode, setMode] = React.useState("loading");

  const localFetch = React.useCallback(
    (input, init = {}) => {
      return fetch(buildApiUrl(input), {
        ...init,
        headers: {
          Authorization: dmPassword ? `Bearer ${dmPassword}` : undefined,
          ...init.headers,
        },
      }).then((res) => {
        if (res.status === 401) {
          console.error("Unauthenticated access.");
          throw new Error("Unauthenticated access.");
        }
        return res;
      });
    },
    [dmPassword]
  );

  useAsyncEffect(
    function* (_, c) {
      const result: { data: { role: string } } = yield* c(
        localFetch("/auth").then((res) => res.json())
      );
      if (!result.data.role || result.data.role !== "DM") {
        setMode("authenticate");
        return;
      }
      setMode("authenticated");
    },
    [localFetch]
  );

  if (mode === "loading") {
    return <SplashScreen text="Chargement..." />;
  } else if (mode === "authenticate") {
    return (
      <AuthenticationScreen
        onAuthenticate={(password) => {
          setDmPassword(password);
          setMode("authenticated");
        }}
        fetch={localFetch}
        requiredRole="DM"
      />
    );
  } else if (mode === "authenticated") {
    return (
      <DmAreaRenderer
        password={dmPassword}
        onLogout={() => {
          setDmPassword("");
          setMode("authenticate");
        }}
      />
    );
  }
  return null;
};

type DropZoneProps = {
  children: React.ReactNode;
} & Pick<
  React.ComponentProps<typeof Box>,
  "onDragEnter" | "onDragOver" | "onDragLeave" | "onDrop"
>;

const DropZone = (props: DropZoneProps): React.ReactElement => {
  return (
    <BoxLoose
      padding="2"
      background="rgba(13,15,20,0.85)"
      borderRadius="10px"
      outline="2px dashed rgba(96,165,250,0.5)"
      outlineOffset="-10px"
      onDragEnter={props.onDragEnter}
      onDragOver={props.onDragOver}
      onDragLeave={props.onDragLeave}
      onDrop={props.onDrop}
    >
      <BoxLoose padding="2">{props.children}</BoxLoose>
    </BoxLoose>
  );
};
