import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Entry, Game } from '../api/types'
import { jsonResponse, stubFetch } from '../test/fakeFetch'
import type { FakeRoute } from '../test/fakeFetch'
import { PLATFORMS, sampleGames } from '../test/fixtures'
import { EntryDialog } from './EntryDialog'

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderDialog(game: Game, entry: Entry | null, routes: FakeRoute[]) {
  const { calls } = stubFetch(routes)
  const onSaved = vi.fn()
  const onDelete = vi.fn()
  render(
    <EntryDialog game={game} entry={entry} platforms={PLATFORMS} onClose={vi.fn()} onSaved={onSaved} onDelete={onDelete} />,
  )
  return { calls, onSaved, onDelete, user: userEvent.setup() }
}

describe('EntryDialog when adding', () => {
  it('offers only platforms the game is not on yet', () => {
    // Celeste is on Switch and Steam, which leaves Xbox.
    renderDialog(sampleGames()[0], null, [])

    const options = within(screen.getByLabelText('Platform')).getAllByRole('option')

    expect(options.map((option) => option.textContent)).toEqual(['Xbox'])
  })

  it('adds the entry with defaults when nothing else is filled in', async () => {
    const { calls, onSaved, user } = renderDialog(sampleGames()[0], null, [
      { method: 'POST', path: '/api/games/1/entries', respond: () => jsonResponse(201, { id: 50 }) },
    ])

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(calls).toEqual([
      { method: 'POST', path: '/api/games/1/entries', body: { platformId: 2, status: 'NOT_STARTED', playtimeMinutes: 0 } },
    ])
    expect(onSaved).toHaveBeenCalledOnce()
  })

  it('shows a conflict from the server and stays open', async () => {
    const { onSaved, user } = renderDialog(sampleGames()[0], null, [
      {
        method: 'POST',
        path: '/api/games/1/entries',
        respond: () => jsonResponse(409, { detail: 'Game 1 already has an entry for platform Xbox' }),
      },
    ])

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Game 1 already has an entry for platform Xbox')
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('explains when the game is already on every platform', () => {
    // Only the two platforms Celeste already has exist here.
    render(
      <EntryDialog
        game={sampleGames()[0]}
        entry={null}
        platforms={PLATFORMS.filter((platform) => platform.name !== 'Xbox')}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    )

    expect(screen.getByText('Celeste is already on every platform.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })
})

describe('EntryDialog when editing', () => {
  // Hades on Steam: Playing, 1935 minutes.
  const hades = () => sampleGames()[1]

  it('starts with the current status and playtime split into hours and minutes', () => {
    const game = hades()
    renderDialog(game, game.entries[0], [])

    expect(screen.getByRole('dialog', { name: 'Edit Hades on Steam' })).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toHaveValue('PLAYING')
    expect(screen.getByLabelText('Hours')).toHaveValue(32)
    expect(screen.getByLabelText('Minutes')).toHaveValue(15)
    // The platform of an existing entry cannot be changed.
    expect(screen.queryByLabelText('Platform')).not.toBeInTheDocument()
  })

  it('updates status and playtime, treating an empty box as zero', async () => {
    const game = hades()
    const entry = game.entries[0]
    const { calls, onSaved, user } = renderDialog(game, entry, [
      { method: 'PUT', path: `/api/entries/${entry.id}`, respond: () => jsonResponse(200, entry) },
    ])

    await user.selectOptions(screen.getByLabelText('Status'), '100%')
    await user.clear(screen.getByLabelText('Hours'))
    await user.type(screen.getByLabelText('Hours'), '40')
    await user.clear(screen.getByLabelText('Minutes'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(calls).toEqual([
      { method: 'PUT', path: `/api/entries/${entry.id}`, body: { status: 'COMPLETED', playtimeMinutes: 2400 } },
    ])
    expect(onSaved).toHaveBeenCalledOnce()
  })

  it('shows a server validation message for playtime', async () => {
    const game = hades()
    const entry = game.entries[0]
    const { onSaved, user } = renderDialog(game, entry, [
      {
        method: 'PUT',
        path: `/api/entries/${entry.id}`,
        respond: () =>
          jsonResponse(400, {
            detail: 'Invalid request content.',
            errors: { playtimeMinutes: 'must be greater than or equal to 0' },
          }),
      },
    ])

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('must be greater than or equal to 0')).toBeInTheDocument()
    expect(screen.getByLabelText('Hours')).toBeInvalid()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('hands removal back to the page without calling the API', async () => {
    const game = hades()
    const { calls, onDelete, user } = renderDialog(game, game.entries[0], [])

    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(onDelete).toHaveBeenCalledOnce()
    expect(calls).toEqual([])
  })
})
