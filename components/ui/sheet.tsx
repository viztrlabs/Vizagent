'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

function Sheet({ ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />;
}
function SheetTrigger({ ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />;
}
function SheetContent({ side = 'right', className, children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: 'top' | 'right' | 'bottom' | 'left' }) {
  const sideClasses: Record<string, string> = {
    top: 'inset-x-0 top-0 m-0 w-auto max-w-none rounded-b-lg border-l-0 border-t-0',
    right: 'inset-y-0 right-0 h-screen w-full max-w-sm rounded-l-lg border-t-0',
    bottom: 'inset-x-0 bottom-0 m-0 w-auto max-w-none rounded-t-lg border-b-0',
    left: 'inset-y-0 left-0 h-screen w-full max-w-sm rounded-r-lg border-t-0',
  };
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content className={cn('fixed z-50 grid w-full max-w-md touch-x-remove border-l border-gray-800 bg-surface p-6 shadow-lg', sideClasses[side], className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1 mb-4', className)} {...props} />;
}
function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)} {...props} />;
}
function SheetTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold text-white', className)} {...props} />;
}
function SheetDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm text-gray-400', className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
