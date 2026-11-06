import * as P from '@radix-ui/react-popover';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverContent = forwardRef<ElementRef<typeof P.Content>, ComponentPropsWithoutRef<typeof P.Content>>(({ className, align = 'end', sideOffset = 6, ...p }, ref) => (
  <P.Portal>
    <P.Content ref={ref} align={align} sideOffset={sideOffset} className={cn('z-50 w-[min(360px,calc(100vw-32px))] rounded-md border border-border bg-surface-card text-ink shadow-overlay outline-none', className)} {...p} />
  </P.Portal>
));
PopoverContent.displayName = 'PopoverContent';
