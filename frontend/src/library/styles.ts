// Tailwind class lists shared by the dialogs and the page.

const buttonBase = 'rounded px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60'

export const primaryButton = `${buttonBase} bg-slate-800 text-white hover:bg-slate-700`

export const secondaryButton = `${buttonBase} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`

export const dangerButton = `${buttonBase} border border-red-300 bg-white text-red-700 hover:bg-red-50`

export const inputClass =
  'w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm aria-[invalid=true]:border-red-500'
