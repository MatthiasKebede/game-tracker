import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface DialogProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * A modal built on the native <dialog> element, which provides the backdrop,
 * focus trapping, and closing with Escape. The parent renders this component
 * only while the dialog should be open, so mounting it opens it.
 */
export function Dialog({ title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    // The "open" check matters in development, where React runs effects twice.
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Fires when the browser closes the dialog, for example on Escape.
      onClose={onClose}
      // m-auto restores the centering that Tailwind's CSS reset removes.
      className="m-auto w-full max-w-md rounded-lg p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="p-5">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}

interface FieldProps {
  label: string
  error?: string
  // Receives the attributes that connect the input to its label and error message.
  children: (inputProps: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => ReactNode
}

/** A labelled form field with room for a validation message from the server. */
export function Field({ label, error, children }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children({ id, 'aria-invalid': error !== undefined, 'aria-describedby': error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

/** A message about the whole form, such as a 409 conflict. */
export function FormError({ message }: { message: string | null }) {
  if (message === null) {
    return null
  }
  return (
    <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  )
}
