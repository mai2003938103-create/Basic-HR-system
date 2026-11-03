import { cloneElement, createContext, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

/** Accessibility props for controls rendered indirectly (e.g. through a react-hook-form Controller). */
export const FieldContext = createContext<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>({});

/** Label + control + translated error/hint. The child control receives id, aria-invalid and aria-describedby. */
export function FormField({ label, error, hint, required, children, className }: { label: ReactNode; error?: string; hint?: ReactNode; required?: boolean; children: ReactElement; className?: string }) {
  const id = useId();
  const { t } = useTranslation();
  const msgId = `${id}-msg`;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error || hint ? msgId : undefined })
    : children;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-danger-text" aria-hidden> *</span>}
      </Label>
      <FieldContext.Provider value={{ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error || hint ? msgId : undefined }}>{control}</FieldContext.Provider>
      {error ? (
        <p id={msgId} className="text-body-sm text-danger-text">{t(error)}</p>
      ) : hint ? (
        <p id={msgId} className="text-body-sm text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
