import { useEffect, useState } from 'react'
import { listPlatforms } from './api/client'
import type { Platform } from './api/types'

// Temporary page for the scaffold step: proves the browser can reach the API
// through the dev proxy. Replaced by the library view.
function App() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listPlatforms()
      .then(setPlatforms)
      .catch((cause: Error) => setError(cause.message))
  }, [])

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Game Tracker</h1>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      <ul className="mt-4 list-disc pl-6">
        {platforms.map((platform) => (
          <li key={platform.id}>{platform.name}</li>
        ))}
      </ul>
    </main>
  )
}

export default App
