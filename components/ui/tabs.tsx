import * as T from '@radix-ui/react-tabs';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = T.Root;
export const TabsList = forwardRef<ElementRef<typeof T.List>, ComponentPropsWithoutRef<typeof T.List>>(({ className, ...p }, ref) => (
  <T.List ref={ref} className={cn('flex gap-1 overflow-x-auto border-b border-border', className)} {...p} />
));
TabsList.displayName = 'TabsList';
export const TabsTrigger = forwardRef<ElementRef<typeof T.Trigger>, ComponentPropsWithoutRef<typeof T.Trigger>>(({ className, ...p }, ref) => (
  <T.Trigger
    ref={ref}
    className={cn('-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-label text-ink-muted hover:text-ink data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-primary-hover', className)}
    {...p}
  />
));
TabsTrigger.displayName = 'TabsTrigger';
export const TabsContent = forwardRef<ElementRef<typeof T.Content>, ComponentPropsWithoutRef<typeof T.Content>>(({ className, ...p }, ref) => (
  <T.Content ref={ref} className={cn('pt-6 focus-visible:outline-none', className)} {...p} />
));
TabsContent.displayName = 'TabsContent';
