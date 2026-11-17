import { formatPlaytime, STATUS_LABELS } from './rows'
import type { LibraryRow, Sort, SortColumn } from './rows'

interface LibraryTableProps {
  rows: LibraryRow[]
  sort: Sort
  onSortChange: (sort: Sort) => void
}

const COLUMNS: { column: SortColumn; label: string; numeric?: boolean }[] = [
  { column: 'name', label: 'Name' },
  { column: 'platform', label: 'Platform' },
  { column: 'status', label: 'Status' },
  { column: 'playtime', label: 'Playtime', numeric: true },
  { column: 'rating', label: 'Rating', numeric: true },
]

// Shown in cells that have no value, for example the platform of a game with no entries.
const EMPTY = <span className="text-slate-400">-</span>

export function LibraryTable({ rows, sort, onSortChange }: LibraryTableProps) {
  // Clicking the sorted column flips its direction. Clicking another column starts ascending.
  const toggleSort = (column: SortColumn) =>
    onSortChange({
      column,
      direction: sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc',
    })

  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-slate-700">
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
                    <span aria-hidden="true" className="ml-1 inline-block w-3 text-slate-500">
                      {sorted ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, game, entry }) => (
            <tr key={key} className="border-t border-slate-200 hover:bg-slate-50">
              <th scope="row" className="px-3 py-2 font-medium text-slate-900">
                {game.name}
                {game.series && game.series !== game.name && (
                  <span className="block text-xs font-normal text-slate-500">{game.series}</span>
                )}
              </th>
              <td className="px-3 py-2">{entry ? entry.platformName : <span className="text-slate-400">(none)</span>}</td>
              <td className="px-3 py-2">{entry ? STATUS_LABELS[entry.status] : EMPTY}</td>
              <td className="px-3 py-2 text-right tabular-nums">{entry ? formatPlaytime(entry.playtimeMinutes) : EMPTY}</td>
              <td className="px-3 py-2 text-right tabular-nums">{game.rating ?? EMPTY}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
