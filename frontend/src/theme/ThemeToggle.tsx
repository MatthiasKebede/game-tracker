import { useEffect, useState } from 'react'
import { secondaryButton } from '../library/styles'
import { applyTheme, initialTheme, saveTheme } from './theme'
import type { Theme } from './theme'

/** Top bar button that switches between the light and dark themes and remembers the choice. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // Keep the <html> attribute in step with the state, including on first render.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className={secondaryButton}
      onClick={() => {
        setTheme(next)
        // Saved only on an explicit click, so until then the page keeps following the system setting.
        saveTheme(next)
      }}
    >
      {next === 'dark' ? 'Dark mode' : 'Light mode'}
    </button>
  )
}
