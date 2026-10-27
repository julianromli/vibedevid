import { createContext, useContext } from "react";
import type { PreviewSettings } from "./preview/bridge";

export const PreviewSettingsContext = createContext<PreviewSettings>({
  theme: "dark",
  lang: "id",
  replay: 0,
});

export const usePreviewSettings = () => useContext(PreviewSettingsContext);
