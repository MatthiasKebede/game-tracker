import { ApiError } from '../api/client'

export interface FormErrors {
  // Message for the form as a whole, or null.
  form: string | null
  // Messages per request field, from the server's validation response.
  fields: Record<string, string>
}

export const NO_ERRORS: FormErrors = { form: null, fields: {} }

export function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Something went wrong.'
}

/** Splits a failed save into per-field messages and a form-level message. */
export function toFormErrors(cause: unknown): FormErrors {
  if (cause instanceof ApiError && Object.keys(cause.fieldErrors).length > 0) {
    return { form: null, fields: cause.fieldErrors }
  }
  return { form: messageOf(cause), fields: {} }
}
