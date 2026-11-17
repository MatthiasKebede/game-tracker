import { vi } from 'vitest'

// Builds a Response like the backend would send. A null body means "no content".
export function jsonResponse(status: number, body: unknown = null): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  })
}

export interface FakeRoute {
  method: string
  path: string
  // Called with the parsed JSON request body. Returns the response to send.
  respond: (body: unknown) => Response
}

/**
 * Replaces the global fetch with a fake that answers from the given routes and
 * records every call. An unexpected request fails the test with a clear error.
 */
export function stubFetch(routes: FakeRoute[]) {
  const calls: { method: string; path: string; body: unknown }[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    const path = String(input)
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined
    calls.push({ method, path, body })
    const route = routes.find((candidate) => candidate.method === method && candidate.path === path)
    if (!route) {
      throw new Error(`Unexpected request in test: ${method} ${path}`)
    }
    return route.respond(body)
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls }
}
