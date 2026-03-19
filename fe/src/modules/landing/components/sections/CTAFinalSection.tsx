import { Link } from 'react-router-dom';

export default function CTAFinalSection() {
  return (
    <section className="py-20 bg-blue-900 text-white text-center">
      <div className="max-w-2xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          ¡Descubre Nuestro Catálogo Completo!
        </h2>
        <p className="text-blue-200 text-lg mb-8">
          Descubre nuestra colección completa y encuentra el calzado perfecto para tu negocio. Calidad, estilo y confort garantizados.
        </p>
        <>
          <a
            href="#categorias"
            className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-lg btn-glow transition-colors duration-200 mr-4"
          >
            Ver Catálogo Completo
          </a>
          <Link
            to="/auth/register"
            className="inline-block px-8 py-3 bg-white text-blue-900 font-semibold rounded-lg btn-glow-white transition-colors duration-200"
          >
            Regístrate Ahora
          </Link>
        </>
      </div>
    </section>
  );
}
