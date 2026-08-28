import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatDateTime, formatEnum } from "./format";

describe("formatCurrency", () => {
  it("uses Indian digit grouping", () => {
    expect(formatCurrency(1234567).replace(/\u00a0/g, " ")).toBe("₹12,34,567.00");
  });
  it("formats small amounts with paise", () => {
    expect(formatCurrency(1234.5).replace(/\u00a0/g, " ")).toBe("₹1,234.50");
  });
  it("handles zero", () => {
    expect(formatCurrency(0).replace(/\u00a0/g, " ")).toBe("₹0.00");
  });
});

describe("formatDate", () => {
  it("formats a Java LocalDateTime as local time, not UTC", () => {
    expect(formatDate("2026-08-21T10:30:00")).toBe("21 Aug 2026");
  });
});

describe("formatDateTime", () => {
  it("includes the time", () => {
    expect(formatDateTime("2026-08-21T10:30:00")).toBe("21 Aug 2026, 10:30 AM");
  });
});

describe("formatEnum", () => {
  it("converts SCREAMING_SNAKE to Title Case", () => {
    expect(formatEnum("OUT_FOR_DELIVERY")).toBe("Out For Delivery");
  });
  it("handles a single word", () => {
    expect(formatEnum("SEEDS")).toBe("Seeds");
  });
});
