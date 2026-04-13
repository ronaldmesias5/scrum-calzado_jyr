/**
 * Componente: LandingFooter.tsx
 * Descripción: Footer de página de landing con links a políticas y términos.
 * 
 * ¿Qué?
 *   Footer simple con:
 *   - Links a Términos, Privacidad, Cookie Policy
 *   - Rastreo de consentimiento (localStorage)
 *   - Copyright CALZADO J&R
 * 
 * ¿Para qué?
 *   - Cumplimiento legal (GDPR, cookies, privacidad)
 *   - Consistencia visual en toda la web
 *   - Acceso fácil a policies desde cualquier página
 * 
 * ¿Impacto?
 *   BAJO — Componente frontend, sin lógica crítica.
 *   No implementar afecta: cumplimiento legal, UX consistente.
 */

import { useTranslation } from 'react-i18next';

export default function LandingFooter() {
  const { t } = useTranslation();

  const links = [
    { label: t('landing.nav.home'), href: '#inicio' },
    { label: t('landing.nav.catalog'), href: '#' },
    { label: t('landing.nav.about'), href: '#nosotros' },
    { label: t('landing.nav.contact'), href: '#contacto' },
  ];

  const categoriesList = [
    { label: t('landing.categories.caballero'), href: '#categorias' },
    { label: t('landing.categories.dama'), href: '#categorias' },
    { label: t('landing.categories.infantil'), href: '#categorias' },
  ];

  return (
    <footer className="bg-gray-900 dark:bg-slate-950 text-gray-300 dark:text-gray-400 pt-16 pb-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Logo */}
        <div className="flex flex-col items-start gap-4">
          <img src="/logo.png" alt="CALZADO J&R" className="h-20 w-20 object-contain rounded-2xl bg-white p-2" />
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
            {t('landing.hero.subtitle')}
          </p>
        </div>

        {/* Links rápidos */}
        <div>
          <h4 className="text-white dark:text-gray-200 font-bold text-lg mb-6">{t('landing.footer.quickLinks')}</h4>
          <ul className="space-y-3 text-base font-medium">
            {links.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Categorías */}
        <div>
          <h4 className="text-white dark:text-gray-200 font-bold text-lg mb-6">{t('landing.categories.title')}</h4>
          <ul className="space-y-3 text-base font-medium">
            {categoriesList.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="text-white dark:text-gray-200 font-bold text-lg mb-6">{t('landing.footer.contact')}</h4>
          <ul className="space-y-3 text-base font-medium">
            <li className="flex items-center gap-2">{t('landing.footer.location')}</li>
            <li className="flex items-center gap-2">{t('landing.footer.phone')}</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-800 dark:border-slate-800 text-center text-sm font-medium text-gray-500">
        {t('landing.footer.copyright')}
      </div>
    </footer>
  );
}
