'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

function DropdownMenu({ ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root {...props} />;
}
function DropdownMenuTrigger({ ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger {...props} />;
}
function DropdownMenuContent({ className, sideOffset = 4, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content sideOffset={sideOffset} className={cn('z-50 min-w-32 overflow-hidden rounded-md border border-gray-800 bg-surface text-white p-1 shadow-lg', className)} {...props} />
    </DropdownMenuPrimitive.Portal>
  );
}
function DropdownMenuItem({ className, inset, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }) {
  return <DropdownMenuPrimitive.Item className={cn('relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 outline-none focus:bg-gray-800/50', inset && 'pl-8', className)} {...props} />;
}
function DropdownMenuCheckboxItem({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem className={cn('relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 outline-none focus:bg-gray-800/50', className)} {...props}>
      <span className="mr-2 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator><Check className="h-4 w-4" /></DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}
function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
  return <DropdownMenuPrimitive.Label className={cn('px-2 py-1.5 text-sm font-semibold text-gray-400', className)} {...props} />;
}
function DropdownMenuSeparator({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-gray-800', className)} {...props} />;
}
function DropdownMenuGroup(props: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group {...props} />;
}
function DropdownMenuSub({ ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub {...props} />;
}
function DropdownMenuSubTrigger({ className, label, children, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { label?: string }) {
  return (
    <DropdownMenuPrimitive.SubTrigger className={cn('flex cursor-default select-none items-center rounded px-2 py-1.5 outline-none focus:bg-gray-800/50', className)} {...props}>
      <ChevronRight className="mr-2 h-4 w-4" />
      {label}
      {children}
    </DropdownMenuPrimitive.SubTrigger>
  );
}
function DropdownMenuSubContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>) {
  return <DropdownMenuPrimitive.SubContent className={cn('z-50 min-w-32 overflow-hidden rounded-md border border-gray-800 bg-surface text-white p-1 shadow-lg', className)} {...props} />;
}
const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
);

export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
};
