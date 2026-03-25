/**
 * Archivo: modules/landing/pages/PublicCatalogPage.tsx
 * Descripción: Página de catálogo público para clientes.
 * Se ha ocultado el contenido público por solicitud del cliente,
 * requiriendo autenticación para ver los productos.
 */

import { Link } from 'react-router-dom';
import { ShoppingBag, Lock } from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import WhatsAppButton from '../components/WhatsAppButton';

export default function PublicCatalogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <LandingHeader />
      
      <main className="flex-1 flex items-center justify-center p-6 w-full">
        <div className="bg-white max-w-lg w-full rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
            <Lock size={40} className="mb-1" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Catálogo Privado</h1>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Nuestro catálogo de calzado está reservado exclusivamente para clientes y mayoristas registrados.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/auth/login" 
              className="px-8 py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg btn-glow transition-colors duration-200"
            >
              Iniciar Sesión
            </Link>
            <Link 
              to="/auth/register" 
              className="px-8 py-3 border border-blue-800 text-blue-800 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200"
            >
              Regístrate
            </Link>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-500 text-sm">
            <ShoppingBag size={16} />
            <span>CALZADO J&R - Calidad y Estilo a tu Alcance</span>
          </div>
        </div>
      </main>

      <LandingFooter />
      <WhatsAppButton />
    </div>
  );
}
