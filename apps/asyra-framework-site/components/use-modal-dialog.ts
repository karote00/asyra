'use client'

import { useRef } from 'react'

export function useModalDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const openDialog = () => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return

    dialog.showModal()
  }

  const closeDialog = () => {
    const dialog = dialogRef.current
    if (!dialog?.open) return

    dialog.close()
  }

  const handleDialogClose = () => {
    triggerRef.current?.focus()
  }

  return {
    closeDialog,
    dialogRef,
    handleDialogClose,
    openDialog,
    triggerRef
  }
}
