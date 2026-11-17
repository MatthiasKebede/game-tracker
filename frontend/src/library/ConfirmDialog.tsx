import { useState } from 'react'
import { Dialog, FormError } from './Dialog'
import { messageOf } from './formErrors'
import { dangerButton, secondaryButton } from './styles'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  // The destructive action. If it fails, the error is shown and the dialog stays open.
  onConfirm: () => Promise<void>
  onClose: () => void
  onDone: () => void
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose, onDone }: ConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  async function handleConfirm() {
    setWorking(true)
    setError(null)
    try {
      await onConfirm()
    } catch (cause) {
      setError(messageOf(cause))
      setWorking(false)
      return
    }
    onDone()
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="mt-4 flex flex-col gap-4">
        <FormError message={error} />
        <p className="text-sm text-fg">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryButton} disabled={working} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={dangerButton} disabled={working} onClick={() => void handleConfirm()}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
