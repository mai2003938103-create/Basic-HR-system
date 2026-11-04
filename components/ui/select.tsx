import * as S from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';
import { fieldClass } from './input';

export const Select = S.Root;
export const SelectValue = S.Value;
export const SelectTrigger = forwardRef<ElementRef<typeof S.Trigger>, ComponentPropsWithoutRef<typeof S.Trigger>>(({ className, children, ...p }, ref) => (
  <S.Trigger ref={ref} className={cn(fieldClass, 'flex h-10 items-center justify-between gap-2 text-left data-[placeholder]:text-ink-muted [&>span]:truncate', className)} {...p}>
    {children}
    <S.Icon asChild>
      <ChevronDown className="size-4 shrink-0 text-ink-muted" />
    </S.Icon>
  </S.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';
export const SelectContent = forwardRef<ElementRef<typeof S.Content>, ComponentPropsWithoutRef<typeof S.Content>>(({ className, children, position = 'popper', ...p }, ref) => (
  <S.Portal>
    <S.Content
      ref={ref}
      position={position}
      sideOffset={4}
      className={cn('z-50 max-h-[min(320px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-surface-card text-ink shadow-overlay', className)}
      {...p}
    >
      <S.Viewport className="p-1">{children}</S.Viewport>
    </S.Content>
  </S.Portal>
));
SelectContent.displayName = 'SelectContent';
export const SelectItem = forwardRef<ElementRef<typeof S.Item>, ComponentPropsWithoutRef<typeof S.Item>>(({ className, children, ...p }, ref) => (
  <S.Item ref={ref} className={cn('relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-body outline-none data-[highlighted]:bg-surface-sunken data-[disabled]:opacity-50', className)} {...p}>
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <S.ItemIndicator>
        <Check className="size-4 text-primary-hover" />
      </S.ItemIndicator>
    </span>
    <S.ItemText>{children}</S.ItemText>
  </S.Item>
));
SelectItem.displayName = 'SelectItem';
