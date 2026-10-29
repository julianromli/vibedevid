/** Kinds the `/api/uploads/image` route accepts. Mirrors `IMAGE_UPLOAD_KINDS` on the server. */
export type ClientImageUploadKind = "events" | "blog" | "avatars";

export interface UploadImageOptions {
  signal?: AbortSignal;
  onUploadProgress?: (event: { progress: number }) => void;
}

/**
 * POST one file as the raw request body and parse the JSON reply. XHR (not
 * fetch) so callers can show upload progress. Rejects on network errors and
 * on any non-2xx response, with the server's error message when it sent one.
 */
export function postImageFile(
  url: string,
  file: File,
  options: UploadImageOptions = {},
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onUploadProgress?.({ progress: (event.loaded / event.total) * 100 });
      }
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let message = "Upload failed";
        try {
          message = JSON.parse(xhr.responseText).error ?? message;
        } catch {}
        reject(new Error(message));
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        resolve(null);
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    options.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/** Upload an event cover, blog image, or avatar to R2 and get its public URL. */
export async function uploadImageOfKind(
  kind: ClientImageUploadKind,
  file: File,
  options: UploadImageOptions = {},
): Promise<{ key: string; url: string }> {
  const data = (await postImageFile(`/api/uploads/image?kind=${kind}`, file, options)) as {
    key?: unknown;
    url?: unknown;
  } | null;
  if (typeof data?.url !== "string" || typeof data.key !== "string") {
    throw new Error("Upload failed");
  }
  return { key: data.key, url: data.url };
}
