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

    await user.selectOptions(screen.getByLabelText('Status'), 'Finished')

    expect(bodyRows()).toEqual(['Celeste | Switch | Finished | 10h 0m | 8'])
    expect(screen.getByText('Showing 1 of 4 rows')).toBeInTheDocument()
  })

  it('combines search and platform filters and can clear them', async () => {
    stubLibrary(sampleGames())
    const user = userEvent.setup()
    render(<LibraryPage />)
    await screen.findByRole('table')

    await user.selectOptions(screen.getByLabelText('Platform'), 'Steam')
    await user.type(screen.getByLabelText('Search'), 'had')

    expect(bodyRows()).toEqual(['Hades | Steam | Playing | 32h 15m | 9'])

    await user.type(screen.getByLabelText('Search'), 'zzz')

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('No rows match the current filters.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(bodyRows()).toHaveLength(4)
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
