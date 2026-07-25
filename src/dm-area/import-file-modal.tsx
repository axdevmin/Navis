import * as React from "react";
import styled from "@emotion/styled/macro";
import graphql from "babel-plugin-relay/macro";
import { useMutation } from "relay-hooks";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import * as Button from "../button";
import { Modal } from "../modal";
import { useAsyncTask } from "../hooks/use-async-task";
import { sendRequest, ISendRequestTask } from "../http-request";
import { buildApiUrl } from "../public-url";
import { useAccessToken } from "../hooks/use-access-token";
import { LoadingSpinner } from "../loading-spinner";
import { AnimatedDotDotDot } from "../animated-dot-dot-dot";
import { generateSHA256FileHash } from "../crypto";
import { importFileModal_MapImageRequestUploadMutation } from "./__generated__/importFileModal_MapImageRequestUploadMutation.graphql";
import { importFileModal_MapCreateMutation } from "./__generated__/importFileModal_MapCreateMutation.graphql";
import type { MediaType } from "../../server/media-types";
import { getMediaTypeFromExtension } from "../../server/media-types";
import { uploadFile } from "../upload-file";
import { ProgressBar } from "../progress-bar";

const OrSeperator = styled.span`
  padding-left: 18px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
`;

const PreviewImage = styled.img`
  margin-left: auto;
  margin-right: auto;
  display: block;
  height: 50vh;
  width: auto;
`;

const PreviewVideo = styled.video`
  margin-left: auto;
  margin-right: auto;
  display: block;
  height: 50vh;
  width: auto;
`;

const ErrorMessage = styled.div`
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: rgba(220, 38, 38, 0.15);
  border: 1px solid rgba(220, 38, 38, 0.4);
  color: #b91c1c;
  white-space: pre-wrap;
`;

const FileTitle = styled.div`
  text-align: center;
  font-weight: bold;
  margin-top: 8px;
`;

const MediaTypeSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
`;

const extractDefaultTitleFromFileName = (fileName: string) => {
  const parts = fileName.split(".");
  if (parts.length < 2) return fileName;
  parts.pop();
  return parts.join(".");
};

// Valid file types for map media (images, GIFs, and videos)
const validMapMediaFileTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/bmp",
  "image/gif", // GIF animations
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // MOV files
];
const validNoteImportFileTypes = ["application/zip", "text/markdown"];

const ImportFileModal_MapImageRequestUploadMutation = graphql`
  mutation importFileModal_MapImageRequestUploadMutation(
    $input: MapImageRequestUploadInput!
  ) {
    mapImageRequestUpload(input: $input) {
      id
      uploadUrl
    }
  }
`;

const ImportFileModal_MapCreateMutation = graphql`
  mutation importFileModal_MapCreateMutation($input: MapCreateInput!) {
    mapCreate(input: $input) {
      ... on MapCreateSuccess {
        __typename
        createdMap {
          id
          title
          mapImageUrl
        }
      }
      ... on MapCreateError {
        __typename
        reason
      }
    }
  }
