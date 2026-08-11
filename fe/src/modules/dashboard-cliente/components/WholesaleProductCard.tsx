import { ShoppingCart, Package, Box } from "lucide-react";
import {
  WholesaleProduct,
  resolveImageUrl,
} from "../services/wholesaleCatalogApi";

interface WholesaleProductCardProps {
  product: WholesaleProduct;
  onOrderClick: (product: WholesaleProduct) => void;
}

const STOCK_BADGE = {
  out: {
    label: "Agotado",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  low: {
    label: "Bajo stock",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  ok: {
    label: "Disponible",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
} as const;

function getSizeRange(categoryName: string): string {
  const category = categoryName.toLowerCase();
  if (category.includes("infantil")) return "21 al 32";
  if (category.includes("dama")) return "33 al 43";
  if (category.includes("caballero")) return "33 al 43";
  return "33 al 43";
}

export function WholesaleProductCard({
  product,
  onOrderClick,
}: WholesaleProductCardProps) {
  const available = product.available ?? 0;
  const stockBadge =
    available <= 0
      ? STOCK_BADGE.out
      : available < 12
        ? STOCK_BADGE.low
        : STOCK_BADGE.ok;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-slate-700 flex flex-col">
      {/* Imagen del modelo */}
      <div className="relative h-52 bg-gray-100 dark:bg-slate-700 overflow-hidden group">
        {product.image_url ? (
          <img
            src={resolveImageUrl(product.image_url)}
            alt={`${product.name} — Calzado J&R`}
            loading="lazy"
            width="400"
            height="208"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-20 h-20 text-gray-300 dark:text-slate-600" />
          </div>
        )}

        {/* Badge de marca */}
        <div className="absolute top-3 left-3 bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
          {product.brand_name}
        </div>

        {/* Badge de color */}
        {product.color && (
          <div className="absolute top-3 right-3 bg-gray-800/90 dark:bg-gray-700/90 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase shadow-lg">
            {product.color}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
          {product.category_name}
        </p>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {product.name}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span className="font-semibold">Estilo:</span> {product.style_name}
        </p>

        {/* Tallas + stock */}
        <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tallas {getSizeRange(product.category_name)}
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${stockBadge.className}`}
          >
            {stockBadge.label}
          </span>
        </div>

        <button
          onClick={() => onOrderClick(product)}
          disabled={available <= 0}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 active:scale-95 shadow-lg hover:shadow-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:active:scale-100"
        >
          <ShoppingCart className="w-5 h-5" />
          {available <= 0 ? "Sin stock disponible" : "Realizar Pedido"}
        </button>
      </div>
    </div>
  );
}
