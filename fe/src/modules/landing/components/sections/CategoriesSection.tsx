import { Link } from 'react-router-dom';

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

const categories = [
  {
    name: 'Caballero',
    description: 'Calzado elegante y cómodo para hombre. Desde zapatos deportivos hasta casuales..',
    image: '/caballero.png',
  },
  {
    name: 'Dama',
    description: 'Diseños modernos y sofisticados para mujer. Estilo y comodidad en cada modelo.',
    image: '/dama.png',
  },
  {
    name: 'Infantil',
    description: 'Calzado resistente y cómodo para niños. Diversión y calidad en cada paso.',
    image: '/infantil.png',
  },
];

export default function CategoriesSection() {
  return (
    <section id="categorias" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Categorías</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Encuentra el calzado perfecto para cada estilo y ocasión.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 group"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{cat.description}</p>
                <Link 
                  to={`/catalog?search=${cat.name}`}
                  className="inline-block px-5 py-2 bg-blue-800 text-white text-sm font-semibold rounded-lg btn-glow hover:bg-blue-700 transition-colors duration-200 text-center"
                >
                  Ver Colección
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
