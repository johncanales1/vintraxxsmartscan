/**
 * GoogleMapsContext \u2014 register the Google Maps script once at the dashboard
 * layout level. All map components (DeviceMapPanel, fleet map) consume the
 * `isLoaded` flag from this context and render a graceful "Map not available"
 * placeholder when the script hasn't loaded (or no API key is configured).
 *
 * API key comes from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. If unset the loader
 * is skipped entirely so the build doesn't fail in dev environments.
 */

"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

interface GoogleMapsContextValue {
  isLoaded: boolean;
  loadError: Error | null;
  apiKeyConfigured: boolean;
}

const ctx = createContext<GoogleMapsContextValue>({
  isLoaded: false,
  loadError: null,
  apiKeyConfigured: false,
});

// MarkerClusterer is loaded by @react-google-maps/api when the corresponding
// component mounts; we pre-load the visualization library for any future
// heatmap usage. Keep this list stable to avoid script reloads.
const LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = [
  "geometry",
];

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const apiKeyConfigured = apiKey.length > 0;

  // useJsApiLoader requires a non-empty key. When unset we skip calling it
  // and emit a context value with `isLoaded: false` so map consumers render
  // the placeholder.
  const loaderResult = useJsApiLoader({
    id: "vintraxx-google-map-loader",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
    // The loader internally short-circuits when the key is empty by returning
    // `isLoaded:false` and never injecting the script tag.
  });

  const value = useMemo<GoogleMapsContextValue>(
    () => ({
      isLoaded: apiKeyConfigured ? loaderResult.isLoaded : false,
      loadError: apiKeyConfigured ? (loaderResult.loadError ?? null) : null,
      apiKeyConfigured,
    }),
    [apiKeyConfigured, loaderResult.isLoaded, loaderResult.loadError],
  );

  return <ctx.Provider value={value}>{children}</ctx.Provider>;
}

export function useGoogleMaps(): GoogleMapsContextValue {
  return useContext(ctx);
}
