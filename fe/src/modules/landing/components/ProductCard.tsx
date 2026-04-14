import { ShoppingCart, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, resolveImageUrl } from '../services/publicCatalogService';

interface ProductCardProps {
  product: Product;
  brandName?: string;
  styleName?: string;
  categoryName?: string;
  onOrderClick?: (product: Product) => void;
}

export default function ProductCard({
  product,
  brandName,
  styleName,
  categoryName,
  onOrderClick,
}: ProductCardProps) {
  const navigate = useNavigate();

  // Determinar rango de tallas según categoría
  const getSizeRange = (): string => {
    if (!categoryName) return '33 al 43';
    const category = categoryName.toLowerCase();
    if (category.includes('infantil')) return '21 al 32';
    if (category.includes('dama')) return '33 al 43';
    if (category.includes('caballero')) return '33 al 43';
    return '33 al 43'; // Por defecto
  };

  const handleOrderClick = () => {
    if (onOrderClick) {
      onOrderClick(product);
    } else {
      // Default: redirect to login
      navigate('/auth/login', { state: { returnTo: '/catalog' } });
    }
  };

  const handleLoginClick = () => {
    navigate('/auth/login', { state: { returnTo: '/catalog' } });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-slate-700 flex flex-col">
      {/* Imagen del producto */}
      <div className="relative h-56 bg-gray-100 dark:bg-slate-700 overflow-hidden group">
        {product.image_url ? (
          <img
            src={resolveImageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              (e.target as any).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-24 h-24 text-gray-300 dark:text-slate-600" />
          </div>
        )}
        
        {/* Badge de marca */}
        {brandName && (
          <div className="absolute top-4 left-4 bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
            {brandName}
          </div>
        )}

        {/* Badge de color */}
        {product.color && (
          <div className="absolute top-4 right-4 bg-gray-800 dark:bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase shadow-lg">
            {product.color}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-6 flex flex-col flex-1">
        {/* Categoría */}
        {categoryName && (
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
            {categoryName}
          </p>
        )}

        {/* Nombre */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {product.name}
        </h3>

        {/* Estilo */}
        {styleName && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span className="font-semibold">Estilo:</span> {styleName}
          </p>
        )}

        {/* Descripción */}
        {product.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Info de tallas (según categoría) */}
        <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tallas: {getSizeRange()}
          </span>
        </div>

        {/* Botón de pedido - Ocupar espacio restante */}
        <button
          onClick={handleOrderClick}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 active:scale-95 shadow-lg hover:shadow-blue-500/50"
        >
          <ShoppingCart className="w-5 h-5" />
          Realizar Pedido
        </button>

        {/* Texto de ayuda - clickeable para login */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
          Para realizar tus pedidos,{' '}
          <button
            onClick={handleLoginClick}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-all"
          >
            inicia sesión
          </button>
          {' '}(venta al por mayor).
        </p>
      </div>
    </div>
  );
}
