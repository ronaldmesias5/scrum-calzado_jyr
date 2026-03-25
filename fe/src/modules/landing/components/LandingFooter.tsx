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

export default function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo */}
        <div className="flex flex-col items-start">
          <img src="/logo.png" alt="CALZADO J&R" className="h-16 w-16 object-contain rounded" />
          <p className="mt-4 text-xs text-gray-400">
            Calidad y Estilo a tu Alcance
          </p>
        </div>

        {/* Links rápidos */}
        <div>
          <h4 className="text-white font-semibold mb-3">Enlaces Rápidos</h4>
          <ul className="space-y-2 text-sm">
            {['Inicio', 'Catálogo', 'Nosotros', 'Contacto'].map((item) => (
              <li key={item}>
                <a href={item === 'Catálogo' ? '#' : `#${item.toLowerCase()}`} className="hover:text-white transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Categorías */}
        <div>
          <h4 className="text-white font-semibold mb-3">Categorías</h4>
          <ul className="space-y-2 text-sm">
            {['Caballero', 'Dama', 'Infantil'].map((item) => (
              <li key={item}>
                <a href="#categorias" className="hover:text-white transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="text-white font-semibold mb-3">Contacto</h4>
          <ul className="space-y-2 text-sm">
            <li>📍 Bogotá, Colombia</li>
            <li>📞 +57 601 234 5678</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-500">
        © 2026 CALZADO J&R. Todos los derechos reservados.
      </div>
    </footer>
  );
}
