import { useMemo, useState } from 'react'
import { FilterBar } from './FilterBar'
import { LibraryTable } from './LibraryTable'
import { DEFAULT_SORT, filterRows, NO_FILTERS, sortRows, toRows } from './rows'
import type { Filters, Sort } from './rows'
import { useLibrary } from './useLibrary'

export function LibraryPage() {
  const { games, platforms, loading, error, reload } = useLibrary()
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT)

  // Filtering and sorting happen here in the browser, on the one list the API returned.
  const allRows = useMemo(() => toRows(games), [games])
  const visibleRows = useMemo(() => sortRows(filterRows(allRows, filters), sort), [allRows, filters, sort])

  return (
    <main className="mx-auto max-w-5xl p-6 text-slate-900">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Game Tracker</h1>
      </header>

      {error && (
        <div role="alert" className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          Could not load the library: {error}{' '}
          <button type="button" className="underline" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-slate-600">Loading the library...</p>
      ) : (
        <>
          <div className="mt-6">
            <FilterBar filters={filters} platforms={platforms} onChange={setFilters} />
          </div>

          <p className="mt-4 text-sm text-slate-600" aria-live="polite">
            Showing {visibleRows.length} of {allRows.length} {allRows.length === 1 ? 'row' : 'rows'}
          </p>

          <div className="mt-2">
            {allRows.length === 0 ? (
              !error && <p className="text-slate-600">The library is empty.</p>
            ) : visibleRows.length === 0 ? (
              <p className="text-slate-600">No rows match the current filters.</p>
            ) : (
              <LibraryTable rows={visibleRows} sort={sort} onSortChange={setSort} />
            )}
          </div>
        </>
      )}
    </main>
  )
}
