import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

// Makes the fake browser report the given operating system preference.
function stubSystemPreference(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: prefersDark && query === '(prefers-color-scheme: dark)' })),
  )
}

const currentTheme = () => document.documentElement.dataset.theme

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ThemeToggle', () => {
  it('starts light when nothing is saved and the system prefers light', () => {
    stubSystemPreference(false)
    render(<ThemeToggle />)

    expect(currentTheme()).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })

  it('follows the system preference for dark when nothing is saved', () => {
    stubSystemPreference(true)
    render(<ThemeToggle />)

    expect(currentTheme()).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
    // Following the system is not a choice, so nothing is stored yet.
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('prefers a saved choice over the system preference', () => {
    stubSystemPreference(true)
    localStorage.setItem('theme', 'light')
    render(<ThemeToggle />)

    expect(currentTheme()).toBe('light')
  })

  it('ignores a saved value that is not a theme', () => {
    stubSystemPreference(false)
    localStorage.setItem('theme', 'purple')
    render(<ThemeToggle />)

    expect(currentTheme()).toBe('light')
  })

  it('switches theme on click, in both directions, and remembers the choice', async () => {
    stubSystemPreference(false)
    const user = userEvent.setup()
    const { unmount } = render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(currentTheme()).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')

    // A fresh render, like reloading the page, starts from the saved choice.
    unmount()
    render(<ThemeToggle />)

    expect(currentTheme()).toBe('dark')

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))

    expect(currentTheme()).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
