import { History, Play } from "lucide-react";
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
  // Round 1 was turned down; it stays on the canvas but is hidden until asked for.
  const [showRound1, setShowRound1] = useState(false);
  const sections = useMemo(
    () => (showRound1 ? SECTIONS : SECTIONS.filter((section) => section.id !== "round1")),
    [showRound1],
  );
  const layout = useMemo(() => layoutSections(sections), [sections]);
  const validIds = useMemo(
    () => new Set(layoutSections(SECTIONS).entries.map((entry) => entry.id)),
    [],
  );
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
    <div className="flex items-center gap-1 sm:gap-2">
      <Select value={theme} onValueChange={(value) => setTheme(value as PreviewTheme)}>
        <SelectTrigger
          aria-label="Tema"
          className="h-8 w-[4.75rem] cursor-default px-2.5 text-xs sm:w-24 sm:px-3"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="light">Light</SelectItem>
        </SelectContent>
      </Select>
      <Select value={lang} onValueChange={(value) => setLang(value as PreviewLang)}>
        <SelectTrigger
          aria-label="Bahasa"
          className="h-8 w-16 cursor-default px-2.5 text-xs sm:w-20 sm:px-3"
        >
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
        aria-pressed={showRound1}
        aria-label={showRound1 ? "Sembunyikan ronde 1" : "Tampilkan ronde 1"}
        className="cursor-default hover:text-foreground aria-pressed:bg-accent max-sm:size-11 max-sm:px-0"
        onClick={() => setShowRound1((shown) => !shown)}
      >
        <History size={14} aria-hidden />
        <span className="hidden sm:inline">
          {showRound1 ? "Sembunyikan ronde 1" : "Tampilkan ronde 1"}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Putar ulang intro"
        className="cursor-default hover:text-foreground max-sm:size-11 max-sm:px-0"
        onClick={() => setReplay((count) => count + 1)}
      >
        <Play size={14} aria-hidden />
        <span className="hidden sm:inline">Putar ulang intro</span>
      </Button>
    </div>
  );

  return (
    <PreviewSettingsContext.Provider value={settings}>
      <Canvas
        key={`${canvasKey}.${showRound1}`}
        layout={layout}
        sections={sections.map(({ id, title }) => ({ id, title }))}
        positions={positions}
        initialCamera={snapshot.current.camera}
        themeControl={themeControl}
        onMove={onMove}
        onCameraChange={onCameraChange}
        onCameraSettled={onCameraSettled}
        onResetLayout={onResetLayout}
      />
    </PreviewSettingsContext.Provider>
  );
}
