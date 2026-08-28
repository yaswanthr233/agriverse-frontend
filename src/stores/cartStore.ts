import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductResponse } from "@/api/types";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  unit: string;
  quantity: number;
  stock: number; // cached so the stepper can clamp without a refetch
}

interface CartState {
  items: CartItem[];
  addItem: (product: ProductResponse) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
}

/** There is no cart API. The cart lives here and in localStorage. */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                unit: product.unit,
                quantity: 1,
                stock: product.stock,
              },
            ],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.productId !== productId),
            };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.min(quantity, i.stock) }
                : i,
            ),
          };
        }),

      clear: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
    }),
    { name: "agriverse.cart" },
  ),
);
