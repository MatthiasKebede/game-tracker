import { useMemo, useState } from 'react'
import { deleteEntry, deleteGame } from '../api/client'
import type { Entry, Game } from '../api/types'
import { ConfirmDialog } from './ConfirmDialog'
import { EntryDialog } from './EntryDialog'
import { FilterBar } from './FilterBar'
import { GameDialog } from './GameDialog'
import { LibraryTable } from './LibraryTable'
import { DEFAULT_SORT, filterRows, NO_FILTERS, seriesOptions, sortRows, toRows } from './rows'
import type { Filters, Sort } from './rows'
import { primaryButton } from './styles'
import { ThemeToggle } from '../theme/ThemeToggle'
import { useLibrary } from './useLibrary'

// Which dialog is open, if any, and what it is about. Only one can be open at a time.
type OpenDialog =
  | { kind: 'addGame' }
  | { kind: 'editGame'; game: Game }
  | { kind: 'deleteGame'; game: Game }
  | { kind: 'addEntry'; game: Game }
  | { kind: 'editEntry'; game: Game; entry: Entry }
  | { kind: 'deleteEntry'; game: Game; entry: Entry }

export function LibraryPage() {
  const { games, platforms, loading, error, reload } = useLibrary()
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT)
  const [dialog, setDialog] = useState<OpenDialog | null>(null)
  // A message about a save that only partly worked, shown above the table.
  const [notice, setNotice] = useState<string | null>(null)

  // Filtering and sorting happen here in the browser, on the one list the API returned.
  const allRows = useMemo(() => toRows(games), [games])
  const series = useMemo(() => seriesOptions(games), [games])
  const visibleRows = useMemo(() => sortRows(filterRows(allRows, filters), sort), [allRows, filters, sort])

  const closeDialog = () => setDialog(null)

  // After any change: close the dialog and fetch the library again so the table matches the server.
  const handleChanged = (newNotice?: string) => {
    setDialog(null)
    setNotice(newNotice ?? null)
    void reload()
  }

  return (
    <main className="mx-auto max-w-6xl p-6 text-fg">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Game Tracker</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!loading && (
            <button type="button" className={primaryButton} onClick={() => setDialog({ kind: 'addGame' })}>
              Add game
            </button>
          )}
        </div>
      </header>

      {error && (
        <div role="alert" className="mt-4 rounded border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">
          Could not load the library: {error}{' '}
          <button type="button" className="underline" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      )}

      {notice && (
        <div role="alert" className="mt-4 rounded border border-warn-line bg-warn-bg px-3 py-2 text-sm text-warn">
          {notice}{' '}
          <button type="button" className="underline" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-muted">Loading the library...</p>
      ) : (
        <>
          <div className="mt-6">
            <FilterBar filters={filters} platforms={platforms} series={series} onChange={setFilters} />
          </div>

          <p className="mt-4 text-sm text-muted" aria-live="polite">
            Showing {visibleRows.length} of {allRows.length} {allRows.length === 1 ? 'row' : 'rows'}
          </p>

          <div className="mt-2">
            {allRows.length === 0 ? (
              !error && <p className="text-muted">The library is empty.</p>
            ) : visibleRows.length === 0 ? (
              <p className="text-muted">No rows match the current filters.</p>
            ) : (
              <LibraryTable
                rows={visibleRows}
                sort={sort}
                onSortChange={setSort}
                onEditGame={(game) => setDialog({ kind: 'editGame', game })}
                onEditEntry={(game, entry) => setDialog({ kind: 'editEntry', game, entry })}
                onAddEntry={(game) => setDialog({ kind: 'addEntry', game })}
              />
            )}
          </div>
        </>
      )}

      {dialog?.kind === 'addGame' && (
        <GameDialog game={null} platforms={platforms} onClose={closeDialog} onSaved={handleChanged} />
      )}
      {dialog?.kind === 'editGame' && (
        <GameDialog
          game={dialog.game}
          platforms={platforms}
          onClose={closeDialog}
          onSaved={handleChanged}
          onDelete={() => setDialog({ kind: 'deleteGame', game: dialog.game })}
        />
      )}
      {dialog?.kind === 'deleteGame' && (
        <ConfirmDialog
          title={`Delete ${dialog.game.name}?`}
          message="This deletes the game and its entries on every platform. It cannot be undone."
          confirmLabel="Delete game"
          onConfirm={() => deleteGame(dialog.game.id)}
          onClose={closeDialog}
          onDone={handleChanged}
        />
      )}
      {dialog?.kind === 'addEntry' && (
        <EntryDialog game={dialog.game} entry={null} platforms={platforms} onClose={closeDialog} onSaved={handleChanged} />
      )}
      {dialog?.kind === 'editEntry' && (
        <EntryDialog
          game={dialog.game}
          entry={dialog.entry}
          platforms={platforms}
          onClose={closeDialog}
          onSaved={handleChanged}
          onDelete={() => setDialog({ kind: 'deleteEntry', game: dialog.game, entry: dialog.entry })}
        />
      )}
      {dialog?.kind === 'deleteEntry' && (
        <ConfirmDialog
          title={`Remove ${dialog.game.name} from ${dialog.entry.platformName}?`}
          message="This removes the status and playtime for this platform. The game itself stays in the library."
          confirmLabel="Remove"
          onConfirm={() => deleteEntry(dialog.entry.id)}
          onClose={closeDialog}
          onDone={handleChanged}
        />
      )}
    </main>
  )
}
