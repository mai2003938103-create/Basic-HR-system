import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
const TONE: Record<Tone, string> = {
  success: 'bg-success-tint text-success-text',
  warning: 'bg-warning-tint text-warning-text',
  danger: 'bg-danger-tint text-danger-text',
  info: 'bg-primary-tint text-primary-hover',
  neutral: 'bg-neutral-tint text-ink-muted',
};
const MAP: Record<string, Record<string, Tone>> = {
  attendance: { present: 'success', late: 'warning', half_day: 'warning', absent: 'danger', leave: 'info' },
  leave: { pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'neutral' },
  employment: { active: 'success', probation: 'info', inactive: 'neutral', terminated: 'neutral' },
  account: { active: 'success', inactive: 'neutral' },
};

export function StatusBadge({ kind, value, className }: { kind: keyof typeof MAP; value: string; className?: string }) {
  const { t } = useTranslation();
  const tone = MAP[kind]?.[value] ?? 'neutral';
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-caption', TONE[tone], className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {t(`status.${kind}.${value}`)}
    </span>
  );
}
