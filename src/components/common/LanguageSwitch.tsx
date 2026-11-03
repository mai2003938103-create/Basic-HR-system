import { useTranslation } from 'react-i18next';
import { setLanguage, type Lang } from '../../i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitch({ className, tone = 'default' }: { className?: string; tone?: 'default' | 'onBrand' }) {
  const { i18n, t } = useTranslation();
  const opts: { v: Lang; label: string }[] = [
    { v: 'lo', label: 'ລາວ' },
    { v: 'en', label: 'English' },
  ];
  return (
    <div role="group" aria-label={t('common.language')} className={cn('inline-flex items-center gap-1 text-body-sm', className)}>
      {opts.map((o, i) => (
        <span key={o.v} className="inline-flex items-center gap-1">
          {i > 0 && <span aria-hidden className={tone === 'onBrand' ? 'text-on-secondary-muted' : 'text-ink-muted'}>·</span>}
          <button
            type="button"
            onClick={() => void setLanguage(o.v)}
            aria-pressed={i18n.language === o.v}
            className={cn(
              'rounded-sm px-1 py-0.5',
              tone === 'onBrand'
                ? i18n.language === o.v ? 'font-semibold text-on-secondary' : 'text-on-secondary-muted hover:text-on-secondary'
                : i18n.language === o.v ? 'font-semibold text-primary-hover' : 'text-ink-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        </span>
      ))}
    </div>
  );
}
