import { describe, it, expect } from "vitest";
import { calculateTotals } from "./checkout";

describe("calculateTotals", () => {
  it("adds 5% tax and flat shipping below the threshold", () => {
    expect(calculateTotals(1000)).toEqual({
      subtotal: 1000,
      tax: 50,
      shipping: 250,
      total: 1300,
    });
  });

  it("gives free shipping ABOVE the threshold", () => {
    expect(calculateTotals(6000)).toEqual({
      subtotal: 6000,
      tax: 300,
      shipping: 0,
      total: 6300,
    });
  });

  it("still charges shipping AT exactly the threshold (strictly greater)", () => {
    const r = calculateTotals(5000);
    expect(r.shipping).toBe(250);
    expect(r.total).toBe(5500);
  });

  it("rounds tax to 2 decimal places, half up", () => {
    expect(calculateTotals(333.33).tax).toBe(16.67);
  });

  it("handles an empty cart", () => {
    expect(calculateTotals(0)).toEqual({
      subtotal: 0,
      tax: 0,
      shipping: 250,
      total: 250,
    });
  });
});
