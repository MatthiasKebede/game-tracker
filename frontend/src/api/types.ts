// Shapes of the JSON the backend sends and accepts. They mirror the response
// and request records in backend/src/main/java/.../gametracker.

export const BACKLOG_STATUSES = ['NOT_STARTED', 'PLAYING', 'FINISHED', 'COMPLETED', 'DROPPED'] as const

export type BacklogStatus = (typeof BACKLOG_STATUSES)[number]

export type PlaytimeSource = 'MANUAL' | 'STEAM'

export interface Platform {
  id: number
  name: string
}

export interface Entry {
  id: number
  gameId: number
  platformId: number
  platformName: string
  playtimeMinutes: number
  status: BacklogStatus
  playtimeSource: PlaytimeSource
}

export interface Game {
  id: number
  name: string
  series: string | null
  rating: number | null
  coverImageUrl: string | null
  entries: Entry[]
}

export interface GameInput {
  name: string
  series: string | null
  rating: number | null
}

export interface EntryCreateInput {
  platformId: number
  status: BacklogStatus
  playtimeMinutes: number
}

export interface EntryUpdateInput {
  status: BacklogStatus
  playtimeMinutes: number
}
