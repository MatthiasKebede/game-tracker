import type { BacklogStatus, Entry, Game, Platform } from '../api/types'

// Sample data shared by tests. Platform ids match the order of the seed migration.
export const PLATFORMS: Platform[] = [
  { id: 1, name: 'Steam' },
  { id: 2, name: 'Xbox' },
  { id: 3, name: 'Switch' },
]

let nextEntryId = 100

export function entry(gameId: number, platform: Platform, status: BacklogStatus, playtimeMinutes: number): Entry {
  return {
    id: nextEntryId++,
    gameId,
    platformId: platform.id,
    platformName: platform.name,
    playtimeMinutes,
    status,
    playtimeSource: 'MANUAL',
  }
}

const [steam, , nintendoSwitch] = PLATFORMS

/** Celeste on two platforms, Hades on one, Portal with no entries and no rating. */
export function sampleGames(): Game[] {
  return [
    {
      id: 1,
      name: 'Celeste',
      series: null,
      rating: 8,
      coverImageUrl: null,
      entries: [entry(1, nintendoSwitch, 'FINISHED', 600), entry(1, steam, 'NOT_STARTED', 0)],
    },
    {
      id: 2,
      name: 'Hades',
      series: 'Hades',
      rating: 9,
      coverImageUrl: null,
      entries: [entry(2, steam, 'PLAYING', 1935)],
    },
    { id: 3, name: 'Portal', series: 'Portal', rating: null, coverImageUrl: null, entries: [] },
  ]
}
