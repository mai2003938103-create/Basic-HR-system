import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LoadingState } from './LoadingState';
import { EmptyState, ErrorState } from './EmptyState';
import { Pagination } from './Pagination';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { apiError } from '../../lib/api';

export interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

export interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  total: number;
  params: { page: number; pageSize: number; sort: string };
  onSortChange: (sort: string) => void;
  onPageChange: (page: number) => void;
  loading: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle: string;
  emptyAction?: ReactNode;
  mobileCard?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string }>(p: DataTableProps<T>) {
  const { t } = useTranslation();
  const [sortField, sortDir] = p.params.sort.split(':');
  // Below 768px a list with `mobileCard` renders stacked cards instead of the table (only one is mounted).
  const phone = useMediaQuery('(max-width: 767px)');
  const phoneCards = !!p.mobileCard && phone;

  if (p.loading && p.rows.length === 0) return <LoadingState rows={5} />;
  if (p.error) return <ErrorState onRetry={p.onRetry} message={apiError(p.error).messageKey} />;
  if (!p.loading && p.rows.length === 0) return <EmptyState title={p.emptyTitle} action={p.emptyAction} />;

  const toggle = (key: string) => p.onSortChange(sortField === key && sortDir === 'asc' ? `${key}:desc` : `${key}:asc`);

  return (
    <div aria-busy={p.loading || undefined}>
      {phoneCards && <ul className="divide-y divide-border">{p.rows.map((r) => <li key={r.id}>{p.mobileCard!(r)}</li>)}</ul>}
      {!phoneCards && <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-left text-body">
          <thead>
            <tr className="bg-surface-sunken">
              {p.columns.map((c) => {
                const active = sortField === c.key;
                const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn('whitespace-nowrap px-4 py-3 text-caption text-ink-muted first:pl-6 last:pr-6', c.align === 'right' && 'text-right', c.className)}
                  >
                    {c.sortable ? (
                      <button type="button" onClick={() => toggle(c.key)} className="inline-flex items-center gap-1 rounded-sm hover:text-ink">
                        {c.header}
                        <Icon className="size-3.5" aria-hidden />
                        <span className="sr-only">{active && sortDir === 'asc' ? t('common.sortDesc') : t('common.sortAsc')}</span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {p.rows.map((r) => (
              <tr
                key={r.id}
                onClick={p.onRowClick ? () => p.onRowClick!(r) : undefined}
                className={cn('border-t border-border hover:bg-surface-sunken', p.onRowClick && 'cursor-pointer')}
              >
                {p.columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 align-middle first:pl-6 last:pr-6', c.align === 'right' && 'whitespace-nowrap text-right tabular', c.className)}>
                    {c.cell ? c.cell(r) : String((r as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
      <Pagination page={p.params.page} pageSize={p.params.pageSize} total={p.total} onPageChange={p.onPageChange} />
    </div>
  );
}
