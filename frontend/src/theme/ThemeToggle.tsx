import { useEffect, useState } from 'react'
import { applyTheme, initialTheme, saveTheme } from './theme'
import type { Theme } from './theme'

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  // The button's aria-label already says what it does, so the drawing is hidden from screen readers.
  'aria-hidden': true,
} as const

const SunIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

const MoonIcon = () => (
  <svg {...iconProps}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
)

/** Top bar icon button that switches between the light and dark themes and remembers the choice. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // Keep the <html> attribute in step with the state, including on first render.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${next} mode`

  return (
    <button
      type="button"
      // An icon has no text, so the label is what screen readers announce. The title shows it on hover.
      aria-label={label}
      title={label}
      className="rounded border border-line bg-panel p-1.5 text-fg hover:bg-hover"
      onClick={() => {
        setTheme(next)
        // Saved only on an explicit click, so until then the page keeps following the system setting.
        saveTheme(next)
      }}
    >
      {/* The icon shows the theme a click switches to: a moon in light mode, a sun in dark mode. */}
      {next === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