`;

const ImageImportModal: React.FC<{
  file: File;
  close: () => void;
}> = ({ file, close }) => {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [uploadState, setUploadState] = React.useState<{
    label: string;
    fraction: number | null;
  } | null>(null);
  const accessToken = useAccessToken();
  const isVideoFile = file.type.startsWith("video/");

  // Auto-detect media type from extension
  const detectedMediaType = React.useMemo(() => {
    const ext = file.name.split(".").pop() ?? "";
    return getMediaTypeFromExtension(ext) || ("image" as MediaType);
  }, [file.name]);

  const [mediaType, setMediaType] =
    React.useState<MediaType>(detectedMediaType);

  const [mapImageRequestUpload] =
    useMutation<importFileModal_MapImageRequestUploadMutation>(
      ImportFileModal_MapImageRequestUploadMutation
    );
  const [mapCreate] = useMutation<importFileModal_MapCreateMutation>(
    ImportFileModal_MapCreateMutation
  );

  React.useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setObjectUrl(objectUrl);

    return () => {
      setObjectUrl(null);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const fileTitleWithoutExtension = React.useMemo(
    () => extractDefaultTitleFromFileName(file.name),
    [file]
  );

  // Max file sizes: 50MB for videos, 10MB for GIFs, 5MB for images
  const maxFileSize = React.useMemo(() => {
    if (mediaType === "video") return 50 * 1024 * 1024; // 50MB
    if (mediaType === "gif") return 10 * 1024 * 1024; // 10MB
    return 5 * 1024 * 1024; // 5MB for images
  }, [mediaType]);

  const [isCreatingMap, onClickCreateMap] = useAsyncTask(
    React.useCallback(async () => {
      setErrorMessage(null);
      try {
        // Validate file size
        if (file.size > maxFileSize) {
          const sizeInMB = (maxFileSize / (1024 * 1024)).toFixed(0);
          throw new Error(
            `Le fichier (${(file.size / (1024 * 1024)).toFixed(
              1
            )} Mo) dépasse la taille maximale de ${sizeInMB} Mo pour le format « ${mediaType} ».`
          );
        }

        setUploadState({ label: "Préparation du fichier…", fraction: null });
        const hash = await generateSHA256FileHash(file);
        // 1. request file upload
        const result = await mapImageRequestUpload({
          variables: {
            input: {
              sha256: hash,
              extension: file.name.split(".").pop() ?? "",
              mediaType: mediaType as "image" | "gif" | "video",
            },
          },
        });

        // 2. upload file
        setUploadState({ label: "Envoi du fichier…", fraction: 0 });
        const uploadTask = uploadFile({
          url: result.mapImageRequestUpload.uploadUrl,
          body: file,
          headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : null,
          },
          onProgress: (progress) =>
            setUploadState({
              label: "Envoi du fichier…",
              fraction: progress.fraction,
            }),
        });
        const uploadResult = await uploadTask.done;

        if (uploadResult.type === "abort") {
          return;
        }
        if (uploadResult.type === "error") {
          throw new Error(
            `L'envoi du fichier a échoué (code ${uploadResult.status}).` +
              (uploadResult.responseText
                ? `\n\n${uploadResult.responseText}`
                : "")
          );
        }

        // 3. create map
        setUploadState({ label: "Création de la carte…", fraction: null });
        const createResult = await mapCreate({
          variables: {
            input: {
              title: file.name,
              mapImageUploadId: result.mapImageRequestUpload.id,
            },
          },
        });
        if (createResult.mapCreate.__typename === "MapCreateError") {
          throw new Error(
            `La création de la carte a échoué : ${createResult.mapCreate.reason}`
          );
        }
        close();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Une erreur est survenue."
        );
      } finally {
        setUploadState(null);
      }
    }, [file, mediaType, maxFileSize, accessToken, close])
  );

  const [isImportingMediaLibraryItem, onClickImportMediaLibraryItem] =
    useAsyncTask(
      React.useCallback(async () => {
        setErrorMessage(null);
        setUploadState({ label: "Envoi du fichier…", fraction: 0 });
        const formData = new FormData();
        formData.append("file", file);

        const task = uploadFile({
          url: buildApiUrl("/images"),
          method: "POST",
          body: formData,
          headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : null,
          },
          onProgress: (progress) =>
            setUploadState({
              label: "Envoi du fichier…",
              fraction: progress.fraction,
            }),
        });

        const result = await task.done;
        setUploadState(null);
        if (result.type === "abort") return;
        if (result.type !== "success") {
          setErrorMessage("L'import dans la médiathèque a échoué.");
          return;
        }
        close();
      }, [file, close, accessToken])
    );

  const areButtonsDisabled = isImportingMediaLibraryItem || isCreatingMap;

  return (
    <Modal
      onPressEscape={areButtonsDisabled ? () => undefined : close}
      onClickOutside={areButtonsDisabled ? () => undefined : close}
    >
      <Modal.Dialog>
        <Modal.Header>
          <h3>Importer une image ou vidéo</h3>
        </Modal.Header>
        <Modal.Body>
          {areButtonsDisabled ? (
            <div style={{ padding: "8px 0" }}>
              <div style={{ textAlign: "center" }}>
                <LoadingSpinner state="inProgress" />
              </div>
              <div style={{ marginTop: 16 }}>
                <ProgressBar
                  value={uploadState?.fraction ?? null}
                  label={uploadState?.label ?? "Importation en cours…"}
                />
              </div>
            </div>
          ) : (
            <>
              {objectUrl ? (
                isVideoFile ? (
                  <PreviewVideo src={objectUrl} controls muted loop autoPlay />
                ) : (
                  <PreviewImage src={objectUrl} />
                )
              ) : null}
              <FileTitle>{fileTitleWithoutExtension}</FileTitle>
              {errorMessage ? (
                <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
              ) : null}
              <MediaTypeSelector>
                <label>
                  <strong>Type de média :</strong>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as MediaType)}
                  >
                    <option value="image">Image (PNG, JPG, WebP)</option>
                    <option value="gif">GIF animé</option>
                    <option value="video">Vidéo (MP4, WebM, OGG)</option>
                  </select>
                </label>
              </MediaTypeSelector>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Modal.Actions>
            <Modal.ActionGroup>
              <Button.Tertiary
                tabIndex={1}
                onClick={close}
                disabled={areButtonsDisabled}
              >
                Fermer
              </Button.Tertiary>
            </Modal.ActionGroup>
            {!areButtonsDisabled && (
              <Modal.ActionGroup>
                <div>
                  <Button.Primary onClick={onClickImportMediaLibraryItem}>
                    Importer dans la médiathèque
                  </Button.Primary>
                </div>
                <OrSeperator>ou</OrSeperator>
                <div>
                  <Button.Primary onClick={onClickCreateMap}>
                    Nouvelle carte
                  </Button.Primary>
                </div>
              </Modal.ActionGroup>
            )}
          </Modal.Actions>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
};

