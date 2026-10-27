import { useEffect, useRef } from "react";
import type { HostMessage, PreviewMessage, VariantId } from "./preview/bridge";
import { usePreviewSettings } from "./settings";

interface PreviewFrameProps {
  variant: VariantId;
  width: number;
  height: number;
  title: string;
}

/**
 * One hero rendered in its own document, so a 390 frame hits the real
 * mobile breakpoints. Settings flow in by postMessage; the frame never reloads.
 */
export function PreviewFrame({ variant, width, height, title }: PreviewFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const settings = usePreviewSettings();
  const latest = useRef(settings);
  latest.current = settings;

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-send whenever toolbar settings change; the payload is read from the ref.
  useEffect(() => {
    const send = () => {
      const message: HostMessage = { type: "vd-preview-settings", settings: latest.current };
      ref.current?.contentWindow?.postMessage(message, window.location.origin);
    };
    const onMessage = (event: MessageEvent<PreviewMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== ref.current?.contentWindow) return;
      if (event.data?.type === "vd-preview-ready") send();
    };
    window.addEventListener("message", onMessage);
    send();
    return () => window.removeEventListener("message", onMessage);
  }, [settings]);

  // First paint already matches the toolbar, before the bridge says hello.
  const initial = useRef(`preview.html?v=${variant}&theme=${settings.theme}&lang=${settings.lang}`);

  return (
    <iframe
      ref={ref}
      title={title}
      src={initial.current}
      width={width}
      height={height}
      loading="lazy"
      className="block border-0 bg-background"
      style={{ width, height }}
    />
  );
}
