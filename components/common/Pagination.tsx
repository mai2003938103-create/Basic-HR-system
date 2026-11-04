import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

export function Pagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (p: number) => void }) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="pagination" className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-body-sm text-ink-muted">
      <span className="tabular">{t('common.showing', { from, to, total })}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="iconSm" aria-label={t('common.previous')} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft />
        </Button>
        <span className="tabular px-2">{page} / {pages}</span>
        <Button variant="outline" size="iconSm" aria-label={t('common.next')} disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
