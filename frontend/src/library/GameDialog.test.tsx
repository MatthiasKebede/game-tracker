import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Game } from '../api/types'
import { jsonResponse, stubFetch } from '../test/fakeFetch'
import type { FakeRoute } from '../test/fakeFetch'
import { PLATFORMS, sampleGames } from '../test/fixtures'
import { GameDialog } from './GameDialog'

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderDialog(game: Game | null, routes: FakeRoute[]) {
  const { calls } = stubFetch(routes)
  const onSaved = vi.fn()
  const onClose = vi.fn()
  const onDelete = vi.fn()
  render(<GameDialog game={game} platforms={PLATFORMS} onClose={onClose} onSaved={onSaved} onDelete={onDelete} />)
  return { calls, onSaved, onClose, onDelete, user: userEvent.setup() }
}

const createdGame = (id: number, name: string) => ({ id, name, series: null, rating: null, coverImageUrl: null, entries: [] })

describe('GameDialog when adding', () => {
  it('creates a game without a platform entry', async () => {
    const { calls, onSaved, user } = renderDialog(null, [
      { method: 'POST', path: '/api/games', respond: () => jsonResponse(201, createdGame(7, 'Hades')) },
    ])

    await user.type(screen.getByLabelText('Name'), 'Hades')
    await user.type(screen.getByLabelText('Series'), 'Hades')
    await user.selectOptions(screen.getByLabelText('Rating'), '9')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(calls).toEqual([{ method: 'POST', path: '/api/games', body: { name: 'Hades', series: 'Hades', rating: 9 } }])
    expect(onSaved).toHaveBeenCalledExactlyOnceWith()
  })

  it('creates the game and then its first entry, with playtime in minutes', async () => {
    const { calls, onSaved, user } = renderDialog(null, [
      { method: 'POST', path: '/api/games', respond: () => jsonResponse(201, createdGame(7, 'Celeste')) },
      { method: 'POST', path: '/api/games/7/entries', respond: () => jsonResponse(201, { id: 50 }) },
    ])

    await user.type(screen.getByLabelText('Name'), 'Celeste')
    // Status and playtime only appear once a platform is chosen.
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Platform'), 'Switch')
    await user.selectOptions(screen.getByLabelText('Status'), 'Finished')
    await user.type(screen.getByLabelText('Hours'), '10')
    await user.type(screen.getByLabelText('Minutes'), '15')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(calls).toEqual([
      { method: 'POST', path: '/api/games', body: { name: 'Celeste', series: null, rating: null } },
      { method: 'POST', path: '/api/games/7/entries', body: { platformId: 3, status: 'FINISHED', playtimeMinutes: 615 } },
    ])
    expect(onSaved).toHaveBeenCalledExactlyOnceWith()
  })

  it('shows server validation messages next to their fields and stays open', async () => {
    const { onSaved, user } = renderDialog(null, [
      {
        method: 'POST',
        path: '/api/games',
        respond: () =>
          jsonResponse(400, { detail: 'Invalid request content.', errors: { name: 'must not be blank' } }),
      },
    ])
    const nameInput = screen.getByLabelText('Name')

    // Spaces pass the browser's "required" check, so only the server catches this.
    await user.type(nameInput, '   ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('must not be blank')).toBeInTheDocument()
    expect(nameInput).toBeInvalid()
    expect(nameInput).toHaveAccessibleDescription('must not be blank')
    expect(screen.getByLabelText('Series')).toBeValid()
    expect(onSaved).not.toHaveBeenCalled()
    // The form can be corrected and submitted again.
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('does not call the API when the name is empty', async () => {
    const { calls, onSaved, user } = renderDialog(null, [])

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(calls).toEqual([])
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('closes with a notice when the game is saved but its entry is not', async () => {
    const { onSaved, user } = renderDialog(null, [
      { method: 'POST', path: '/api/games', respond: () => jsonResponse(201, createdGame(7, 'Celeste')) },
      {
        method: 'POST',
        path: '/api/games/7/entries',
        respond: () => jsonResponse(404, { detail: 'Platform 3 not found' }),
      },
    ])

    await user.type(screen.getByLabelText('Name'), 'Celeste')
    await user.selectOptions(screen.getByLabelText('Platform'), 'Switch')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSaved).toHaveBeenCalledExactlyOnceWith(
      '"Celeste" was added, but its platform entry was not: Platform 3 not found',
    )
  })
})

describe('GameDialog when editing', () => {
  const hades = () => sampleGames()[1]

  it('starts with the current values and has no platform field', () => {
    renderDialog(hades(), [])

    expect(screen.getByRole('dialog', { name: 'Edit game' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Hades')
    expect(screen.getByLabelText('Series')).toHaveValue('Hades')
    expect(screen.getByLabelText('Rating')).toHaveValue('9')
    expect(screen.queryByLabelText('Platform')).not.toBeInTheDocument()
  })

  it('updates the game and sends cleared fields as null', async () => {
    const { calls, onSaved, user } = renderDialog(hades(), [
      { method: 'PUT', path: '/api/games/2', respond: () => jsonResponse(200, createdGame(2, 'Hades II')) },
    ])

    await user.type(screen.getByLabelText('Name'), ' II')
    await user.clear(screen.getByLabelText('Series'))
    await user.selectOptions(screen.getByLabelText('Rating'), 'Unrated')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(calls).toEqual([{ method: 'PUT', path: '/api/games/2', body: { name: 'Hades II', series: null, rating: null } }])
    expect(onSaved).toHaveBeenCalledExactlyOnceWith()
  })

  it('shows an error without field details as a form message', async () => {
    const { onSaved, user } = renderDialog(hades(), [
      { method: 'PUT', path: '/api/games/2', respond: () => jsonResponse(404, { detail: 'Game 2 not found' }) },
    ])

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Game 2 not found')
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('hands delete and cancel back to the page without calling the API', async () => {
    const { calls, onClose, onDelete, user } = renderDialog(hades(), [])

    await user.click(screen.getByRole('button', { name: 'Delete game' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
    expect(calls).toEqual([])
  })
})
