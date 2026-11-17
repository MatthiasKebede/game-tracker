import { BACKLOG_STATUSES } from '../api/types'
import type { Platform } from '../api/types'
import { isFiltering, NO_FILTERS, STATUS_LABELS } from './rows'
import type { Filters, SeriesFilter } from './rows'

interface FilterBarProps {
  filters: Filters
  platforms: Platform[]
  // The distinct series in the library, already sorted.
  series: string[]
  onChange: (filters: Filters) => void
}

const fieldClass = 'rounded border border-slate-300 bg-white px-2 py-1.5 text-sm'

const labelClass = 'text-sm font-medium text-slate-700'

// The series dropdown needs plain strings as option values. A prefix keeps a
// series that happens to be called "all" or "none" apart from those two choices.
const NAMED = 'name:'

const seriesToValue = (series: SeriesFilter) => (typeof series === 'object' ? NAMED + series.name : series)

function valueToSeries(value: string): SeriesFilter {
  if (value.startsWith(NAMED)) {
    return { name: value.slice(NAMED.length) }
  }
  return value === 'none' ? 'none' : 'all'
}

// Adds the value if it is missing and removes it if it is present.
function toggled<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((existing) => existing !== value) : [...values, value]
}

interface ChipGroupProps<T> {
  label: string
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (selected: T[]) => void
}

/** A row of on/off buttons. Any number can be on at once; none on means "all". */
function ChipGroup<T extends string | number>({ label, options, selected, onChange }: ChipGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={labelClass}>{label}</legend>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const pressed = selected.includes(option.value)
          return (
            // aria-pressed tells screen readers this button is a toggle and whether it is on.
            <button
              key={option.value}
              type="button"
              aria-pressed={pressed}
              className={`rounded-full border px-3 py-1 text-sm ${
                pressed
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
              onClick={() => onChange(toggled(selected, option.value))}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function FilterBar({ filters, platforms, series, onChange }: FilterBarProps) {
  // Keep the chosen series selectable even if its last game was just deleted.
  const selectedName = typeof filters.series === 'object' ? filters.series.name : null
  const seriesNames = selectedName !== null && !series.includes(selectedName) ? [selectedName, ...series] : series

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className={`flex flex-col gap-1 ${labelClass}`}>
          Search
          <input
            type="search"
            className={`${fieldClass} w-56`}
            placeholder="Name or series"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </label>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          Series
          <select
            className={`${fieldClass} max-w-64`}
            value={seriesToValue(filters.series)}
            onChange={(event) => onChange({ ...filters, series: valueToSeries(event.target.value) })}
          >
            <option value="all">All series</option>
            <option value="none">No series</option>
            {seriesNames.map((name) => (
              <option key={name} value={NAMED + name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        {isFiltering(filters) && (
          <button
            type="button"
            className="rounded px-2 py-1.5 text-sm text-slate-700 underline hover:text-slate-900"
            onClick={() => onChange(NO_FILTERS)}
          >
            Clear filters
          </button>
        )}
      </div>

      <ChipGroup
        label="Platform"
        options={platforms.map((platform) => ({ value: platform.id, label: platform.name }))}
        selected={filters.platformIds}
        onChange={(platformIds) => onChange({ ...filters, platformIds })}
      />

      <ChipGroup
        label="Status"
        options={BACKLOG_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))}
        selected={filters.statuses}
        onChange={(statuses) => onChange({ ...filters, statuses })}
      />
    </div>
  )
}
