import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '../components/common/LanguageSwitch';

/** Design System LoginScreen: gradient brand panel + flat form. The only place `accent-bright` is used. */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] md:grid-cols-2 md:grid-rows-1">
      <aside className="flex flex-col justify-center gap-4 bg-brand px-6 py-8 text-on-secondary-muted md:px-12">
        <img src="/systory-logo.jpg" alt="Systory" className="size-14 rounded-sm bg-white object-contain md:size-[72px]" />
        <h1 className="text-[28px] font-bold leading-[38px] text-on-secondary md:text-[34px] md:leading-[44px]">{t('nav.productName')}</h1>
        <p className="hidden max-w-md text-body md:block">{t('auth.subtitle')}</p>
        <span className="self-start rounded-pill bg-surface-card px-6 py-2 text-[15px] font-bold leading-6 text-accent-bright">{t('auth.tagline')}</span>
      </aside>
      <main className="flex items-center justify-center px-4 py-10 md:px-8">
        <div className="flex w-full max-w-[360px] flex-col gap-6">
          {children}
          <LanguageSwitch className="justify-center" />
        </div>
      </main>
    </div>
  );
}
