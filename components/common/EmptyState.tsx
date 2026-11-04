import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Inbox } from 'lucide-react';
import { Button } from '../ui/button';

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Inbox className="size-8 text-ink-muted" aria-hidden />
      <p className="text-subhead">{title}</p>
      {text && <p className="text-body-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <AlertTriangle className="size-8 text-danger" aria-hidden />
      <p className="text-subhead">{t('common.errorTitle')}</p>
      {message && <p className="text-body-sm text-ink-muted">{t(message)}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-2" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
