import type { ProjectUploadResult } from "@/lib/project-upload-result";

export const PROJECT_IMAGE_UPLOAD_URL = "/api/project-uploads/image";

/**
 * Send one screenshot to our server, which stores it in R2. XHR (not fetch)
 * so the form can show upload progress. Rejects on network errors and on any
 * non-2xx response.
 */
export function uploadProjectImage(
  file: File,
  options: { signal?: AbortSignal; onUploadProgress?: (event: { progress: number }) => void } = {},
): Promise<ProjectUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", PROJECT_IMAGE_UPLOAD_URL);
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
        resolve({ serverData: JSON.parse(xhr.responseText) });
      } catch {
        resolve({ serverData: null });
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    if (options.signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    options.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/** Upload several screenshots one by one; failed files are skipped. */
export async function uploadProjectImages(files: File[]): Promise<ProjectUploadResult[]> {
  const results: ProjectUploadResult[] = [];
  for (const file of files) {
    results.push(await uploadProjectImage(file).catch(() => ({ serverData: null })));
  }
  return results;
}
