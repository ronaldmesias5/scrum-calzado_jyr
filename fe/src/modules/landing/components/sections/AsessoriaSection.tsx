import { Package, Ruler, ShieldCheck, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';



export default function AsessoriaSection() {
  const { t } = useTranslation();

  const benefits = [
    { icon: Package, title: t('landing.asesoria.benefits.variety'), desc: t('landing.asesoria.benefits.varietyDesc') },
    { icon: Ruler, title: t('landing.asesoria.benefits.sizes'), desc: t('landing.asesoria.benefits.sizesDesc') },
    { icon: ShieldCheck, title: t('landing.asesoria.benefits.quality'), desc: t('landing.asesoria.benefits.qualityDesc') },
    { icon: Star, title: t('landing.asesoria.benefits.warranty'), desc: t('landing.asesoria.benefits.warrantyDesc') },
  ];

  return (
    <section id="contacto" className="py-20 bg-white dark:bg-slate-950 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
          <div className="max-w-xl">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              {t('landing.asesoria.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {t('landing.asesoria.subtitle')}
            </p>
          </div>
          <button className="px-8 py-4 border-2 border-blue-800 dark:border-blue-500 text-blue-800 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 shadow-lg shadow-blue-800/5 btn-pulse">
            {t('landing.asesoria.cta')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 group">
              <div className="mb-6 flex justify-center">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Icon size={32} className="text-blue-800 dark:text-blue-400" />
                </div>
              </div>
              <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-3">{title}</h4>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
