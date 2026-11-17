import { useState } from 'react'
import type { FormEvent } from 'react'
import { addEntry, createGame, updateGame } from '../api/client'
import type { Game, GameInput, Platform } from '../api/types'
import { Dialog, Field, FormError } from './Dialog'
import { EntryFields } from './EntryFields'
import { NEW_ENTRY_VALUES, toPlaytimeMinutes } from './entryValues'
import type { EntryValues } from './entryValues'
import { messageOf, NO_ERRORS, toFormErrors } from './formErrors'
import type { FormErrors } from './formErrors'
import { dangerButton, inputClass, primaryButton, secondaryButton } from './styles'

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface GameDialogProps {
  // The game to edit, or null to add a new one.
  game: Game | null
  platforms: Platform[]
  onClose: () => void
  // Called after a successful save. A notice is passed when part of the save failed.
  onSaved: (notice?: string) => void
  // Called when "Delete game" is chosen while editing.
  onDelete?: () => void
}

export function GameDialog({ game, platforms, onClose, onSaved, onDelete }: GameDialogProps) {
  const [name, setName] = useState(game?.name ?? '')
  const [series, setSeries] = useState(game?.series ?? '')
  const [rating, setRating] = useState(game?.rating?.toString() ?? '')
  // Only used when adding: an optional first platform entry.
  const [platformId, setPlatformId] = useState('')
  const [entryValues, setEntryValues] = useState<EntryValues>(NEW_ENTRY_VALUES)
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors(NO_ERRORS)

    const input: GameInput = {
      name,
      series: series.trim() === '' ? null : series,
      rating: rating === '' ? null : Number(rating),
    }
    let saved: Game
    try {
      saved = game ? await updateGame(game.id, input) : await createGame(input)
    } catch (cause) {
      setErrors(toFormErrors(cause))
      setSaving(false)
      return
    }

    if (!game && platformId !== '') {
      try {
        await addEntry(saved.id, {
          platformId: Number(platformId),
          status: entryValues.status,
          playtimeMinutes: toPlaytimeMinutes(entryValues),
        })
      } catch (cause) {
        // The game now exists, so retrying this form would create it twice. Close and report instead.
        onSaved(`"${saved.name}" was added, but its platform entry was not: ${messageOf(cause)}`)
        return
      }
    }
    onSaved()
  }

  return (
    <Dialog title={game ? 'Edit game' : 'Add game'} onClose={onClose}>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 flex flex-col gap-4">
        <FormError message={errors.form} />

        <Field label="Name" error={errors.fields.name}>
          {(inputProps) => (
            <input
              {...inputProps}
              type="text"
              required
              maxLength={255}
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>

        <Field label="Series" error={errors.fields.series}>
          {(inputProps) => (
            <input
              {...inputProps}
              type="text"
              maxLength={255}
              className={inputClass}
              value={series}
              onChange={(event) => setSeries(event.target.value)}
            />
          )}
        </Field>

        <Field label="Rating" error={errors.fields.rating}>
          {(inputProps) => (
            <select {...inputProps} className={inputClass} value={rating} onChange={(event) => setRating(event.target.value)}>
              <option value="">Unrated</option>
              {RATINGS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          )}
        </Field>

        {!game && (
          <>
            <Field label="Platform">
              {(inputProps) => (
                <select
                  {...inputProps}
                  className={inputClass}
                  value={platformId}
                  onChange={(event) => setPlatformId(event.target.value)}
                >
                  <option value="">None yet</option>
                  {platforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            {platformId !== '' && <EntryFields values={entryValues} errors={{}} onChange={setEntryValues} />}
          </>
        )}

        <div className="mt-2 flex items-center gap-2">
          {game && onDelete && (
            <button type="button" className={dangerButton} disabled={saving} onClick={onDelete}>
              Delete game
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
