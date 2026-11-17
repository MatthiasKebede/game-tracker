import { BACKLOG_STATUSES } from '../api/types'
import type { BacklogStatus, Entry, Game } from '../api/types'

// Pure functions that turn the API's games into table rows. No React in here,
// so the filter and sort rules can be tested on their own.

/** One table row: a game on one platform, or a game that has no entries yet. */
export interface LibraryRow {
  key: string
  game: Game
  entry: Entry | null
}

export const STATUS_LABELS: Record<BacklogStatus, string> = {
  NOT_STARTED: 'Not Started',
  PLAYING: 'Playing',
  FINISHED: 'Finished',
  COMPLETED: '100%',
  DROPPED: 'Dropped',
}

export interface Filters {
  search: string
  platformId: number | null
  status: BacklogStatus | null
}

export const NO_FILTERS: Filters = { search: '', platformId: null, status: null }

export type SortColumn = 'name' | 'platform' | 'status' | 'playtime' | 'rating'

export interface Sort {
  column: SortColumn
  direction: 'asc' | 'desc'
}

export const DEFAULT_SORT: Sort = { column: 'name', direction: 'asc' }

/** A game on two platforms becomes two rows. A game with no entries becomes one. */
export function toRows(games: Game[]): LibraryRow[] {
  return games.flatMap((game): LibraryRow[] =>
    game.entries.length === 0
      ? [{ key: `game-${game.id}`, game, entry: null }]
      : game.entries.map((entry) => ({ key: `entry-${entry.id}`, game, entry })),
  )
}

export function filterRows(rows: LibraryRow[], filters: Filters): LibraryRow[] {
  const search = filters.search.trim().toLowerCase()
  return rows.filter(({ game, entry }) => {
    if (search !== '') {
      const text = `${game.name}\n${game.series ?? ''}`.toLowerCase()
      if (!text.includes(search)) {
        return false
      }
    }
    // A row without an entry has no platform or status, so it cannot match those filters.
    if (filters.platformId !== null && entry?.platformId !== filters.platformId) {
      return false
    }
    if (filters.status !== null && entry?.status !== filters.status) {
      return false
    }
    return true
  })
}

const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })

// The value a row is sorted by for a column, or null when it has none.
function sortValue(row: LibraryRow, column: SortColumn): string | number | null {
  switch (column) {
    case 'name':
      return row.game.name
    case 'platform':
      return row.entry?.platformName ?? null
    case 'status':
      // Sorted in backlog order (Not Started first), not alphabetically.
      return row.entry ? BACKLOG_STATUSES.indexOf(row.entry.status) : null
    case 'playtime':
      return row.entry?.playtimeMinutes ?? null
    case 'rating':
      return row.game.rating
  }
}

/** Returns a sorted copy. Rows with no value for the column go last in both directions. */
export function sortRows(rows: LibraryRow[], sort: Sort): LibraryRow[] {
  const flip = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = sortValue(a, sort.column)
    const right = sortValue(b, sort.column)
    if (left === null && right !== null) {
      return 1
    }
    if (left !== null && right === null) {
      return -1
    }
    let order = 0
    if (typeof left === 'string' && typeof right === 'string') {
      order = compareText(left, right)
    } else if (typeof left === 'number' && typeof right === 'number') {
      order = left - right
    }
    if (order !== 0) {
      return order * flip
    }
    // Ties keep a predictable order: by name, then by platform.
    return (
      compareText(a.game.name, b.game.name) ||
      compareText(a.entry?.platformName ?? '', b.entry?.platformName ?? '')
    )
  })
}

/** 615 -> "10h 15m", 45 -> "45m". */
export function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}
