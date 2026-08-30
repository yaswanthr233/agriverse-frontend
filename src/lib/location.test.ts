import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getGoogleMapsUrl,
  reverseGeocode,
  getCurrentGpsLocation,
} from "./location";

describe("Geolocation & Navigation Helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getGoogleMapsUrl builds correct Google Maps query URL", () => {
    expect(getGoogleMapsUrl(17.385044, 78.486671)).toBe(
      "https://www.google.com/maps/search/?api=1&query=17.385044,78.486671"
    );
    expect(getGoogleMapsUrl("12.9716", "77.5946")).toBe(
      "https://www.google.com/maps/search/?api=1&query=12.9716,77.5946"
    );
  });

  it("getGoogleMapsUrl returns null for invalid or null coordinates", () => {
    expect(getGoogleMapsUrl(null, 78.486671)).toBeNull();
    expect(getGoogleMapsUrl(17.385044, null)).toBeNull();
    expect(getGoogleMapsUrl(undefined, undefined)).toBeNull();
    expect(getGoogleMapsUrl("invalid", "invalid")).toBeNull();
  });

  it("getCurrentGpsLocation resolves latitude, longitude, and accuracy", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 17.385044,
            longitude: 78.486671,
            accuracy: 10.5,
          },
        });
      }),
    };
    vi.stubGlobal("navigator", { geolocation: mockGeolocation });

    const res = await getCurrentGpsLocation();
    expect(res.latitude).toBe(17.385044);
    expect(res.longitude).toBe(78.486671);
    expect(res.accuracy).toBe(10.5);
  });

  it("getCurrentGpsLocation handles permission denied error", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      }),
    };
    vi.stubGlobal("navigator", { geolocation: mockGeolocation });

    await expect(getCurrentGpsLocation()).rejects.toThrow(
      "Location permission was denied"
    );
  });
});

