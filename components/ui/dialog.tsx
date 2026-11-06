import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export const DialogContent = forwardRef<ElementRef<typeof D.Content>, ComponentPropsWithoutRef<typeof D.Content> & { wide?: boolean }>(
  ({ className, children, wide, ...props }, ref) => {
    const { t } = useTranslation();
    return (
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <D.Content
          ref={ref}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-md bg-surface-card text-ink shadow-overlay focus:outline-none',
            wide ? 'max-w-2xl' : 'max-w-md',
            className,
          )}
          {...props}
        >
          {children}
          <D.Close className="absolute right-3 top-3 rounded-pill p-2 text-ink-muted hover:bg-surface-sunken hover:text-ink" aria-label={t('common.close')}>
            <X className="size-4" />
          </D.Close>
        </D.Content>
      </D.Portal>
    );
  },
);
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn('px-6 pb-2 pt-6 pr-12', className)} {...p} />;
export const DialogBody = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn('overflow-y-auto px-6 py-2', className)} {...p} />;
export const DialogFooter = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end', className)} {...p} />
);
export const DialogTitle = forwardRef<ElementRef<typeof D.Title>, ComponentPropsWithoutRef<typeof D.Title>>(({ className, ...p }, ref) => (
  <D.Title ref={ref} className={cn('text-section-title', className)} {...p} />
));
DialogTitle.displayName = 'DialogTitle';
export const DialogDescription = forwardRef<ElementRef<typeof D.Description>, ComponentPropsWithoutRef<typeof D.Description>>(({ className, ...p }, ref) => (
  <D.Description ref={ref} className={cn('mt-1 text-body-sm text-ink-muted', className)} {...p} />
));
DialogDescription.displayName = 'DialogDescription';

/** Side drawer (mobile navigation). */
export const SheetContent = forwardRef<ElementRef<typeof D.Content>, ComponentPropsWithoutRef<typeof D.Content>>(({ className, children, ...props }, ref) => (
  <D.Portal>
    <D.Overlay className="fixed inset-0 z-50 bg-black/40" />
    <D.Content ref={ref} className={cn('fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-overlay focus:outline-none', className)} {...props}>
      {children}
    </D.Content>
  </D.Portal>
));
SheetContent.displayName = 'SheetContent';
