import { useTranslation } from 'react-i18next';

export default function MetricsSection() {
  const { t } = useTranslation();

  const metrics = [
    { value: '25+', label: t('landing.metrics.experience') || 'Años de experiencia' },
    { value: '10.000+', label: t('landing.metrics.models') || 'Modelos diseñados' },
    { value: '100%', label: t('landing.metrics.quality') || 'Garantía de calidad' },
    { value: '5.000+', label: t('landing.metrics.clients') || 'Clientes satisfechos' },
  ];
  return (
    <section className="bg-white dark:bg-slate-900 py-12 border-b border-gray-100 dark:border-slate-800 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {metrics.map((m) => (
          <div key={m.label}>
            <span className="text-4xl font-extrabold text-[#1e40af] dark:text-blue-400 block mb-1 tracking-tight">
              {m.value}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium block uppercase tracking-wider">
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
