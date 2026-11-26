import { MapPin } from "lucide-react";
import { useGeolocation, type Coordinates } from "../hooks/useGeolocation";

export const LOCATION_RADII = [5, 10, 25, 50] as const;
export type LocationRadius = (typeof LOCATION_RADII)[number];

interface LocationInputProps {
  location: string;
  radius: LocationRadius;
  onLocationChange: (location: string) => void;
  onRadiusChange: (radius: LocationRadius) => void;
  onCoordinatesChange: (coordinates: Coordinates | null) => void;
}

export function LocationInput({
  location,
  radius,
  onLocationChange,
  onRadiusChange,
  onCoordinatesChange,
}: LocationInputProps) {
  const { requestLocation, status, message } = useGeolocation(onCoordinatesChange);

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1 sm:w-[220px] sm:flex-none">
        <MapPin
          aria-hidden="true"
          className="pointer-events-none absolute start-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
        />
        <input
          id="home-location-filter"
          type="text"
          placeholder="Filter by location"
          value={location}
          onChange={(event) => {
            onLocationChange(event.target.value);
            onCoordinatesChange(null);
          }}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-11 pe-4 text-[14px] outline-none transition-colors focus:border-[#0D162B]"
          aria-label="Filter by location"
        />
      </label>
      <label className="sr-only" htmlFor="location-radius">
        Search radius
      </label>
      <select
        id="location-radius"
        value={radius}
        onChange={(event) => onRadiusChange(Number(event.target.value) as LocationRadius)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
      >
        {LOCATION_RADII.map((value) => (
          <option key={value} value={value}>
            Within {value} km
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={requestLocation}
        disabled={status === "locating"}
        className="whitespace-nowrap rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
      >
        {status === "locating" ? "Locating…" : "Use my location"}
      </button>
      {message && (
        <p role="status" aria-live="polite" className="text-sm text-gray-600 sm:basis-full">
          {message}
        </p>
      )}
    </div>
  );
}
