import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Input } from './input';

/** Password field with a button that toggles between hidden and visible text. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(({ className, ...props }, ref) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} className={cn('pr-11', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-sm text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';
