import { ShoppingCart, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, resolveImageUrl } from '@/services/publicCatalogService';

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
      // Default: redirect to landing with login modal trigger
      navigate('/?login=true');
    }
  };

  const handleLoginClick = () => {
    navigate('/?login=true');
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
      {/* Imagen del producto */}
      <div className="relative flex h-60 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-blue-950/40">
        {product.image_url ? (
          <img
            src={resolveImageUrl(product.image_url)}
            alt={`${product.name} — Calzado J&R`}
            loading="lazy"
            width="400"
            height="224"
            className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-24 h-24 text-gray-300 dark:text-slate-600" />
          </div>
        )}
        
        {/* Badge de marca */}
        {brandName && (
          <div className="absolute left-4 top-4 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg dark:bg-blue-500">
            {brandName}
          </div>
        )}

        {/* Badge de color */}
        {product.color && (
          <div className="absolute right-4 top-4 rounded-full bg-slate-900/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg dark:bg-slate-700/90">
            {product.color}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-5">
        {/* Categoría */}
        {categoryName && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            {categoryName}
          </p>
        )}

        {/* Nombre */}
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {product.name}
        </h3>

        {/* Estilo */}
        {styleName && (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
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
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/50">
          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tallas: {getSizeRange()}
          </span>
        </div>

        {/* Botón de pedido - Ocupar espacio restante */}
        <button
          onClick={handleOrderClick}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/15 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-[.98] dark:bg-blue-500 dark:hover:bg-blue-600"
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
      </article>
  );
}
