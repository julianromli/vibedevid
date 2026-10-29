import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cleanupProjectProvisionalUploadFn } from "@/lib/actions/projects.functions";
import { compressImageFile } from "@/lib/image-compression";
import {
  addQueuedShots,
  clampProgress,
  hasImageSignature,
  isAnyShotUploading,
  MAX_SCREENSHOTS,
  makeCover,
  moveShot,
  patchShot,
  pickScreenshotFiles,
  removeShot,
  type Shot,
  setImportedShot,
  submittedImages,
} from "@/lib/project-screenshots";
import { getConfirmedUpload } from "@/lib/project-upload-result";
import { uploadFiles } from "@/lib/uploadthing-client";

const MAX_PARALLEL_UPLOADS = 3;
const UPLOAD_TIMEOUT_MS = 120_000;
const PAGEHIDE_CLEANUP_URL = "/api/project-uploads/cleanup";

interface InFlight {
  controller: AbortController;
  timer: ReturnType<typeof setTimeout>;
}

function previewUrlFor(file: File): string {
  return typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : "";
}

function revoke(url: string) {
  if (url.startsWith("blob:") && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

function cleanupKey(key: string) {
  return cleanupProjectProvisionalUploadFn({ data: { imageKey: key } }).catch(() => undefined);
}

/** 1-based position, for messages like "Screenshot 2 uploaded". */
function positionOf(shots: Shot[], id: string): number {
  return shots.findIndex((shot) => shot.id === id) + 1;
}

/**
 * Upload each screenshot on its own, so one failure does not fail the batch.
 * Lives in the form (not the step) so uploads keep running across steps.
 */
export function useScreenshotUploads(options: { announce?: (message: string) => void } = {}) {
  const { t } = useTranslation("projectSubmit");
  const [shots, setShots] = useState<Shot[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  // Files picked but still being compressed: not shots yet, but not done either.
  const [preparing, setPreparing] = useState(0);
  const shotsRef = useRef<Shot[]>([]);
  const files = useRef(new Map<string, File>());
  const inFlight = useRef(new Map<string, InFlight>());
  const queue = useRef<string[]>([]);
  const nextId = useRef(0);
  // Set once the uploads are discarded or handed to a project: start nothing new.
  const stopped = useRef(false);
  const announceRef = useRef(options.announce);
  announceRef.current = options.announce;

  const update = useCallback((change: (current: Shot[]) => Shot[]) => {
    shotsRef.current = change(shotsRef.current);
    setShots(shotsRef.current);
  }, []);

  const pump = useCallback(() => {
    while (
      !stopped.current &&
      inFlight.current.size < MAX_PARALLEL_UPLOADS &&
      queue.current.length > 0
    ) {
      const id = queue.current.shift() as string;
      const file = files.current.get(id);
      if (!file || !shotsRef.current.some((shot) => shot.id === id)) continue;

      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
        inFlight.current.delete(id);
        update((current) =>
          patchShot(current, id, { status: "error", error: t("form.upload.timeout") }),
        );
        pump();
      }, UPLOAD_TIMEOUT_MS);
      const flight = { controller, timer };
      inFlight.current.set(id, flight);
      update((current) => patchShot(current, id, { status: "uploading", progress: 0 }));

      uploadFiles("projectImageUploader", {
        files: [file],
        signal: controller.signal,
        onUploadProgress: ({ progress }) => {
          if (inFlight.current.get(id) === flight) {
            update((current) => patchShot(current, id, { progress: clampProgress(progress) }));
          }
        },
      })
        .then((results) => results[0])
        .catch(() => undefined)
        .then((result) => {
          clearTimeout(timer);
          const confirmed = getConfirmedUpload(result);
          if (inFlight.current.get(id) !== flight) {
            // Removed or timed out while uploading. Do not leave the file behind.
            if (confirmed) void cleanupKey(confirmed.key);
            return;
          }
          inFlight.current.delete(id);
          if (confirmed) {
            update((current) =>
              patchShot(current, id, {
                status: "done",
                progress: 100,
                url: confirmed.url,
                key: confirmed.key,
                error: undefined,
              }),
            );
            announceRef.current?.(
              t("form.upload.announceDone", { n: positionOf(shotsRef.current, id) }),
            );
          } else {
            const failedKey = result?.key?.trim();
            if (failedKey) void cleanupKey(failedKey);
            update((current) =>
              patchShot(current, id, {
                status: "error",
                error: t(result ? "form.upload.unconfirmed" : "form.upload.failed"),
              }),
            );
            announceRef.current?.(
              t("form.upload.announceFailed", { n: positionOf(shotsRef.current, id) }),
            );
          }
          pump();
        });
    }
  }, [t, update]);

  const addFiles = useCallback(
    async (incoming: File[]) => {
      if (stopped.current || incoming.length === 0) return;
      setPreparing((count) => count + 1);
      let compressed: File[];
      let isImage: boolean[];
      try {
        compressed = await Promise.all(incoming.map((file) => compressImageFile(file)));
        // The server rejects non-images after the upload; catch renamed files before it.
        isImage = await Promise.all(compressed.map((file) => hasImageSignature(file)));
      } finally {
        setPreparing((count) => count - 1);
      }
      if (stopped.current) return;
      const picked = pickScreenshotFiles(
        compressed.filter((_, index) => isImage[index]),
        MAX_SCREENSHOTS - shotsRef.current.length,
      );
      const notImages = compressed
        .filter((_, index) => !isImage[index])
        .map((file) => ({ name: file.name, reason: "type" as const }));
      const messages = [...notImages, ...picked.rejected].map((item) =>
        t(item.reason === "type" ? "form.upload.rejectedType" : "form.upload.rejectedSize", {
          name: item.name,
        }),
      );
      if (picked.overLimit > 0) {
        messages.push(
          t("form.upload.overLimit", { max: MAX_SCREENSHOTS, count: picked.overLimit }),
        );
      }
      setNotice(messages.length > 0 ? messages.join(" ") : null);
      if (picked.accepted.length === 0) return;

      const items = picked.accepted.map((file) => {
        nextId.current += 1;
        const id = `upload-${nextId.current}`;
        files.current.set(id, file);
        return { id, previewUrl: previewUrlFor(file) };
      });
      update((current) => addQueuedShots(current, items));
      queue.current.push(...items.map((item) => item.id));
      pump();
    },
    [pump, t, update],
  );

  const retry = useCallback(
    (id: string) => {
      update((current) =>
        patchShot(current, id, { status: "queued", progress: 0, error: undefined }),
      );
      queue.current.push(id);
      pump();
    },
    [pump, update],
  );

  const remove = useCallback(
    (id: string) => {
      const shot = shotsRef.current.find((item) => item.id === id);
      if (!shot) return;
      const flight = inFlight.current.get(id);
      if (flight) {
        clearTimeout(flight.timer);
        flight.controller.abort();
        inFlight.current.delete(id);
      }
      if (shot.key) void cleanupKey(shot.key);
      if (shot.source === "upload") revoke(shot.previewUrl);
      files.current.delete(id);
      update((current) => removeShot(current, id));
      announceRef.current?.(t("form.upload.announceRemoved"));
      pump();
    },
    [pump, t, update],
  );

  const cover = useCallback(
    (id: string) => {
      update((current) => makeCover(current, id));
      announceRef.current?.(
        t("form.upload.announceCover", { n: positionOf(shotsRef.current, id) }),
      );
    },
    [t, update],
  );

  const move = useCallback(
    (id: string, delta: -1 | 1) => update((current) => moveShot(current, id, delta)),
    [update],
  );

  const setImported = useCallback(
    (url: string | null) => update((current) => setImportedShot(current, url)),
    [update],
  );

  /** Stop all work. Files that finish later are deleted by the upload callback. */
  const stop = useCallback(() => {
    stopped.current = true;
    queue.current = [];
    for (const flight of inFlight.current.values()) {
      clearTimeout(flight.timer);
      flight.controller.abort();
    }
    inFlight.current.clear();
  }, []);

  /** Delete every stored upload, for example when the user cancels the form. */
  const discardAll = useCallback(() => {
    if (stopped.current) return;
    stop();
    for (const shot of shotsRef.current) {
      if (shot.key) void cleanupKey(shot.key);
    }
  }, [stop]);

  /** The uploads are being handed to a project: keep them when the form unmounts. */
  const release = useCallback(() => {
    stop();
  }, [stop]);

  /** The hand-off failed: the uploads are the form's again. */
  const resume = useCallback(() => {
    stopped.current = false;
  }, []);

  useEffect(() => {
    // StrictMode runs cleanup then setup again: start fresh each time.
    stopped.current = false;
    // Unmount cleanup does not run on reload or tab close; ask the server instead.
    const onPageHide = (event: Event) => {
      if (stopped.current || (event as PageTransitionEvent).persisted) return;
      const keys = shotsRef.current.flatMap((shot) => (shot.key ? [shot.key] : []));
      if (keys.length === 0) return;
      void fetch(PAGEHIDE_CLEANUP_URL, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      }).catch(() => undefined);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      discardAll();
      for (const shot of shotsRef.current) {
        if (shot.source === "upload") revoke(shot.previewUrl);
      }
    };
  }, [discardAll]);

  const images = useMemo(() => submittedImages(shots), [shots]);

  return {
    shots,
    images,
    notice,
    isUploading: preparing > 0 || isAnyShotUploading(shots),
    addFiles,
    retry,
    remove,
    makeCover: cover,
    move,
    setImported,
    discardAll,
    release,
    resume,
  };
}

export type ScreenshotUploads = ReturnType<typeof useScreenshotUploads>;
