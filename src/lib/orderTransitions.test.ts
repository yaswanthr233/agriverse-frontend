import { describe, it, expect } from "vitest";
import { nextStatusesFor } from "./orderTransitions";

describe("nextStatusesFor — SELLER", () => {
  it("allows Seller to ONLY confirm PENDING orders", () => {
    expect(nextStatusesFor("SELLER", "PENDING")).toEqual(["CONFIRMED"]);
  });

  it("hands off to Delivery Partner immediately after confirmation", () => {
    expect(nextStatusesFor("SELLER", "CONFIRMED")).toEqual([]);
    expect(nextStatusesFor("SELLER", "CLAIMED")).toEqual([]);
    expect(nextStatusesFor("SELLER", "DISPATCHED")).toEqual([]);
    expect(nextStatusesFor("SELLER", "SHIPPED")).toEqual([]);
    expect(nextStatusesFor("SELLER", "OUT_FOR_DELIVERY")).toEqual([]);
    expect(nextStatusesFor("SELLER", "DELIVERED")).toEqual([]);
    expect(nextStatusesFor("SELLER", "CANCELLED")).toEqual([]);
  });
});

describe("nextStatusesFor — DELIVERY_PARTNER", () => {
  it("progresses delivery through progressive stages (CLAIMED -> DISPATCHED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED)", () => {
    expect(nextStatusesFor("DELIVERY_PARTNER", "CONFIRMED")).toEqual(["CLAIMED"]);
    expect(nextStatusesFor("DELIVERY_PARTNER", "CLAIMED")).toEqual(["DISPATCHED"]);
    expect(nextStatusesFor("DELIVERY_PARTNER", "DISPATCHED")).toEqual(["SHIPPED"]);
    expect(nextStatusesFor("DELIVERY_PARTNER", "SHIPPED")).toEqual(["OUT_FOR_DELIVERY"]);
    expect(nextStatusesFor("DELIVERY_PARTNER", "OUT_FOR_DELIVERY")).toEqual(["DELIVERED"]);
    expect(nextStatusesFor("DELIVERY_PARTNER", "DELIVERED")).toEqual([]);
  });

  it("cannot act on unconfirmed pending orders", () => {
    expect(nextStatusesFor("DELIVERY_PARTNER", "PENDING")).toEqual([]);
  });
});

describe("nextStatusesFor — FARMER", () => {
  it("may cancel pending or confirmed orders", () => {
    expect(nextStatusesFor("FARMER", "PENDING")).toEqual(["CANCELLED"]);
    expect(nextStatusesFor("FARMER", "CONFIRMED")).toEqual(["CANCELLED"]);
    expect(nextStatusesFor("FARMER", "DISPATCHED")).toEqual([]);
    expect(nextStatusesFor("FARMER", "DELIVERED")).toEqual([]);
  });
});

describe("nextStatusesFor — ADMIN", () => {
  it("may set any status except the current one", () => {
    const options = nextStatusesFor("ADMIN", "PENDING");
    expect(options).toContain("REFUNDED");
    expect(options).toContain("CANCELLED");
    expect(options).not.toContain("PENDING");
  });
});
