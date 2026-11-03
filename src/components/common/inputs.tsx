import { Search, X } from 'lucide-react';
import { forwardRef, useContext, useRef, type InputHTMLAttributes } from 'react';
import { FieldContext } from './FormField';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';

export function SearchBar({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
      <Input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? t('common.search')} aria-label={placeholder ?? t('common.search')} className="pl-9" />
    </div>
  );
}

export interface Option {
  value: string;
  label: string;
}

const ALL = '__all__';

/** Select for list filters; the "all" option clears the filter. */
export function FilterDropdown({ value, onChange, options, allLabel, label, className }: { value?: string; onChange: (v: string | undefined) => void; options: Option[]; allLabel: string; label: string; className?: string }) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger aria-label={label} className={cn('w-full sm:w-48', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Form select (use inside FormField; it forwards id/aria props to the trigger). */
export const SelectInput = forwardRef<HTMLButtonElement, { value?: string; onChange: (v: string) => void; options: Option[]; placeholder?: string; disabled?: boolean; id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>(
  ({ value, onChange, options, placeholder, disabled, ...props }, ref) => {
    const { t } = useTranslation();
    const field = useContext(FieldContext);
    const aria = { ...field, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) };
    return (
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger ref={ref} {...aria}>
          <SelectValue placeholder={placeholder ?? t('common.choose')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },
);
SelectInput.displayName = 'SelectInput';

/** Native date input (keyboard and mobile friendly); value is YYYY-MM-DD. */
export const DatePicker = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => <Input ref={ref} type="date" {...props} />);
DatePicker.displayName = 'DatePicker';

export function FileInput({ accept, file, onChange, label, id, ...aria }: { accept: string; file: File | null; onChange: (f: File | null) => void; label?: string; id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={ref} id={id} type="file" accept={accept} className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} {...aria} />
      <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()}>
        {label ?? t('common.chooseFile')}
      </Button>
      {file ? (
        <span className="inline-flex items-center gap-1 text-body-sm">
          {file.name}
          <button type="button" aria-label={t('common.removeFile')} className="rounded-pill p-1 text-ink-muted hover:bg-surface-sunken" onClick={() => { onChange(null); if (ref.current) ref.current.value = ''; }}>
            <X className="size-3.5" />
          </button>
        </span>
      ) : (
        <span className="text-body-sm text-ink-muted">{t('common.fileHint')}</span>
      )}
    </div>
  );
}
