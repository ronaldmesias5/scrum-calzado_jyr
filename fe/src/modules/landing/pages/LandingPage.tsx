/**
 * Archivo: modules/landing/pages/LandingPage.tsx
 * Descripción: Página de inicio (hero) del sitio público de CALZADO J&R.
 * 
 * ¿Qué?
 *   Orquesta TODAS las secciones de la página de bienvenida:
 *   - LandingHeader: Logo, menú navegación, botones auth
 *   - HeroSection: Imagen heroica, CTA principal
 *   - CategoriesSection: Categorías de calzado (clickeables)
 *   - AsessoriaSection: Beneficios (asesoría, tallas, calidad)
 *   - WhyChooseUsSection: Razones para confiar
 *   - CTAFinalSection: CTA final (acceso privado)
 *   - WhatsAppButton: Botón flotante para contacto
 *   - LandingFooter: Footer con links políticas
 * 
 * ¿Para qué?
 *   - Punto de entrada único para clientes no autenticados
 *   - Presentar marca y servicios de forma atractiva
 *   - Guiar clientes a registro o login
 *   - Mostrar catálogo público de categorías
 * 
 * ¿Impacto?
 *   CRÍTICO — Página principal del público (SEO, conversión).
 *   Si falla: no hay entrada al sistema para nuevos clientes.
 *   Dependencias: todos los componentes landing/*
 */

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import HeroSection from '../components/sections/HeroSection';
import CategoriesSection from '../components/sections/CategoriesSection';
import AsessoriaSection from '../components/sections/AsessoriaSection';
import WhyChooseUsSection from '../components/sections/WhyChooseUsSection';
import CTAFinalSection from '../components/sections/CTAFinalSection';
import WhatsAppButton from '../components/WhatsAppButton';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <AsessoriaSection />
        <WhyChooseUsSection />
        <CTAFinalSection />
      </main>
      <LandingFooter />
      <WhatsAppButton />
    </div>
  );
}
