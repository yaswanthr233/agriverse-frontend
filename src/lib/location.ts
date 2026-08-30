/**
 * Builds Google Maps search URL from latitude and longitude.
 */
export function getGoogleMapsUrl(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined
): string | null {
  if (latitude == null || longitude == null) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (isNaN(lat) || isNaN(lng)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export interface ReverseGeocodeComponents {
  houseStreetNo: string;
  pincode: string;
  state: string;
  district: string;
  city?: string;
}

export interface ReverseGeocodeResult {
  address: string | null;
  components: ReverseGeocodeComponents | null;
}

/**
 * Attempts reverse geocoding from latitude and longitude coordinates.
 * Gracefully returns null if network is unavailable or request fails.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const details = await reverseGeocodeDetailed(latitude, longitude);
    return details.address;
  } catch (err) {
    console.warn("[location] Reverse geocoding fallback:", err);
    return null;
  }
}

/**
 * Detailed reverse geocoder returning both formatted address string and structured components.
 */
export async function reverseGeocodeDetailed(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timer);

    if (!res.ok) return { address: null, components: null };
    const data = await res.json();
    const addr = data?.address || {};

    const streetParts = [
      addr.house_number || addr.house_name || addr.building,
      addr.road || addr.street || addr.suburb || addr.neighbourhood || addr.residential || addr.village,
    ].filter(Boolean);

    const houseStreetNo = streetParts.join(", ");
    const pincode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);
    const state = addr.state || "";
    const district = addr.state_district || addr.district || addr.county || addr.city || addr.town || "";
    const city = addr.city || addr.town || addr.village || "";

    const components: ReverseGeocodeComponents = {
      houseStreetNo,
      pincode,
      state,
      district,
      city,
    };

    return {
      address: data?.display_name || null,
      components,
    };
  } catch (err) {
    console.warn("[location] Reverse geocoding fallback:", err);
    return { address: null, components: null };
  }
}

export interface GpsLocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address: string | null;
  components?: ReverseGeocodeComponents | null;
}

/**
 * Requests one-time high-accuracy GPS coordinates from the browser Geolocation API.
 */
export function getCurrentGpsLocation(): Promise<GpsLocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(
        new Error("Your browser does not support location services.")
      );
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const accuracy = pos.coords.accuracy ?? null;

        let address: string | null = null;
        let components: ReverseGeocodeComponents | null = null;
        try {
          const res = await reverseGeocodeDetailed(latitude, longitude);
          address = res.address;
          components = res.components;
        } catch {
          address = null;
          components = null;
        }

        resolve({
          latitude,
          longitude,
          accuracy,
          address,
          components,
        });
      },
      (error) => {
        let msg = "Unable to determine your current location. Please try again.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg =
              "Location permission was denied. Please enter your address manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg =
              "Unable to detect your location. Please enter your address manually.";
            break;
          case error.TIMEOUT:
            msg = "Location request timed out. Please enter your address manually.";
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}
