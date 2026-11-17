import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Game } from '../api/types'
import { jsonResponse, stubFetch } from '../test/fakeFetch'
import { PLATFORMS, sampleGames } from '../test/fixtures'
import { LibraryPage } from './LibraryPage'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubLibrary(games: Game[]) {
  return stubFetch([
    { method: 'GET', path: '/api/games', respond: () => jsonResponse(200, games) },
    { method: 'GET', path: '/api/platforms', respond: () => jsonResponse(200, PLATFORMS) },
  ])
}

// The text of each body row's cells, for example "Celeste | Switch | Finished | 10h 0m | 8".
function bodyRows(): string[] {
  const [, ...rows] = screen.getAllByRole('row')
  return rows.map((row) =>
    Array.from(row.children)
      .slice(0, 5)
      .map((cell) => cell.textContent)
      .join(' | '),
  )
}

// One of the on/off filter buttons, for example chip('Platform', 'Steam').
function chip(group: string, label: string): HTMLElement {
  return within(screen.getByRole('group', { name: group })).getByRole('button', { name: label })
}

describe('LibraryPage', () => {
  it('shows one row per entry, sorted by name, with labels and formatted playtime', async () => {
    stubLibrary(sampleGames())
    render(<LibraryPage />)

    await screen.findByRole('table')

    expect(bodyRows()).toEqual([
      'Celeste | Steam | Not Started | 0m | 8',
      'Celeste | Switch | Finished | 10h 0m | 8',
      'Hades | Steam | Playing | 32h 15m | 9',
      'Portal | (none) | - | - | -',
    ])
    expect(screen.getByText('Showing 4 of 4 rows')).toBeInTheDocument()
  })

  it('hides rows that do not match the chosen status', async () => {
    stubLibrary(sampleGames())
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    await user.click(chip('Status', 'Finished'))

    expect(chip('Status', 'Finished')).toHaveAttribute('aria-pressed', 'true')
    expect(bodyRows()).toEqual(['Celeste | Switch | Finished | 10h 0m | 8'])
    expect(screen.getByText('Showing 1 of 4 rows')).toBeInTheDocument()
  })

  it('shows rows on either platform when two platforms are chosen', async () => {
    const games = sampleGames()
    games[1].entries[0] = { ...games[1].entries[0], platformId: 2, platformName: 'Xbox' }
    stubLibrary(games)
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    await user.click(chip('Platform', 'Switch'))

    expect(bodyRows()).toEqual(['Celeste | Switch | Finished | 10h 0m | 8'])

    await user.click(chip('Platform', 'Xbox'))

    expect(bodyRows()).toEqual(['Celeste | Switch | Finished | 10h 0m | 8', 'Hades | Xbox | Playing | 32h 15m | 9'])

    // Clicking a chosen chip again takes it back out.
    await user.click(chip('Platform', 'Switch'))

    expect(chip('Platform', 'Switch')).toHaveAttribute('aria-pressed', 'false')
    expect(bodyRows()).toEqual(['Hades | Xbox | Playing | 32h 15m | 9'])
  })

  it('narrows platform chips further with status chips', async () => {
    stubLibrary(sampleGames())
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    await user.click(chip('Platform', 'Steam'))
    await user.click(chip('Platform', 'Switch'))
    await user.click(chip('Status', 'Playing'))
    await user.click(chip('Status', 'Not Started'))

    expect(bodyRows()).toEqual(['Celeste | Steam | Not Started | 0m | 8', 'Hades | Steam | Playing | 32h 15m | 9'])
  })

  it('filters by series, listing the series found in the library', async () => {
    stubLibrary(sampleGames())
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')
    const seriesSelect = screen.getByLabelText('Series')

    expect(within(seriesSelect).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'All series',
      'No series',
      'Hades',
      'Portal',
    ])

    await user.selectOptions(seriesSelect, 'Portal')

    expect(bodyRows()).toEqual(['Portal | (none) | - | - | -'])

    await user.selectOptions(seriesSelect, 'No series')

    expect(bodyRows()).toEqual(['Celeste | Steam | Not Started | 0m | 8', 'Celeste | Switch | Finished | 10h 0m | 8'])
  })

  it('combines search and platform filters and can clear them', async () => {
    stubLibrary(sampleGames())
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    await user.click(chip('Platform', 'Steam'))
    await user.type(screen.getByLabelText('Search'), 'had')

    expect(bodyRows()).toEqual(['Hades | Steam | Playing | 32h 15m | 9'])

    await user.type(screen.getByLabelText('Search'), 'zzz')

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('No rows match the current filters.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(bodyRows()).toHaveLength(4)
    expect(chip('Platform', 'Steam')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Search')).toHaveValue('')
  })

  it('sorts by a clicked column and reverses on a second click', async () => {
    stubLibrary(sampleGames())
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')
    const playtimeHeader = screen.getByRole('columnheader', { name: /Playtime/ })

    await user.click(within(playtimeHeader).getByRole('button'))

    expect(playtimeHeader).toHaveAttribute('aria-sort', 'ascending')
    expect(bodyRows().map((row) => row.split(' | ')[3])).toEqual(['0m', '10h 0m', '32h 15m', '-'])

    await user.click(within(playtimeHeader).getByRole('button'))

    expect(playtimeHeader).toHaveAttribute('aria-sort', 'descending')
    expect(bodyRows().map((row) => row.split(' | ')[3])).toEqual(['32h 15m', '10h 0m', '0m', '-'])
    expect(screen.getByRole('columnheader', { name: /Name/ })).not.toHaveAttribute('aria-sort')
  })

  it('adds a game through the dialog and shows it after reloading', async () => {
    const games = sampleGames()
    const { calls } = stubFetch([
      { method: 'GET', path: '/api/games', respond: () => jsonResponse(200, games) },
      { method: 'GET', path: '/api/platforms', respond: () => jsonResponse(200, PLATFORMS) },
      {
        method: 'POST',
        path: '/api/games',
        respond: (body) => {
          const created: Game = { id: 10, coverImageUrl: null, entries: [], ...(body as Omit<Game, 'id' | 'coverImageUrl' | 'entries'>) }
          games.push(created)
          return jsonResponse(201, created)
        },
      },
    ])
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    await user.click(screen.getByRole('button', { name: 'Add game' }))
    const dialog = screen.getByRole('dialog', { name: 'Add game' })
    await user.type(within(dialog).getByLabelText('Name'), 'Outer Wilds')
    await user.selectOptions(within(dialog).getByLabelText('Rating'), '10')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Showing 5 of 5 rows')).toBeInTheDocument()
    expect(bodyRows()).toContain('Outer Wilds | (none) | - | - | 10')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // One load at the start and one after the save.
    expect(calls.filter((call) => call.method === 'GET' && call.path === '/api/games')).toHaveLength(2)
  })

  it('shows a notice when a new game is saved without its platform entry', async () => {
    const games = sampleGames()
    stubFetch([
      { method: 'GET', path: '/api/games', respond: () => jsonResponse(200, games) },
      { method: 'GET', path: '/api/platforms', respond: () => jsonResponse(200, PLATFORMS) },
      {
        method: 'POST',
        path: '/api/games',
        respond: () => {
          const created: Game = { id: 10, name: 'Outer Wilds', series: null, rating: null, coverImageUrl: null, entries: [] }
          games.push(created)
          return jsonResponse(201, created)
        },
      },
      { method: 'POST', path: '/api/games/10/entries', respond: () => jsonResponse(404, { detail: 'Platform 1 not found' }) },
    ])
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    await user.click(screen.getByRole('button', { name: 'Add game' }))
    const dialog = screen.getByRole('dialog', { name: 'Add game' })
    await user.type(within(dialog).getByLabelText('Name'), 'Outer Wilds')
    await user.selectOptions(within(dialog).getByLabelText('Platform'), 'Steam')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '"Outer Wilds" was added, but its platform entry was not: Platform 1 not found',
    )
    expect(await screen.findByText('Showing 5 of 5 rows')).toBeInTheDocument()
    expect(bodyRows()).toContain('Outer Wilds | (none) | - | - | -')

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('deletes a game only after confirmation', async () => {
    let games = sampleGames()
    const { calls } = stubFetch([
      { method: 'GET', path: '/api/games', respond: () => jsonResponse(200, games) },
      { method: 'GET', path: '/api/platforms', respond: () => jsonResponse(200, PLATFORMS) },
      {
        method: 'DELETE',
        path: '/api/games/1',
        respond: () => {
          games = games.filter((game) => game.id !== 1)
          return jsonResponse(204)
        },
      },
    ])
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    // Celeste has two rows, each with its own "Edit game" button.
    await user.click(screen.getAllByRole('button', { name: 'Edit game Celeste' })[0])
    await user.click(within(screen.getByRole('dialog', { name: 'Edit game' })).getByRole('button', { name: 'Delete game' }))

    // Nothing is deleted until the confirmation is accepted.
    const confirm = screen.getByRole('dialog', { name: 'Delete Celeste?' })
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false)

    await user.click(within(confirm).getByRole('button', { name: 'Delete game' }))

    expect(await screen.findByText('Showing 2 of 2 rows')).toBeInTheDocument()
    expect(bodyRows()).toEqual(['Hades | Steam | Playing | 32h 15m | 9', 'Portal | (none) | - | - | -'])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cancelling a delete leaves the library alone', async () => {
    const { calls } = stubLibrary(sampleGames())
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    await user.click(screen.getByRole('button', { name: 'Edit game Portal' }))
    await user.click(screen.getByRole('button', { name: 'Delete game' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Delete Portal?' })).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(calls.every((call) => call.method === 'GET')).toBe(true)
    expect(bodyRows()).toHaveLength(4)
  })

  it('removes one entry and keeps the game on its other platform', async () => {
    const games = sampleGames()
    const switchEntry = games[0].entries[0]
    stubFetch([
      { method: 'GET', path: '/api/games', respond: () => jsonResponse(200, games) },
      { method: 'GET', path: '/api/platforms', respond: () => jsonResponse(200, PLATFORMS) },
      {
        method: 'DELETE',
        path: `/api/entries/${switchEntry.id}`,
        respond: () => {
          games[0].entries = games[0].entries.filter((entry) => entry.id !== switchEntry.id)
          return jsonResponse(204)
        },
      },
    ])
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    await user.click(screen.getByRole('button', { name: 'Edit Celeste on Switch' }))
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Remove Celeste from Switch?' })).getByRole('button', { name: 'Remove' }),
    )

    expect(await screen.findByText('Showing 3 of 3 rows')).toBeInTheDocument()
    expect(bodyRows()).toEqual([
      'Celeste | Steam | Not Started | 0m | 8',
      'Hades | Steam | Playing | 32h 15m | 9',
      'Portal | (none) | - | - | -',
    ])
  })

  it('says so when the library is empty', async () => {
    stubLibrary([])
    render(<LibraryPage />)

    expect(await screen.findByText('The library is empty.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the error and loads again on retry', async () => {
    let attempts = 0
    stubFetch([
      {
        method: 'GET',
        path: '/api/games',
        respond: () => (++attempts === 1 ? new Response('Bad Gateway', { status: 502 }) : jsonResponse(200, sampleGames())),
      },
      { method: 'GET', path: '/api/platforms', respond: () => jsonResponse(200, PLATFORMS) },
    ])
    const user = userEvent.setup()
    render(<LibraryPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed with status 502.')

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
