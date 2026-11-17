import type { BacklogStatus } from '../api/types'

/** Form state for the per-platform part of an entry. Inputs hold text, so hours and minutes are strings. */
export interface EntryValues {
  status: BacklogStatus
  hours: string
  minutes: string
}

export const NEW_ENTRY_VALUES: EntryValues = { status: 'NOT_STARTED', hours: '', minutes: '' }

/** The API stores playtime as minutes. An empty box counts as zero. */
export function toPlaytimeMinutes(values: EntryValues): number {
  return (Number(values.hours) || 0) * 60 + (Number(values.minutes) || 0)
}

export function fromPlaytimeMinutes(status: BacklogStatus, playtimeMinutes: number): EntryValues {
  return { status, hours: String(Math.floor(playtimeMinutes / 60)), minutes: String(playtimeMinutes % 60) }
}
