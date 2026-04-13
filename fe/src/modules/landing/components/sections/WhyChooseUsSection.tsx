import { Factory, Award, Palette, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';



export default function WhyChooseUsSection() {
  const { t } = useTranslation();

  const reasons = [
    { icon: Factory, title: t('landing.whyUs.reasons.national'), desc: t('landing.whyUs.reasons.nationalDesc') },
    { icon: Award, title: t('landing.whyUs.reasons.exp'), desc: t('landing.whyUs.reasons.expDesc') },
    { icon: Palette, title: t('landing.whyUs.reasons.design'), desc: t('landing.whyUs.reasons.designDesc') },
    { icon: Heart, title: t('landing.whyUs.reasons.passion'), desc: t('landing.whyUs.reasons.passionDesc') },
  ];

  return (
    <section id="nosotros" className="py-20 bg-gray-50 dark:bg-slate-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">{t('landing.whyUs.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            {t('landing.whyUs.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reasons.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 flex flex-col sm:flex-row gap-6 border border-gray-100 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-2xl">
                  <Icon size={32} className="text-blue-800 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-2xl text-gray-900 dark:text-white mb-3 tracking-tight">{title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
