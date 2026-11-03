import * as C from '@radix-ui/react-checkbox';
import * as Sw from '@radix-ui/react-switch';
import { Check } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

export const Checkbox = forwardRef<ElementRef<typeof C.Root>, ComponentPropsWithoutRef<typeof C.Root>>(({ className, ...p }, ref) => (
  <C.Root
    ref={ref}
    className={cn('flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-border-strong bg-surface-card data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-on-primary disabled:opacity-50', className)}
    {...p}
  >
    <C.Indicator>
      <Check className="size-3.5" strokeWidth={3} />
    </C.Indicator>
  </C.Root>
));
Checkbox.displayName = 'Checkbox';

export const Switch = forwardRef<ElementRef<typeof Sw.Root>, ComponentPropsWithoutRef<typeof Sw.Root>>(({ className, ...p }, ref) => (
  <Sw.Root ref={ref} className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border border-border-strong bg-surface-sunken transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary disabled:opacity-50', className)} {...p}>
    <Sw.Thumb className="block size-[18px] translate-x-[2px] rounded-pill bg-surface-card shadow transition-transform data-[state=checked]:translate-x-[22px]" />
  </Sw.Root>
));
Switch.displayName = 'Switch';
