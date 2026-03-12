import { Factory, Award, Palette, Heart } from 'lucide-react';

const reasons = [
  { icon: Factory, title: 'Fabricación Nacional', desc: 'Producción 100% colombiana con los más altos estándares de calidad.' },
  { icon: Award, title: 'Experiencia Probada', desc: 'Más de 5 años fabricando calzado de excelente calidad.' },
  { icon: Palette, title: 'Diseños Únicos', desc: 'Cada colección es diseñada exclusivamente con tendencias actuales y clásicos atemporales.' },
  { icon: Heart, title: 'Pasión por el Detalle', desc: 'Cada par de zapatos es elaborado con dedicación y control de calidad en cada etapa.' },
];

export default function WhyChooseUsSection() {
  return (
    <section id="nosotros" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">¿Por Qué Elegirnos?</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            En Calzado J&R nos enorgullece ofrecer productos de excelente alta calidad, respaldados por más de 5 años de experiencia en la industria del calzado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reasons.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-6 flex gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex-shrink-0">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Icon size={24} className="text-blue-800" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
