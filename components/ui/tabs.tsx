import * as T from '@radix-ui/react-tabs';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = T.Root;
export const TabsList = forwardRef<ElementRef<typeof T.List>, ComponentPropsWithoutRef<typeof T.List>>(({ className, ...p }, ref) => (
  <T.List ref={ref} className={cn('flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border', className)} {...p} />
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
  // Our panels always hold their own buttons and fields, so the panel itself is not a tab stop
  // (tabIndex -1) and never shows a focus ring around the whole content.
  <T.Content ref={ref} tabIndex={-1} className={cn('pt-6 focus:outline-none', className)} {...p} />
));
TabsContent.displayName = 'TabsContent';
