import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CTAFinalSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-blue-900 dark:bg-slate-950 text-white text-center transition-colors duration-500 overflow-hidden relative">
      {/* Decorative pulse element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
          {t('landing.ctaFinal.title')}
        </h2>
        <p className="text-blue-100 dark:text-gray-400 text-xl mb-10 leading-relaxed font-medium">
          {t('landing.ctaFinal.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a
            href="#categorias"
            className="w-full sm:w-auto px-10 py-4 border-2 border-white/40 hover:border-white text-white font-bold rounded-2xl transition-all duration-200 btn-pulse"
          >
            {t('landing.ctaFinal.viewAll')}
          </a>
          <Link
            to="/auth/register"
            className="w-full sm:w-auto px-10 py-4 bg-white text-blue-900 font-extrabold rounded-2xl shadow-2xl hover:scale-105 transform transition duration-200 btn-pulse"
          >
            {t('landing.ctaFinal.registerNow')}
          </Link>
        </div>
      </div>
    </section>
  );
}
