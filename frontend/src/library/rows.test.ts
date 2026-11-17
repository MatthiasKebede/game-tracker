import { describe, expect, it } from 'vitest'
import { sampleGames } from '../test/fixtures'
import { filterRows, formatPlaytime, isFiltering, NO_FILTERS, seriesOptions, sortRows, toRows } from './rows'
import type { LibraryRow } from './rows'

// "Celeste/Switch" style labels make expected row orders easy to read.
const labels = (rows: LibraryRow[]) => rows.map((row) => `${row.game.name}/${row.entry?.platformName ?? 'none'}`)

describe('toRows', () => {
  it('makes one row per entry and one row for a game without entries', () => {
    expect(labels(toRows(sampleGames()))).toEqual(['Celeste/Switch', 'Celeste/Steam', 'Hades/Steam', 'Portal/none'])
  })

  it('gives every row a distinct key', () => {
    const keys = toRows(sampleGames()).map((row) => row.key)

    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('filterRows', () => {
  const rows = toRows(sampleGames())

  it('keeps every row when no filter is set', () => {
    expect(filterRows(rows, NO_FILTERS)).toHaveLength(4)
  })

  it('searches the name without regard to case or surrounding spaces', () => {
    expect(labels(filterRows(rows, { ...NO_FILTERS, search: '  cEL ' }))).toEqual(['Celeste/Switch', 'Celeste/Steam'])
  })

  it('searches the series as well as the name', () => {
    const games = sampleGames()
    games[0].series = 'Mountain Games'

    expect(labels(filterRows(toRows(games), { ...NO_FILTERS, search: 'mountain' }))).toEqual([
      'Celeste/Switch',
      'Celeste/Steam',
    ])
  })

  it('filters by platform and leaves out games without entries', () => {
    expect(labels(filterRows(rows, { ...NO_FILTERS, platformIds: [1] }))).toEqual(['Celeste/Steam', 'Hades/Steam'])
  })

  it('matches a row on any of several chosen platforms', () => {
    // 2 is Xbox, which nothing is on. 3 is Switch.
    expect(labels(filterRows(rows, { ...NO_FILTERS, platformIds: [2, 3] }))).toEqual(['Celeste/Switch'])
    expect(labels(filterRows(rows, { ...NO_FILTERS, platformIds: [1, 3] }))).toEqual([
      'Celeste/Switch',
      'Celeste/Steam',
      'Hades/Steam',
    ])
  })

  it('filters by status per entry, not per game', () => {
    expect(labels(filterRows(rows, { ...NO_FILTERS, statuses: ['FINISHED'] }))).toEqual(['Celeste/Switch'])
  })

  it('matches a row with any of several chosen statuses', () => {
    expect(labels(filterRows(rows, { ...NO_FILTERS, statuses: ['FINISHED', 'PLAYING'] }))).toEqual([
      'Celeste/Switch',
      'Hades/Steam',
    ])
  })

  it('filters by one series, or by having no series', () => {
    expect(labels(filterRows(rows, { ...NO_FILTERS, series: { name: 'Hades' } }))).toEqual(['Hades/Steam'])
    expect(labels(filterRows(rows, { ...NO_FILTERS, series: { name: 'Portal' } }))).toEqual(['Portal/none'])
    expect(labels(filterRows(rows, { ...NO_FILTERS, series: 'none' }))).toEqual(['Celeste/Switch', 'Celeste/Steam'])
  })

  it('combines different filters so a row must match all of them', () => {
    expect(
      labels(filterRows(rows, { search: 'e', platformIds: [1, 3], statuses: ['PLAYING', 'FINISHED'], series: 'all' })),
    ).toEqual(['Celeste/Switch', 'Hades/Steam'])
    expect(
      labels(filterRows(rows, { search: 'e', platformIds: [1, 3], statuses: ['PLAYING', 'FINISHED'], series: 'none' })),
    ).toEqual(['Celeste/Switch'])
    expect(filterRows(rows, { search: 'celeste', platformIds: [1], statuses: ['PLAYING'], series: 'all' })).toEqual([])
  })

  it('still finds a game without entries by search alone', () => {
    expect(labels(filterRows(rows, { ...NO_FILTERS, search: 'portal' }))).toEqual(['Portal/none'])
  })
})

describe('seriesOptions', () => {
  it('lists each series once, sorted without regard to case, leaving out games with none', () => {
    const games = sampleGames()
    games.push({ ...games[1], id: 4, name: 'Hades II', entries: [] })
    games.push({ ...games[1], id: 5, name: 'Half-Life', series: 'half-life', entries: [] })

    expect(seriesOptions(games)).toEqual(['Hades', 'half-life', 'Portal'])
  })
})

describe('isFiltering', () => {
  it('is true as soon as any one filter is set', () => {
    expect(isFiltering(NO_FILTERS)).toBe(false)
    expect(isFiltering({ ...NO_FILTERS, search: 'a' })).toBe(true)
    expect(isFiltering({ ...NO_FILTERS, platformIds: [1] })).toBe(true)
    expect(isFiltering({ ...NO_FILTERS, statuses: ['DROPPED'] })).toBe(true)
    expect(isFiltering({ ...NO_FILTERS, series: 'none' })).toBe(true)
  })
})

describe('sortRows', () => {
  const rows = toRows(sampleGames())

  it('sorts by name and breaks ties by platform', () => {
    expect(labels(sortRows(rows, { column: 'name', direction: 'asc' }))).toEqual([
      'Celeste/Steam',
      'Celeste/Switch',
      'Hades/Steam',
      'Portal/none',
    ])
    expect(labels(sortRows(rows, { column: 'name', direction: 'desc' }))).toEqual([
      'Portal/none',
      'Hades/Steam',
      'Celeste/Steam',
      'Celeste/Switch',
    ])
  })

  it('ignores case when sorting names', () => {
    const games = sampleGames()
    games[1].name = 'apex'

    expect(labels(sortRows(toRows(games), { column: 'name', direction: 'asc' }))[0]).toBe('apex/Steam')
  })

  it('sorts playtime numerically with entry-less rows last in both directions', () => {
    expect(labels(sortRows(rows, { column: 'playtime', direction: 'asc' }))).toEqual([
      'Celeste/Steam',
      'Celeste/Switch',
      'Hades/Steam',
      'Portal/none',
    ])
    expect(labels(sortRows(rows, { column: 'playtime', direction: 'desc' }))).toEqual([
      'Hades/Steam',
      'Celeste/Switch',
      'Celeste/Steam',
      'Portal/none',
    ])
  })

  it('sorts rating with unrated games last in both directions', () => {
    expect(labels(sortRows(rows, { column: 'rating', direction: 'desc' }))).toEqual([
      'Hades/Steam',
      'Celeste/Steam',
      'Celeste/Switch',
      'Portal/none',
    ])
    expect(labels(sortRows(rows, { column: 'rating', direction: 'asc' })).at(-1)).toBe('Portal/none')
  })

  it('sorts status in backlog order rather than alphabetically', () => {
    // Backlog order: Not Started, Playing, Finished. Alphabetical would put Finished first.
    expect(labels(sortRows(rows, { column: 'status', direction: 'asc' }))).toEqual([
      'Celeste/Steam',
      'Hades/Steam',
      'Celeste/Switch',
      'Portal/none',
    ])
  })

  it('does not change the array it was given', () => {
    const before = labels(rows)

    sortRows(rows, { column: 'playtime', direction: 'desc' })

    expect(labels(rows)).toEqual(before)
  })
})

describe('formatPlaytime', () => {
  it('shows hours and minutes, or only minutes under an hour', () => {
    expect(formatPlaytime(0)).toBe('0m')
    expect(formatPlaytime(45)).toBe('45m')
    expect(formatPlaytime(60)).toBe('1h 0m')
    expect(formatPlaytime(615)).toBe('10h 15m')
  })
})
