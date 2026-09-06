export type Theme = "manual" | "intercept";
export const THEME_STORAGE_KEY = "enigma-bombe-theme";

export function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "intercept"
      ? "intercept"
      : "manual";
  } catch {
    // Privacy settings may disable storage; the default remains usable.
    return "manual";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "manual" ? "#eee7d5" : "#f0e4c9");
}

export function saveTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Keep the selection for this visit even when persistence is unavailable.
  }
}
