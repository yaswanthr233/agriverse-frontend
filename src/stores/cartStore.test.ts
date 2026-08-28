import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cartStore";
import type { ProductResponse } from "@/api/types";

const product = (over: Partial<ProductResponse> = {}): ProductResponse => ({
  id: 1,
  name: "Paddy Seeds",
  description: null,
  price: 850,
  category: "SEEDS",
  categoryLabel: "Seeds",
  stock: 10,
  unit: "kg",
  imageUrl: null,
  brand: null,
  isActive: true,
  sellerName: "Demo Seller",
  sellerEmail: "s@a.in",
  createdAt: "",
  updatedAt: "",
  ...over,
});

describe("cartStore", () => {
  beforeEach(() => useCartStore.getState().clear());

  it("adds an item", () => {
    useCartStore.getState().addItem(product());
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("increments quantity when the same product is added twice", () => {
    useCartStore.getState().addItem(product());
    useCartStore.getState().addItem(product());
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("never exceeds available stock", () => {
    useCartStore.getState().addItem(product({ stock: 2 }));
    useCartStore.getState().setQuantity(1, 99);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("removes an item when quantity drops to zero", () => {
    useCartStore.getState().addItem(product());
    useCartStore.getState().setQuantity(1, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("computes the subtotal", () => {
    useCartStore.getState().addItem(product({ id: 1, price: 850 }));
    useCartStore.getState().addItem(product({ id: 2, price: 100 }));
    useCartStore.getState().setQuantity(1, 2);
    expect(useCartStore.getState().subtotal()).toBe(1800);
  });
});