type ImportFileLogRecord = { type: "error" | "success"; message: string };

const NoteImportLogRow = styled.div`
  text-align: left;
  padding: 4px;
  background-color: black;
  color: white;
`;

const NoteImportLogFilter = styled.div`
  text-align: right;
  padding-top: 8px;
`;

const NoteImportLogRenderer = (props: {
  logs: ImportFileLogRecord[];
}): React.ReactElement => {
  const virtuosoRef = React.useRef<VirtuosoHandle | null>(null);

  const [filter, setFilter] = React.useState(
    "failure" as "none" | "success" | "failure"
  );

  const logs = React.useMemo(() => {
    switch (filter) {
      case "none":
        return props.logs;
      case "success":
        return props.logs.filter((log) => log.type === "success");
      case "failure":
        return props.logs.filter((log) => log.type === "error");
    }
  }, [props.logs, filter]);

  // TODO: Is there a better way to start the list at the end?
  React.useEffect(() => {
    setTimeout(() => virtuosoRef.current?.scrollToIndex(logs.length - 1));
  }, [logs]);

  return (
    <React.Fragment>
      <Virtuoso
        ref={virtuosoRef}
        initialTopMostItemIndex={props.logs.length - 1}
        followOutput={true}
        data={props.logs}
        itemContent={(_, logRow) => {
          return <NoteImportLogRow>{logRow.message}</NoteImportLogRow>;
        }}
      />
      <NoteImportLogFilter>
        <label>
          <strong>Filter </strong>
          <select
            value={filter}
            onChange={(ev) => {
              setFilter(ev.target.value as any);
            }}
          >
            <option value="none">All</option>
            <option value="success">Successful</option>
            <option value="failure">Failed</option>
          </select>
        </label>
      </NoteImportLogFilter>
    </React.Fragment>
  );
};

