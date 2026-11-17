import { useCallback, useEffect, useState } from 'react'
import { listGames, listPlatforms } from '../api/client'
import type { Game, Platform } from '../api/types'

/**
 * Loads the whole library once and keeps it in state. Call `reload` after any
 * change so the table shows what the server now has.
 */
export function useLibrary() {
  const [games, setGames] = useState<Game[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const [loadedGames, loadedPlatforms] = await Promise.all([listGames(), listPlatforms()])
      setGames(loadedGames)
      setPlatforms(loadedPlatforms)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Loading from the server is the "external system" case effects are meant for.
    // The state updates happen after the request finishes, not during the effect.
    // oxlint-disable-next-line react/set-state-in-effect
    void reload()
  }, [reload])

  return { games, platforms, loading, error, reload }
}
