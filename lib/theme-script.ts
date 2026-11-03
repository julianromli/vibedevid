// Blocking theme script for <head>. Sets the theme class and color-scheme on <html>
// before first paint, with the same storage key, default, and attribute as the
// next-themes ThemeProvider in components/client-theme-provider.tsx.
// Plain string on purpose: bundlers can rewrite functions (e.g. esbuild `__name()`),
// which breaks code shipped with fn.toString().
export const THEME_STORAGE_KEY = "theme";
export const DEFAULT_THEME = "dark";

export const themeScript = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}t=t||${JSON.stringify(DEFAULT_THEME)};if(t==="system")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t!=="light"&&t!=="dark"){t=${JSON.stringify(DEFAULT_THEME)};try{localStorage.setItem(${JSON.stringify(THEME_STORAGE_KEY)},t)}catch(e){}}d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t})()`;
