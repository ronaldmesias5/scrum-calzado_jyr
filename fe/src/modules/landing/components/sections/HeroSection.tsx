/**
 * Componente: HeroSection.tsx
 * Descripción: Sección heroica de landing (imagen grande + CTA).
 * 
 * ¿Qué?
 *   Hero con:
 *   - Imagen de fondo (background gradient + overlay)
 *   - Título "CALZADO J&R"
 *   - Subtítulo "Calidad y Estilo a tu Alcance"
 *   - CTA buttons: "Explorar Catálogo", "Contactar"
 * 
 * ¿Para qué?
 *   - Primera impresión visual en landing
 *   - Conversión: guiar a usuarios a catálogo o contacto
 * 
 * ¿Impacto?
 *   MEDIO — Visual, importante para conversión pero no crítico.
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section
      id="inicio"
      className="relative min-h-[560px] flex items-center justify-center text-white overflow-hidden"
    >
      {/* Background with darker shade in dark mode */}
      <div className="absolute inset-0 bg-blue-900 dark:bg-slate-950 transition-colors duration-500" />
      
      {/* Overlay decorativo */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url("/factory.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-transparent dark:from-slate-950/60" />

      {/* Contenido */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
          {t('landing.hero.title')}<br />
          <span className="text-blue-300 dark:text-blue-400">{t('landing.hero.subtitle')}</span>
        </h1>
        <p className="text-gray-200 dark:text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
           {t('landing.hero.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Link
            to="/catalog"
            className="px-8 py-4 bg-white text-blue-900 dark:bg-blue-600 dark:text-white font-bold rounded-xl shadow-lg hover:scale-105 transform transition duration-200 btn-pulse"
          >
            {t('landing.hero.ctaCatalog')}
          </Link>
          <Link
            to="/auth/login"
            className="px-8 py-4 border-2 border-white/30 hover:border-white text-white font-bold rounded-xl backdrop-blur-sm transition duration-200 btn-pulse"
          >
            {t('landing.hero.ctaLogin')}
          </Link>
        </div>

        {/* Indicador de scroll */}
        <a href="#categorias" aria-label="Desplazar hacia abajo" className="scroll-mouse mt-10 flex justify-center block">
          <svg width="28" height="44" viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="1.5" width="25" height="41" rx="12.5" stroke="white" strokeOpacity="0.7" strokeWidth="2"/>
            <circle className="scroll-wheel" cx="14" cy="12" r="3" fill="white" fillOpacity="0.8"/>
            <polyline points="9,32 14,38 19,32" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </section>
  );
}
