import { useTranslation } from 'react-i18next';

interface DashboardFooterProps {
  className?: string;
}

export function DashboardFooter({ className = '' }: DashboardFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className={`min-h-[112px] shrink-0 bg-white px-4 py-7 text-center text-slate-600 shadow-[0_-8px_24px_-24px_rgba(15,23,42,0.45)] transition-colors duration-500 dark:bg-slate-950 dark:text-gray-400 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-base font-bold tracking-tight text-slate-800 dark:text-gray-200">
          {t('landing.hero.title')} - {t('landing.hero.subtitle')}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-gray-400">
          {t('landing.footer.location')} | {t('landing.footer.phone')} | {t('landing.footer.copyright')}
        </p>
      </div>
    </footer>
  );
}
