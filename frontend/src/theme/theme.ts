export type Theme = 'light' | 'dark'

// The localStorage key. The inline script in index.html reads the same key.
export const THEME_STORAGE_KEY = 'theme'

/** The saved choice if there is one, otherwise the operating system's preference. */
export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // Storage can be unavailable, for example in a private window. Fall through.
  }
  // matchMedia is missing in some environments, such as the test DOM.
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Switches the page's colors: index.css keys the dark palette off this attribute. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Not being able to remember the choice is not worth an error.
  }
}
