import { Package, Ruler, ShieldCheck, Star } from 'lucide-react';

const benefits = [
  { icon: Package, title: 'Variedad', desc: 'Amplio catálogo de modelos para todos los gustos y ocasiones.' },
  { icon: Ruler, title: 'Tallas', desc: 'Disponibilidad en todas las tallas, desde la 21 hasta la 43.' },
  { icon: ShieldCheck, title: 'Calidad', desc: 'Materiales de primera selección con estándares de calidad.' },
  { icon: Star, title: 'Garantía', desc: 'Todos nuestros productos cuentan con garantía.' },
];

export default function AsessoriaSection() {
  return (
    <section id="contacto" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">¿Necesitas asesoría personalizada?</h2>
            <p className="text-gray-500 max-w-lg">
              Nuestro equipo está disponible para ayudarte a encontrar el calzado ideal para tu negocio.
            </p>
          </div>
          <button className="px-6 py-3 border-2 border-blue-800 text-blue-800 font-semibold rounded-lg btn-pulse transition-colors duration-200 whitespace-nowrap">
            Contactar Fabricante
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
              <div className="mb-4">
                <div className="bg-blue-100 p-3 rounded-full inline-block">
                  <Icon size={24} className="text-blue-800" />
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
