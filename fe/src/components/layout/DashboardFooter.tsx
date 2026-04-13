import { useTranslation } from 'react-i18next';

export function DashboardFooter() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto mt-12 py-10 text-center border-t border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-base font-bold text-gray-800 dark:text-gray-200 tracking-tight">
          {t('landing.hero.title')} - {t('landing.hero.subtitle')}
        </p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
          {t('landing.footer.location')} | {t('landing.footer.phone')} | {t('landing.footer.copyright')}
        </p>
      </div>
    </footer>
  );
}
