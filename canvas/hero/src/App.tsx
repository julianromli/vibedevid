import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Canvas } from "./canvas/Canvas";
import type { Camera, Point } from "./canvas/camera";
import { loadLayout, type SavedLayout, saveLayout } from "./canvas/layout-storage";
import type { PreviewLang, PreviewSettings, PreviewTheme } from "./preview/bridge";
import { SECTIONS } from "./registry";
import { layoutSections } from "./registry/layout";
import { PreviewSettingsContext } from "./settings";

const SAVE_DELAY_MS = 400;
const THEMES: PreviewTheme[] = ["dark", "light"];
const LANGS: PreviewLang[] = ["id", "en"];

/** Saved as `theme.lang`, e.g. `dark.id`. */
function parseThemeId(id: string | null): { theme: PreviewTheme; lang: PreviewLang } | null {
  const [theme, lang] = (id ?? "").split(".");
  if (!THEMES.includes(theme as PreviewTheme) || !LANGS.includes(lang as PreviewLang)) return null;
  return { theme: theme as PreviewTheme, lang: lang as PreviewLang };
}

export function App() {
  const layout = useMemo(() => layoutSections(SECTIONS), []);
  const validIds = useMemo(() => new Set(layout.entries.map((entry) => entry.id)), [layout]);
  const [initial] = useState<SavedLayout>(() =>
    loadLayout(validIds, (id) => parseThemeId(id) !== null),
  );
  const saved = parseThemeId(initial.themeId);
  const [theme, setTheme] = useState<PreviewTheme>(saved?.theme ?? "dark");
  const [lang, setLang] = useState<PreviewLang>(saved?.lang ?? "id");
  const [replay, setReplay] = useState(0);
  const [positions, setPositions] = useState<Record<string, Point>>(initial.positions);
  const [canvasKey, setCanvasKey] = useState(0);

  const snapshot = useRef<SavedLayout>(initial);
  const saveTimer = useRef<number | undefined>(undefined);

  const flush = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    saveLayout(snapshot.current);
  }, []);

  const scheduleSave = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flush, SAVE_DELAY_MS);
  }, [flush]);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    document.documentElement.lang = lang;
    snapshot.current = { ...snapshot.current, themeId: `${theme}.${lang}` };
    scheduleSave();
  }, [theme, lang, scheduleSave]);

  useEffect(() => {
    const onPageHide = () => flush();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      flush();
    };
  }, [flush]);

  const onMove = useCallback(
    (id: string, position: Point) => {
      const next = { ...snapshot.current.positions, [id]: position };
      snapshot.current = { ...snapshot.current, positions: next };
      setPositions(next);
      scheduleSave();
    },
    [scheduleSave],
  );

  const onCameraChange = useCallback((camera: Camera) => {
    snapshot.current = { ...snapshot.current, camera };
  }, []);

  const onCameraSettled = useCallback(
    (camera: Camera) => {
      snapshot.current = { ...snapshot.current, camera };
      scheduleSave();
    },
    [scheduleSave],
  );

  const onResetLayout = useCallback(() => {
    snapshot.current = { camera: null, themeId: snapshot.current.themeId, positions: {} };
    setPositions({});
    flush();
    setCanvasKey((key) => key + 1);
  }, [flush]);

  const settings = useMemo<PreviewSettings>(() => ({ theme, lang, replay }), [theme, lang, replay]);

  const themeControl = (
    <div className="flex items-center gap-2">
      <Select value={theme} onValueChange={(value) => setTheme(value as PreviewTheme)}>
        <SelectTrigger aria-label="Tema" className="h-8 w-24 cursor-default text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="light">Light</SelectItem>
        </SelectContent>
      </Select>
      <Select value={lang} onValueChange={(value) => setLang(value as PreviewLang)}>
        <SelectTrigger aria-label="Bahasa" className="h-8 w-20 cursor-default text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          <SelectItem value="id">ID</SelectItem>
          <SelectItem value="en">EN</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        className="cursor-default hover:text-foreground"
        onClick={() => setReplay((count) => count + 1)}
      >
        <RotateCcw size={14} aria-hidden />
        <span className="hidden sm:inline">Putar ulang intro</span>
        <span className="sm:hidden">Ulang</span>
      </Button>
    </div>
  );

  return (
    <PreviewSettingsContext.Provider value={settings}>
      <Canvas
        key={canvasKey}
        layout={layout}
        sections={SECTIONS.map(({ id, title }) => ({ id, title }))}
        positions={positions}
        initialCamera={canvasKey === 0 ? initial.camera : null}
        themeControl={themeControl}
        onMove={onMove}
        onCameraChange={onCameraChange}
        onCameraSettled={onCameraSettled}
        onResetLayout={onResetLayout}
      />
    </PreviewSettingsContext.Provider>
  );
}
