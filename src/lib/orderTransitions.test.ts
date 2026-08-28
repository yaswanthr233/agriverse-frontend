import { describe, it, expect } from "vitest";
import { nextStatusesFor } from "./orderTransitions";

describe("nextStatusesFor — SELLER", () => {
  it("advances one step along the fulfilment path", () => {
    expect(nextStatusesFor("SELLER", "PENDING")).toEqual(["CONFIRMED"]);
    expect(nextStatusesFor("SELLER", "CONFIRMED")).toEqual(["PACKED"]);
    expect(nextStatusesFor("SELLER", "PACKED")).toEqual(["SHIPPED"]);
  });

  it("hands off after SHIPPED — the seller cannot go further", () => {
    expect(nextStatusesFor("SELLER", "SHIPPED")).toEqual([]);
    expect(nextStatusesFor("SELLER", "OUT_FOR_DELIVERY")).toEqual([]);
  });

  it("cannot act on a terminal order", () => {
    expect(nextStatusesFor("SELLER", "DELIVERED")).toEqual([]);
    expect(nextStatusesFor("SELLER", "CANCELLED")).toEqual([]);
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

describe("nextStatusesFor — FARMER", () => {
  it("may only cancel, and only before packing", () => {
    expect(nextStatusesFor("FARMER", "PENDING")).toEqual(["CANCELLED"]);
    expect(nextStatusesFor("FARMER", "CONFIRMED")).toEqual(["CANCELLED"]);
    expect(nextStatusesFor("FARMER", "PACKED")).toEqual([]);
  });
});
