import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Componente: CategoriesSection.tsx
 * Descripción: Sección que muestra categorías de productos con cards clickeables.
 * 
 * ¿Qué?
 *   Grilla de categorías (Hombre, Mujer, Niño, etc.) con:
 *   - Icono/imagen representativa
 *   - Nombre categoría
 *   - Link a catálogo filtrado por categoría
 * 
 * ¿Para qué?
 *   - Navegación por categoría (UX de shopping)
 *   - Facilitar descubrimiento de productos
 * 
 * ¿Impacto?
 *   BAJO — Navegación, sin lógica crítica.
 */

export default function CategoriesSection() {
  const { t } = useTranslation();

  const categories = [
    {
      name: t('landing.categories.caballero'),
      description: t('landing.categories.caballeroDesc'),
      image: '/caballero.png',
    },
    {
      name: t('landing.categories.dama'),
      description: t('landing.categories.damaDesc'),
      image: '/dama.png',
    },
    {
      name: t('landing.categories.infantil'),
      description: t('landing.categories.infantilDesc'),
      image: '/infantil.png',
    },
  ];

  return (
    <section id="categorias" className="py-16 bg-gray-50 dark:bg-slate-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            {t('landing.categories.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            {t('landing.categories.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="relative overflow-hidden h-64">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                  {cat.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-base mb-6 leading-relaxed">
                  {cat.description}
                </p>
                <Link 
                  to="#"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-800 dark:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all duration-200 btn-pulse"
                >
                  {t('landing.categories.viewCollection')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
