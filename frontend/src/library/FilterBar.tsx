import { BACKLOG_STATUSES } from '../api/types'
import type { BacklogStatus, Platform } from '../api/types'
import { NO_FILTERS, STATUS_LABELS } from './rows'
import type { Filters } from './rows'

interface FilterBarProps {
  filters: Filters
  platforms: Platform[]
  onChange: (filters: Filters) => void
}

const fieldClass = 'rounded border border-slate-300 bg-white px-2 py-1.5 text-sm'

export function FilterBar({ filters, platforms, onChange }: FilterBarProps) {
  const isFiltering = filters.search !== '' || filters.platformId !== null || filters.status !== null

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Search
        <input
          type="search"
          className={`${fieldClass} w-56`}
          placeholder="Name or series"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Platform
        <select
          className={fieldClass}
          value={filters.platformId ?? ''}
          onChange={(event) =>
            onChange({ ...filters, platformId: event.target.value === '' ? null : Number(event.target.value) })
          }
        >
          <option value="">All platforms</option>
          {platforms.map((platform) => (
            <option key={platform.id} value={platform.id}>
              {platform.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Status
        <select
          className={fieldClass}
          value={filters.status ?? ''}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value === '' ? null : (event.target.value as BacklogStatus) })
          }
        >
          <option value="">All statuses</option>
          {BACKLOG_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      {isFiltering && (
        <button
          type="button"
          className="rounded px-2 py-1.5 text-sm text-slate-700 underline hover:text-slate-900"
          onClick={() => onChange(NO_FILTERS)}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
