export type UploadProgress = {
  /** Bytes uploaded so far. */
  loaded: number;
  /** Total bytes to upload (0 when the browser cannot compute it). */
  total: number;
  /** Fraction in the [0, 1] range, or null when it cannot be computed. */
  fraction: number | null;
};

export type UploadResult =
  | { type: "success"; status: number; responseText: string }
  | { type: "error"; status: number; responseText: string }
  | { type: "abort" };

export type UploadFileTask = {
  abort: () => void;
  done: Promise<UploadResult>;
};

type UploadFileOptions = {
  url: string;
  body: Blob | File | FormData;
  method?: "PUT" | "POST";
  headers?: Record<string, string | null | undefined>;
  onProgress?: (progress: UploadProgress) => void;
};

/**
 * Upload a file via XMLHttpRequest so that upload progress can be reported.
 * `fetch` does not expose upload progress, which is why we keep using XHR here.
 */
export const uploadFile = (options: UploadFileOptions): UploadFileTask => {
  const request = new XMLHttpRequest();

  let resolve: (value: UploadResult) => void = () => undefined;
  const done = new Promise<UploadResult>((res) => {
    resolve = res;
  });

  request.upload.addEventListener("progress", (event) => {
    if (!options.onProgress) return;
    options.onProgress({
      loaded: event.loaded,
      total: event.total,
      fraction: event.lengthComputable ? event.loaded / event.total : null,
    });
  });

  request.addEventListener("load", () => {
    const status = request.status;
    resolve({
      type: status >= 200 && status < 300 ? "success" : "error",
      status,
      responseText: request.responseText,
    });
  });
  request.addEventListener("error", () => {
    resolve({ type: "error", status: request.status, responseText: "" });
  });
  request.addEventListener("abort", () => {
    resolve({ type: "abort" });
  });

  request.open(options.method ?? "PUT", options.url, true);
  for (const [header, value] of Object.entries(options.headers ?? {})) {
    if (!value) continue;
    request.setRequestHeader(header, value);
  }
  request.send(options.body);

  return {
    abort: () => request.abort(),
    done,
  };
};
