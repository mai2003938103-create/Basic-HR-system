import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-surface-sunken', className)} />;
}

export function LoadingState({ rows = 4, fullPage = false }: { rows?: number; fullPage?: boolean }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col gap-3 p-6', fullPage && 'min-h-[60vh] justify-center')}>
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
