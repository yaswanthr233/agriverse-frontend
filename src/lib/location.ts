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

/**
 * Attempts reverse geocoding from latitude and longitude coordinates.
 * Gracefully returns null if network is unavailable or request fails.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.display_name) {
      return data.display_name;
    }
    return null;
  } catch (err) {
    console.warn("[location] Reverse geocoding fallback:", err);
    return null;
  }
}

export interface GpsLocationResult {
  latitude: number;
  longitude: number;
  address: string | null;
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

        let address: string | null = null;
        try {
          address = await reverseGeocode(latitude, longitude);
        } catch {
          address = null;
        }

        resolve({
          latitude,
          longitude,
          address,
        });
      },
      (error) => {
        let msg = "Unable to determine your current location. Please try again.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg =
              "Location permission was denied. Please allow location access in your browser settings and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg =
              "Unable to determine your current location. Please check your GPS signal and try again.";
            break;
          case error.TIMEOUT:
            msg = "Location request timed out. Please try again.";
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

