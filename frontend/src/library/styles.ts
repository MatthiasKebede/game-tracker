// Tailwind class lists shared by the dialogs and the page.

const buttonBase = 'rounded px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60'

export const primaryButton = `${buttonBase} bg-accent text-accent-fg hover:bg-accent-hover`

export const secondaryButton = `${buttonBase} border border-line bg-panel text-fg hover:bg-hover`

export const dangerButton = `${buttonBase} border border-danger-line bg-panel text-danger hover:bg-danger-bg`

export const inputClass =
  'w-full rounded border border-line bg-field px-2 py-1.5 text-sm aria-[invalid=true]:border-danger'
