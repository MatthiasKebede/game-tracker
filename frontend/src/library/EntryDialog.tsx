import { useState } from 'react'
import type { FormEvent } from 'react'
import { addEntry, updateEntry } from '../api/client'
import type { Entry, Game, Platform } from '../api/types'
import { Dialog, Field, FormError } from './Dialog'
import { EntryFields } from './EntryFields'
import { fromPlaytimeMinutes, NEW_ENTRY_VALUES, toPlaytimeMinutes } from './entryValues'
import type { EntryValues } from './entryValues'
import { NO_ERRORS, toFormErrors } from './formErrors'
import type { FormErrors } from './formErrors'
import { dangerButton, inputClass, primaryButton, secondaryButton } from './styles'

interface EntryDialogProps {
  game: Game
  // The entry to edit, or null to add the game to another platform.
  entry: Entry | null
  platforms: Platform[]
  onClose: () => void
  onSaved: () => void
  // Called when "Remove" is chosen while editing.
  onDelete?: () => void
}

export function EntryDialog({ game, entry, platforms, onClose, onSaved, onDelete }: EntryDialogProps) {
  // A game can only be on each platform once, so only unused platforms are offered.
  const availablePlatforms = platforms.filter(
    (platform) => !game.entries.some((existing) => existing.platformId === platform.id),
  )
  const [platformId, setPlatformId] = useState(availablePlatforms[0]?.id.toString() ?? '')
  const [values, setValues] = useState<EntryValues>(
    entry ? fromPlaytimeMinutes(entry.status, entry.playtimeMinutes) : NEW_ENTRY_VALUES,
  )
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors(NO_ERRORS)
    const input = { status: values.status, playtimeMinutes: toPlaytimeMinutes(values) }
    try {
      if (entry) {
        await updateEntry(entry.id, input)
      } else {
        await addEntry(game.id, { platformId: Number(platformId), ...input })
      }
    } catch (cause) {
      setErrors(toFormErrors(cause))
      setSaving(false)
      return
    }
    onSaved()
  }

  if (!entry && availablePlatforms.length === 0) {
    return (
      <Dialog title={`Add ${game.name} to a platform`} onClose={onClose}>
        <p className="mt-4 text-sm text-fg">{game.name} is already on every platform.</p>
        <div className="mt-4 flex justify-end">
          <button type="button" className={secondaryButton} onClick={onClose}>
            Close
          </button>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog
      title={entry ? `Edit ${game.name} on ${entry.platformName}` : `Add ${game.name} to a platform`}
      onClose={onClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 flex flex-col gap-4">
        <FormError message={errors.form} />

        {!entry && (
          <Field label="Platform" error={errors.fields.platformId}>
            {(inputProps) => (
              <select
                {...inputProps}
                required
                className={inputClass}
                value={platformId}
                onChange={(event) => setPlatformId(event.target.value)}
              >
                {availablePlatforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}

        <EntryFields values={values} errors={errors.fields} onChange={setValues} />

        <div className="mt-2 flex items-center gap-2">
          {entry && onDelete && (
            <button type="button" className={dangerButton} disabled={saving} onClick={onDelete}>
              Remove
            </button>
          )}
          <span className="grow" />
          <button type="button" className={secondaryButton} disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButton} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
