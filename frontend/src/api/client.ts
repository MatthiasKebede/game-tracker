import type { Entry, EntryCreateInput, EntryUpdateInput, Game, GameInput, Platform } from './types'

/**
 * Thrown for any failed API call. `fieldErrors` maps a request field to its
 * validation message (the "errors" object in the backend's 400 responses) and
 * is empty for other failures.
 */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// The backend's error format (application/problem+json).
interface ProblemDetail {
  title?: string
  detail?: string
  errors?: Record<string, string>
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // fetch only rejects when no response arrived at all.
    throw new ApiError(0, 'Could not reach the server.')
  }

  if (!response.ok) {
    // The body is not JSON when the backend is down and the dev proxy answers instead.
    const problem = (await response.json().catch(() => ({}))) as ProblemDetail
    const message = problem.detail ?? problem.title ?? `Request failed with status ${response.status}.`
    throw new ApiError(response.status, message, problem.errors ?? {})
  }

  // 204 No Content: successful deletes have no body to parse.
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export const listPlatforms = () => request<Platform[]>('GET', '/api/platforms')

export const listGames = () => request<Game[]>('GET', '/api/games')

export const createGame = (input: GameInput) => request<Game>('POST', '/api/games', input)

export const updateGame = (id: number, input: GameInput) => request<Game>('PUT', `/api/games/${id}`, input)

export const deleteGame = (id: number) => request<void>('DELETE', `/api/games/${id}`)

export const addEntry = (gameId: number, input: EntryCreateInput) =>
  request<Entry>('POST', `/api/games/${gameId}/entries`, input)

export const updateEntry = (id: number, input: EntryUpdateInput) =>
  request<Entry>('PUT', `/api/entries/${id}`, input)

export const deleteEntry = (id: number) => request<void>('DELETE', `/api/entries/${id}`)
