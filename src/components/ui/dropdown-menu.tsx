import * as M from '@radix-ui/react-dropdown-menu';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;
export const DropdownMenuContent = forwardRef<ElementRef<typeof M.Content>, ComponentPropsWithoutRef<typeof M.Content>>(({ className, sideOffset = 6, ...p }, ref) => (
  <M.Portal>
    <M.Content ref={ref} sideOffset={sideOffset} className={cn('z-50 min-w-[200px] rounded-md border border-border bg-surface-card p-1 text-ink shadow-overlay', className)} {...p} />
  </M.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';
export const DropdownMenuItem = forwardRef<ElementRef<typeof M.Item>, ComponentPropsWithoutRef<typeof M.Item>>(({ className, ...p }, ref) => (
  <M.Item
    ref={ref}
    className={cn('flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-label outline-none data-[highlighted]:bg-surface-sunken data-[disabled]:opacity-50 [&_svg]:size-4', className)}
    {...p}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';
export const DropdownMenuSeparator = () => <M.Separator className="my-1 h-px bg-border" />;
export const DropdownMenuLabel = ({ className, ...p }: ComponentPropsWithoutRef<typeof M.Label>) => <M.Label className={cn('px-3 py-2 text-body-sm text-ink-muted', className)} {...p} />;
