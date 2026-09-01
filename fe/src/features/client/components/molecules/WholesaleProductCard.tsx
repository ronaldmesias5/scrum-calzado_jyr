import { ShoppingCart, Package } from 'lucide-react';
import {
  WholesaleProduct,
  resolveImageUrl
} from '@/services/wholesaleCatalogApi';

interface WholesaleProductCardProps {
  product: WholesaleProduct;
  onOrderClick: (product: WholesaleProduct) => void;
}

export function WholesaleProductCard({
  product,
  onOrderClick
}: WholesaleProductCardProps) {
  const sizeStart = product.category_name.toLowerCase().includes('infantil')
    ? 21
    : 33;
  const sizeEnd = product.category_name.toLowerCase().includes('infantil')
    ? 32
    : 43;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
      <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-blue-950/40">
        {product.image_url ? (
          <img
            src={resolveImageUrl(product.image_url)}
            alt={product.name}
            className="h-full max-w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <Package className="h-12 w-12 text-gray-400" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-blue-600/20">
          {product.brand_name}
        </span>
        {product.color && (
          <span className="absolute right-4 top-4 rounded-full bg-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg dark:bg-slate-700">
            {product.color.trim()}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-7">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
          {product.category_name}
        </p>
        <h3 className="line-clamp-2 text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {product.name}
        </h3>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          <span className="font-bold">Estilo:</span> {product.style_name}
        </p>

        <div className="mt-7 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/50">
          <Package className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-300" />
          <span className="text-base font-medium text-slate-700 dark:text-slate-200">
            Tallas {sizeStart} al {sizeEnd}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOrderClick(product)}
          className="mt-auto flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-[.98] dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <ShoppingCart className="h-5 w-5" />
          Realizar Pedido
        </button>
      </div>
    </article>
  );
}
