/**
 * Mirrors the backend's OrderCheckoutHelper EXACTLY.
 * If these disagree, the user sees one price and is charged another.
 * This is the only place checkout arithmetic may live.
 */
export const TAX_RATE = 0.05;
export const SHIPPING_FEE = 250;
export const FREE_SHIPPING_THRESHOLD = 5000;

export interface Totals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateTotals(subtotal: number): Totals {
  const tax = round2(subtotal * TAX_RATE);
  // Backend uses compareTo(...) > 0 — strictly greater, not >=.
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return {
    subtotal: round2(subtotal),
    tax,
    shipping,
    total: round2(subtotal + tax + shipping),
  };
}
