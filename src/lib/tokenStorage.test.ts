import { describe, it, expect, beforeEach } from "vitest";
import { tokenStorage } from "./tokenStorage";

describe("tokenStorage", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing is stored", () => {
    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
  });

  it("round-trips both tokens", () => {
    tokenStorage.set("access-abc", "refresh-xyz");
    expect(tokenStorage.getAccess()).toBe("access-abc");
    expect(tokenStorage.getRefresh()).toBe("refresh-xyz");
  });

  it("clears both tokens", () => {
    tokenStorage.set("a", "b");
    tokenStorage.clear();
    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
  });
});
