import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative min-h-[560px] flex items-center justify-center text-white"
      style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #1e40af 100%)',
      }}
    >
      {/* Overlay decorativo */}
      <>
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url("/factory.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-blue-900/50" />
      </>

      {/* Contenido */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Calzado J&R<br />
          <span className="text-blue-300">Calidad y Estilo a tu Alcance</span>
        </h1>
        <p className="text-gray-200 text-lg mb-8 max-w-xl mx-auto">
            Somos una fábrica colombiana especializada en la producción de calzado nacional de alta calidad  para su negocio. Con más de 5 años de experiencia, nos dedicamos a ofrecerte los mejores productos.        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#categorias"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg btn-glow transition-colors duration-200"
          >
            Ver Catálogo
          </a>
          <Link
            to="/auth/login"
            className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg btn-glow transition-colors duration-200"
          >
            Ingresar
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
