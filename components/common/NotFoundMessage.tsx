import { useTranslation } from 'react-i18next';

export function NotFoundMessage() {
  const { t } = useTranslation();
  return <p className="py-24 text-center text-subhead">{t('errors.notFoundPage')}</p>;
}
