'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';

const toastVariants = {
  default: 'border-gray-800 bg-surface text-white',
  destructive: 'border-red-800 bg-red-900/30 text-red-300',
};

function ToastProvider({ ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Provider>) {
  return <ToastPrimitive.Provider {...props} />;
}
function ToastViewport({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>) {
  return <ToastPrimitive.Viewport className={cn('fixed top-4 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-0 sm:right-0 sm:flex-col md:max-w-sm', className)} {...props} />;
}
function Toast({ className, variant = 'default', ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { variant?: keyof typeof toastVariants }) {
  return <ToastPrimitive.Root className={cn('pointer-events-auto grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm shadow-lg', toastVariants[variant], className)} {...props} />;
}
function ToastAction({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>) {
  return <ToastPrimitive.Action className={cn('grid flex-1 justify-center font-medium text-cyan focus:outline-none', className)} {...props} />;
}
function ToastClose({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close className={cn('rounded-md p-1 text-gray-400 opacity-70 transition-opacity hover:text-white focus:outline-none', className)} {...props}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    </ToastPrimitive.Close>
  );
}
function ToastTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title className={cn('text-sm font-semibold text-white', className)} {...props} />;
}
function ToastDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>) {
  return <ToastPrimitive.Description className={cn('mt-1 text-sm text-gray-400', className)} {...props} />;
}

export { Toast, ToastAction, ToastClose, ToastTitle, ToastDescription, ToastProvider, ToastViewport, toastVariants };
