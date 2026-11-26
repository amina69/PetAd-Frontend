import { useCallback, useState } from "react";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type GeolocationStatus = "idle" | "locating" | "located" | "denied" | "unavailable";

function roundToApproximateKilometer(value: number): number {
  return Number(value.toFixed(2));
}

export function useGeolocation(
  onCoordinates: (coordinates: Coordinates | null) => void,
) {
  const [status, setStatus] = useState<GeolocationStatus>("idle");

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      onCoordinates(null);
      setStatus("unavailable");
      return;
    }

    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onCoordinates({
          latitude: roundToApproximateKilometer(coords.latitude),
          longitude: roundToApproximateKilometer(coords.longitude),
        });
        setStatus("located");
      },
      (error) => {
        onCoordinates(null);
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [onCoordinates]);

  const message =
    status === "denied"
      ? "Location access was declined. Enter a city or area instead."
      : status === "unavailable"
        ? "Location is unavailable. Enter a city or area instead."
        : status === "located"
          ? "Using your approximate location."
          : null;

  return { requestLocation, status, message };
}
