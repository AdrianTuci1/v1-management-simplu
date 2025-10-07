import * as DialogPrimitive from '@radix-ui/react-dialog'
import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export const SheetContent = forwardRef(({ side = 'right', className, ...props }, ref) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-50 bg-white p-4 shadow-lg focus:outline-none',
          side === 'right' && 'inset-y-0 right-0 w-[400px] border-l',
          side === 'left' && 'inset-y-0 left-0 w-[400px] border-r',
          side === 'top' && 'inset-x-0 top-0 h-[400px] border-b',
          side === 'bottom' && 'inset-x-0 bottom-0 h-[400px] border-t',
          className
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  )
})

SheetContent.displayName = 'SheetContent'

export const SheetHeader = ({ className, ...props }) => (
  <div className={cn('mb-4 space-y-1', className)} {...props} />
)

export const SheetTitle = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
))

SheetTitle.displayName = 'SheetTitle'

export const SheetDescription = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-slate-600', className)} {...props} />
))

SheetDescription.displayName = 'SheetDescription'
