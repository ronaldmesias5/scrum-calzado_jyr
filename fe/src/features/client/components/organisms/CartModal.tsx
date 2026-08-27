import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Package, ShoppingCart, Trash2 } from "lucide-react";
import Modal from "@/components/atoms/Modal";
import { useToast } from "@/store/ToastContext";
import { useCart } from "@/store/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { resolveImageUrl } from "@/services/wholesaleCatalogApi";
import {
  createMyOrder,
  type OrderCreateRequest,
} from "@/services/clientApi";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cart, removeItem, clearCart, getTotalPairs } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPairs = getTotalPairs();
  const estimatedDate = cart.find((item) => item.estimatedDate)?.estimatedDate ?? null;
  const getItemPairs = (item: (typeof cart)[number]) =>
    Object.values(item.sizes).reduce((sum, amount) => sum + amount, 0);

  const formatDate = (iso: string) => {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async () => {
    if (cart.length === 0 || isSubmitting) return;
    if (!user?.id) {
      showToast("Debes iniciar sesión para realizar el pedido.", "error");
      return;
    }

    const details: OrderCreateRequest["details"] = cart.flatMap((item) =>
      Object.entries(item.sizes).map(([size, amount]) => ({
        product_id: item.productId,
        size,
        amount,
        colour: item.color,
        observations: item.observations || undefined,
      })),
    );

    try {
      setIsSubmitting(true);
      await createMyOrder({
        customer_id: user.id,
        total_pairs: totalPairs,
        delivery_date: estimatedDate,
        details,
      });
      clearCart();
      onClose();
      window.dispatchEvent(new Event("orders-updated"));
      showToast("Pedido realizado correctamente", "success");
      navigate("/dashboard/client/orders");
    } catch (error) {
      console.error("Error creando pedido del cliente:", error);
      const responseError = error as {
        response?: { data?: { detail?: string | Array<{ msg?: string }> } };
      };
      const detail = responseError.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg).filter(Boolean).join(". ")
        : detail;
      showToast(message || "No se pudo realizar el pedido. Inténtalo de nuevo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Carrito de pedidos" size="lg" centered>
      <div className="space-y-5 bg-slate-50/70 p-5 dark:bg-slate-950/40 sm:p-7">
        {cart.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-800">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
              <ShoppingCart className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="mt-5 text-lg font-bold text-gray-800 dark:text-gray-200">
              Tu carrito está vacío.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Agrega tallas desde el catálogo para realizar un pedido.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-900/20">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Resumen del pedido</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{cart.length} {cart.length === 1 ? "modelo" : "modelos"} configurados</p>
                {estimatedDate && (
                  <p className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Entrega estimada: {formatDate(estimatedDate)}
                  </p>
                )}
              </div>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{totalPairs} <span className="text-xs font-semibold">pares</span></span>
            </div>

            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={item.uid}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700">
                    {item.imageUrl ? (
                      <img
                        src={resolveImageUrl(item.imageUrl)}
                        alt={item.productName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Producto {index + 1}</p>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {item.productName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.brandName}
                        </p>
                        <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                          {getItemPairs(item)} <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">pares</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.uid)}
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        aria-label={`Quitar ${item.productName} del carrito`}
                        title="Quitar producto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {Object.entries(item.sizes).map(([size, amount]) => (
                        <span
                          key={size}
                          className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          Talla {size}: {amount}
                        </span>
                      ))}
                    </div>
                    {item.observations && (
                      <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
                        <span className="font-bold">Nota: </span>
                        {item.observations}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Total de pares
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalPairs}
              </span>
            </div>

            <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:justify-end dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={clearCart}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                Vaciar carrito
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Enviando..." : "Realizar pedido"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
