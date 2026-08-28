import { describe, it, expect } from "vitest";
import { ApiError, toApiError } from "./client";

describe("ApiError", () => {
  it("carries status, errorCode and field errors", () => {
    const err = new ApiError("Validation failed", 400, "VALIDATION_ERROR", [
      { field: "email", message: "Invalid email" },
    ]);
    expect(err.status).toBe(400);
    expect(err.errorCode).toBe("VALIDATION_ERROR");
    expect(err.errors?.[0].field).toBe("email");
  });
});

describe("toApiError", () => {
  it("extracts message and errors from the backend envelope", () => {
    const axiosLike = {
      response: {
        status: 400,
        data: {
          success: false,
          message: "Validation failed for request fields",
          errorCode: "VALIDATION_ERROR",
          errors: [{ field: "price", message: "Price must be positive" }],
        },
      },
    };
    const err = toApiError(axiosLike);
    expect(err.status).toBe(400);
    expect(err.message).toBe("Validation failed for request fields");
    expect(err.errors?.[0].field).toBe("price");
  });

  it("falls back to a friendly message when the server sends nothing", () => {
    const err = toApiError({ request: {} });
    expect(err.status).toBe(0);
    expect(err.message).toMatch(/connect/i);
  });
});
