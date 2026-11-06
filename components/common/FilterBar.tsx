import { SlidersHorizontal } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

/**
 * List filters. From 768px they sit in one wrapping row; on phones they fold behind one
 * "Filters" button (showing how many are active) so the list starts on the first screen.
 */
export function FilterBar({ children, activeCount = 0, className }: { children: ReactNode; activeCount?: number; className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={cn('p-4', className)}>
      <Button variant="outline" size="sm" className="md:hidden" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <SlidersHorizontal />
        {t('common.filters')}
        {activeCount > 0 && <span className="tabular grid min-w-5 place-items-center rounded-pill bg-primary px-1.5 text-caption text-on-primary">{activeCount}</span>}
      </Button>
      <div id={id} className={cn('grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:flex md:flex-wrap md:items-end', open ? 'mt-3 md:mt-0' : 'hidden md:flex')}>
        {children}
      </div>
    </div>
  );
}
