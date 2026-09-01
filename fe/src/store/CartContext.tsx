import { createContext, useContext, useState } from 'react';

interface ProductWithInventory {
  id: string;
  name: string;
  brand_name: string;
  category_name: string;
  color?: string | null;
  image_url?: string | null;
  sizes_inventory?: Array<{ size: string; available: number }>;
}

interface CartItem {
  uid: string;
  productId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  color?: string | null;
  imageUrl?: string | null;
  sizes: Record<string, number>;
  availableBySize: Record<string, number>;
  estimatedDate?: string | null;
  observations?: string | null;
}

interface CartContextValue {
  cart: CartItem[];
  addItem: (
    product: ProductWithInventory,
    size: string,
    amount: number,
    estimatedDate?: string | null,
    observations?: string | null
  ) => void;
  removeItem: (uid: string) => void;
  clearCart: () => void;
  getTotalPairs: () => number;
  getItems: () => CartItem[];
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addItem = (
    product: ProductWithInventory,
    size: string,
    amount: number,
    estimatedDate?: string | null,
    observations?: string | null
  ) => {
    if (amount <= 0) return;
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.productId === product.id
      );

      const newSizes = {
        ...(existingItem?.sizes || {}),
        [size]: (existingItem?.sizes[size] || 0) + amount
      };

      const availableBySize: Record<string, number> = {};
      if (product.sizes_inventory) {
        product.sizes_inventory.forEach(
          (inv: { size: string; available: number }) => {
            availableBySize[inv.size] = inv.available;
          }
        );
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.uid === existingItem.uid
            ? {
                ...item,
                sizes: newSizes,
                estimatedDate: estimatedDate ?? item.estimatedDate,
                observations: observations ?? item.observations
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          uid: `cart_${product.id}_${size}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: product.id,
          productName: product.name,
          brandName: product.brand_name,
          categoryName: product.category_name,
          color: product.color,
          imageUrl: product.image_url,
          sizes: newSizes,
          availableBySize: availableBySize,
          estimatedDate: estimatedDate ?? null,
          observations: observations ?? null
        };
        return [...prevCart, newItem];
      }
    });
  };

  const removeItem = (uid: string) => {
    setCart((prev) => prev.filter((item) => item.uid !== uid));
  };

  const clearCart = () => setCart([]);

  const getTotalPairs = () =>
    cart.reduce(
      (sum, item) =>
        sum + Object.values(item.sizes).reduce((s, amt) => s + amt, 0),
      0
    );

  const getItems = () => cart;

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, clearCart, getTotalPairs, getItems }}
    >
      {children}
    </CartContext.Provider>
  );
};