const NoteImportModal: React.FC<{ file: File; close: () => void }> = (
  props
) => {
  const [state, setState] = React.useState<
    "notStarted" | "inProgress" | "finished"
  >("notStarted");
  const [logs, setLogs] = React.useState([] as ImportFileLogRecord[]);
  const [importedFilesCount, setImportedFilesCount] = React.useState(0);
  const [failedFilesCount, setFailedFilesCount] = React.useState(0);
  const [showLogs, setShowLogs] = React.useState(false);

  const accessToken = useAccessToken();
  const onClose = () => {
    if (state === "inProgress") {
      return;
    }
    props.close();
  };

  const request = React.useRef<ISendRequestTask | null>(null);

  React.useEffect(
    () => () => {
      request.current?.abort();
    },
    []
  );

  const onClickImport = () => {
    if (state === "inProgress") {
      return;
    }
    setState("inProgress");
    const data = new FormData();
    data.append("file", props.file);
    request.current = sendRequest({
      method: "POST",
      url: buildApiUrl("/notes/import"),
      body: data,
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : null,
      },
      onProgress: (data: string) => {
        const lines = data.split("\n").filter(Boolean);
        lines.forEach((line) => {
          const data = JSON.parse(line);
          if (data.latest.error) {
            setLogs((logs) => [
              ...logs,
              {
                type: "error",
                message: data.latest.error.message,
              },
            ]);
          } else {
            setLogs((logs) => [
              ...logs,
              {
                type: "success",
                message: data.latest.data.message,
              },
            ]);
          }
        });
        const lastLine = lines.pop();
        if (lastLine?.trim()) {
          const data = JSON.parse(lastLine.trim());
          if (data.amountOfImportedRecords) {
            setImportedFilesCount(data.amountOfImportedRecords);
          }
          if (data.amountOfFailedRecords) {
            setFailedFilesCount(data.amountOfFailedRecords);
          }
        }
      },
    });
    request.current.done.then(() => {
      setState("finished");
    });
  };

  return (
    <Modal onPressEscape={onClose} onClickOutside={onClose}>
      <Modal.Dialog>
        <Modal.Header>
          <h3>Import Notes</h3>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: "center" }}>
            {state === "notStarted" ? (
              <h2>Preparing import</h2>
            ) : (
              <h2>
                Successfully imported {importedFilesCount} note
                {importedFilesCount === 1 ? "" : "s"}{" "}
                {failedFilesCount > 0 ? ` (${failedFilesCount} failed)` : null}
              </h2>
            )}
            {showLogs ? (
              <React.Fragment>
                <NoteImportLogRenderer logs={logs} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <FileTitle>File: {props.file.name}</FileTitle>
                <div
                  style={{
                    height: 200,
                    position: "relative",
                    marginTop: 12,
                  }}
                >
                  <LoadingSpinner state={state} />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {state === "notStarted" ? null : importedFilesCount === 0 &&
                      state === "inProgress" ? (
                      <strong>
                        Uploading
                        <AnimatedDotDotDot />
                      </strong>
                    ) : state === "finished" ? (
                      <strong>Done.</strong>
                    ) : (
                      <strong>
                        Importing
                        <AnimatedDotDotDot />
                      </strong>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Actions>
            {state === "notStarted" ? (
              <>
                <Modal.ActionGroup>
                  <Button.Tertiary tabIndex={1} onClick={onClose}>
                    Close
                  </Button.Tertiary>
                </Modal.ActionGroup>
                <Modal.ActionGroup>
                  <div>
                    <Button.Primary onClick={onClickImport}>
                      Start Import
                    </Button.Primary>
                  </div>
                </Modal.ActionGroup>
              </>
            ) : state === "inProgress" ? (
              <>
                <Modal.ActionGroup>
                  <div>
                    <Button.Primary disabled>
                      {importedFilesCount === 0 ? "Uploading" : "Importing"}
                      <AnimatedDotDotDot />
                    </Button.Primary>
                  </div>
                </Modal.ActionGroup>
              </>
            ) : (
              <>
                <Modal.ActionGroup>
                  <div>
                    {showLogs ? (
                      <Button.Primary onClick={() => setShowLogs(false)}>
                        Hide logs
                      </Button.Primary>
                    ) : (
                      <Button.Primary onClick={() => setShowLogs(true)}>
                        Show logs
                      </Button.Primary>
                    )}
                  </div>
                  <div>
                    <Button.Primary onClick={onClose}>Close</Button.Primary>
                  </div>
                </Modal.ActionGroup>
              </>
            )}
          </Modal.Actions>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
};

export const ImportFileModal: React.FC<{
  file: File;
  close: () => void;
}> = ({ file, close }) => {
  if (validMapMediaFileTypes.includes(file.type)) {
    return <ImageImportModal file={file} close={close} />;
  } else if (validNoteImportFileTypes.includes(file.type)) {
    return <NoteImportModal file={file} close={close} />;
  } else {
    return (
      <Modal onPressEscape={close} onClickOutside={close}>
        <Modal.Dialog>
          <Modal.Header>
            <h3>Fichier invalide</h3>
          </Modal.Header>
          <Modal.Body>
            Seuls les images, GIFs, vidéos, fichiers zip et fichiers markdown
            peuvent être importés dans Navis.
          </Modal.Body>
          <Modal.Footer>
            <Modal.Actions>
              <Modal.ActionGroup>
                <div>
                  <Button.Primary tabIndex={1} onClick={close}>
                    Ok
                  </Button.Primary>
                </div>
              </Modal.ActionGroup>
            </Modal.Actions>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal>
    );
  }
};
