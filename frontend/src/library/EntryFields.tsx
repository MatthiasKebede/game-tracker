import { BACKLOG_STATUSES } from '../api/types'
import type { BacklogStatus } from '../api/types'
import { Field } from './Dialog'
import type { EntryValues } from './entryValues'
import { STATUS_LABELS } from './rows'
import { inputClass } from './styles'

interface EntryFieldsProps {
  values: EntryValues
  errors: Record<string, string>
  onChange: (values: EntryValues) => void
}

/** Status and playtime inputs, shared by the game and entry dialogs. */
export function EntryFields({ values, errors, onChange }: EntryFieldsProps) {
  return (
    <>
      <Field label="Status" error={errors.status}>
        {(inputProps) => (
          <select
            {...inputProps}
            className={inputClass}
            value={values.status}
            onChange={(event) => onChange({ ...values, status: event.target.value as BacklogStatus })}
          >
            {BACKLOG_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        )}
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-fg">Playtime</legend>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <Field label="Hours" error={errors.playtimeMinutes}>
            {(inputProps) => (
              <input
                {...inputProps}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className={inputClass}
                value={values.hours}
                onChange={(event) => onChange({ ...values, hours: event.target.value })}
              />
            )}
          </Field>
          <Field label="Minutes">
            {(inputProps) => (
              <input
                {...inputProps}
                type="number"
                min={0}
                max={59}
                step={1}
                inputMode="numeric"
                className={inputClass}
                value={values.minutes}
                onChange={(event) => onChange({ ...values, minutes: event.target.value })}
              />
            )}
          </Field>
        </div>
      </fieldset>
    </>
  )
}
