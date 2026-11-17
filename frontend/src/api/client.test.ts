import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, stubFetch } from '../test/fakeFetch'
import { ApiError, createGame, deleteGame, listPlatforms } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
})

// Runs a call that is expected to fail and returns the ApiError it threw.
async function failureOf(call: Promise<unknown>): Promise<ApiError> {
  try {
    await call
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError)
    return error as ApiError
  }
  throw new Error('Expected the call to fail, but it succeeded.')
}

describe('api client', () => {
  it('returns the parsed JSON body on success', async () => {
    stubFetch([
      { method: 'GET', path: '/api/platforms', respond: () => jsonResponse(200, [{ id: 1, name: 'Steam' }]) },
    ])

    await expect(listPlatforms()).resolves.toEqual([{ id: 1, name: 'Steam' }])
  })

  it('sends the input as a JSON body', async () => {
    const { calls } = stubFetch([
      { method: 'POST', path: '/api/games', respond: () => jsonResponse(201, { id: 7 }) },
    ])

    await createGame({ name: 'Hades', series: null, rating: 9 })

    expect(calls).toEqual([
      { method: 'POST', path: '/api/games', body: { name: 'Hades', series: null, rating: 9 } },
    ])
  })

  it('resolves without a body for 204 responses', async () => {
    stubFetch([{ method: 'DELETE', path: '/api/games/3', respond: () => jsonResponse(204) }])

    await expect(deleteGame(3)).resolves.toBeUndefined()
  })

  it('turns a validation problem into an ApiError with field errors', async () => {
    stubFetch([
      {
        method: 'POST',
        path: '/api/games',
        respond: () =>
          jsonResponse(400, {
            title: 'Bad Request',
            status: 400,
            detail: 'Invalid request content.',
            errors: { name: 'must not be blank', rating: 'must be less than or equal to 10' },
          }),
      },
    ])

    const error = await failureOf(createGame({ name: '', series: null, rating: 11 }))

    expect(error.status).toBe(400)
    expect(error.message).toBe('Invalid request content.')
    expect(error.fieldErrors).toEqual({ name: 'must not be blank', rating: 'must be less than or equal to 10' })
  })

  it('uses the problem detail as the message for errors without fields', async () => {
    stubFetch([
      {
        method: 'DELETE',
        path: '/api/games/99',
        respond: () => jsonResponse(404, { title: 'Not Found', status: 404, detail: 'Game 99 not found' }),
      },
    ])

    const error = await failureOf(deleteGame(99))

    expect(error.status).toBe(404)
    expect(error.message).toBe('Game 99 not found')
    expect(error.fieldErrors).toEqual({})
  })

  it('reports a status when the error body is not JSON', async () => {
    stubFetch([
      { method: 'GET', path: '/api/platforms', respond: () => new Response('Bad Gateway', { status: 502 }) },
    ])

    const error = await failureOf(listPlatforms())

    expect(error.status).toBe(502)
    expect(error.message).toBe('Request failed with status 502.')
  })

  it('reports an unreachable server when fetch itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await failureOf(listPlatforms())

    expect(error.status).toBe(0)
    expect(error.message).toBe('Could not reach the server.')
  })
})
