'use client'

import { useToast } from './use-toast'

export function Toaster() {
  // The actual toast rendering is handled by the ToastProvider
  // This component is just a placeholder to include in the layout
  useToast()
  return null
}