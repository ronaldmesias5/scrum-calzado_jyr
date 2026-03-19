const metrics = [
  { value: '25+', label: 'Años de experiencia' },
  { value: '10.000+', label: 'Modelos diseñados' },
  { value: '100%', label: 'Garantía de calidad' },
  { value: '5.000+', label: 'Clientes satisfechos' },
];

export default function MetricsSection() {
  return (
    <section className="bg-white py-12 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {metrics.map((m) => (
          <div key={m.label}>
            <span className="text-4xl font-bold text-blue-800 block mb-1">{m.value}</span>
            <span className="text-gray-500 text-sm block">{m.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
