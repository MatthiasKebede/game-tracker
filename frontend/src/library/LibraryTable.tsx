import type { Entry, Game } from '../api/types'
import { formatPlaytime, STATUS_LABELS } from './rows'
import type { LibraryRow, Sort, SortColumn } from './rows'

interface LibraryTableProps {
  rows: LibraryRow[]
  sort: Sort
  onSortChange: (sort: Sort) => void
  onEditGame: (game: Game) => void
  onEditEntry: (game: Game, entry: Entry) => void
  onAddEntry: (game: Game) => void
}

const actionButton = 'rounded px-1.5 py-0.5 text-sm text-fg underline hover:bg-hover hover:text-accent'

const COLUMNS: { column: SortColumn; label: string; numeric?: boolean }[] = [
  { column: 'name', label: 'Name' },
  { column: 'platform', label: 'Platform' },
  { column: 'status', label: 'Status' },
  { column: 'playtime', label: 'Playtime', numeric: true },
  { column: 'rating', label: 'Rating', numeric: true },
]

// Shown in cells that have no value, for example the platform of a game with no entries.
const EMPTY = <span className="text-muted">-</span>

export function LibraryTable({ rows, sort, onSortChange, onEditGame, onEditEntry, onAddEntry }: LibraryTableProps) {
  // Clicking the sorted column flips its direction. Clicking another column starts ascending.
  const toggleSort = (column: SortColumn) =>
    onSortChange({
      column,
      direction: sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc',
    })

  return (
    <div className="overflow-x-auto rounded border border-line bg-panel">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-header text-fg">
          <tr>
            {COLUMNS.map(({ column, label, numeric }) => {
              const sorted = sort.column === column
              return (
                // aria-sort tells screen readers which column is sorted and in which direction.
                <th
                  key={column}
                  scope="col"
                  aria-sort={sorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={`px-3 py-2 font-semibold ${numeric ? 'text-right' : ''}`}
                >
                  <button type="button" className="font-semibold hover:underline" onClick={() => toggleSort(column)}>
                    {label}
                    <span aria-hidden="true" className="ml-1 inline-block w-3 text-muted">
                      {sorted ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
              )
            })}
            <th scope="col" className="px-3 py-2 font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, game, entry }) => (
            <tr key={key} className="border-t border-line hover:bg-hover">
              <th scope="row" className="px-3 py-2 font-medium text-fg">
                {game.name}
                {game.series && game.series !== game.name && (
                  <span className="block text-xs font-normal text-muted">{game.series}</span>
                )}
              </th>
              <td className="px-3 py-2">{entry ? entry.platformName : <span className="text-muted">(none)</span>}</td>
              <td className="px-3 py-2">{entry ? STATUS_LABELS[entry.status] : EMPTY}</td>
              <td className="px-3 py-2 text-right tabular-nums">{entry ? formatPlaytime(entry.playtimeMinutes) : EMPTY}</td>
              <td className="px-3 py-2 text-right tabular-nums">{game.rating ?? EMPTY}</td>
              {/* The aria-labels name the game and platform, since every row has the same button text. */}
              <td className="px-3 py-2 whitespace-nowrap">
                <button
                  type="button"
                  className={actionButton}
                  aria-label={`Edit game ${game.name}`}
                  onClick={() => onEditGame(game)}
                >
                  Edit game
                </button>
                {entry && (
                  <button
                    type="button"
                    className={actionButton}
                    aria-label={`Edit ${game.name} on ${entry.platformName}`}
                    onClick={() => onEditEntry(game, entry)}
                  >
                    Edit entry
                  </button>
                )}
                <button
                  type="button"
                  className={actionButton}
                  aria-label={`Add ${game.name} to a platform`}
                  onClick={() => onAddEntry(game)}
                >
                  Add platform
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
