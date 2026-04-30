/**
 * DeviceMapPanel \u2014 Google Map renderer used by:
 *   \u2022 /map (fleet view) when given an array of points
 *   \u2022 /devices/[id]?sub=live (single live marker)
 *   \u2022 /devices/[id]?sub=trips trip detail (polyline + start/end)
 *
 * Renders a graceful placeholder when:
 *   \u2022 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured
 *   \u2022 The script failed to load
 *   \u2022 No points are provided
 */

"use client";

import { useMemo } from "react";
import { GoogleMap, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "../_lib/GoogleMapsContext";
import { MapPin } from "lucide-react";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  /** Optional label for hover/click info window. */
  label?: string;
  /** Optional sub-line, e.g. speed/heading. */
  caption?: string;
  /** Marker color hint. */
  color?: "primary" | "online" | "offline" | "alarm";
}

interface Props {
  points: MapPoint[];
  /** Optional polyline (e.g. trip path). */
  polyline?: Array<{ lat: number; lng: number }>;
  /** Pin which point should show its info window initially. */
  highlightId?: string | null;
  className?: string;
  /** Override default map height (Tailwind class). */
  heightClass?: string;
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }; // US centroid
const DEFAULT_ZOOM_FLEET = 4;
const DEFAULT_ZOOM_SINGLE = 15;

const MARKER_PALETTE: Record<NonNullable<MapPoint["color"]>, string> = {
  primary: "#1B3A5F",
  online: "#10B981",
  offline: "#94A3B8",
  alarm: "#E11D48",
};

export function DeviceMapPanel({
  points,
  polyline,
  highlightId,
  className,
  heightClass = "h-[420px]",
}: Props) {
  const { isLoaded, loadError, apiKeyConfigured } = useGoogleMaps();

  // Compute center + zoom. With multiple points use a centroid; with one use
  // that point.
  const { center, zoom } = useMemo(() => {
    if (points.length === 0) {
      return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM_FLEET };
    }
    if (points.length === 1) {
      return {
        center: { lat: points[0].lat, lng: points[0].lng },
        zoom: DEFAULT_ZOOM_SINGLE,
      };
    }
    const avgLat =
      points.reduce((s, p) => s + p.lat, 0) / points.length;
    const avgLng =
      points.reduce((s, p) => s + p.lng, 0) / points.length;
    return { center: { lat: avgLat, lng: avgLng }, zoom: DEFAULT_ZOOM_FLEET };
  }, [points]);

  if (!apiKeyConfigured) {
    return (
      <div
        className={`relative ${heightClass} rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center ${className ?? ""}`}
      >
        <div className="text-center px-6">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">
            Map not configured
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment
            to enable live tracking.
          </p>
        </div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div
        className={`relative ${heightClass} rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-center ${className ?? ""}`}
      >
        <p className="text-sm text-rose-700">Failed to load Google Maps.</p>
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div
        className={`relative ${heightClass} rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center ${className ?? ""}`}
      >
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`relative ${heightClass} rounded-xl overflow-hidden border border-slate-200 ${className ?? ""}`}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={zoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {polyline && polyline.length > 1 && (
          <Polyline
            path={polyline}
            options={{
              strokeColor: "#1B3A5F",
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}
        {points.map((p) => {
          const color = MARKER_PALETTE[p.color ?? "primary"];
          // Use a simple data-URI SVG so we don't depend on external icon
          // sets; consistent across the dashboard.
          const icon = {
            path:
              "M12 2C7.589 2 4 5.589 4 10c0 5.518 6.875 11.418 7.166 11.665a1.25 1.25 0 0 0 1.668 0C13.125 21.418 20 15.518 20 10c0-4.411-3.589-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z",
            fillColor: color,
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#ffffff",
            scale: 1.5,
            anchor:
              typeof google !== "undefined" && google.maps
                ? new google.maps.Point(12, 22)
                : undefined,
          };
          return (
            <Marker
              key={p.id}
              position={{ lat: p.lat, lng: p.lng }}
              icon={icon}
              title={p.label}
            >
              {highlightId && highlightId === p.id && (
                <InfoWindow
                  position={{ lat: p.lat, lng: p.lng }}
                  options={{ pixelOffset:
                    typeof google !== "undefined" && google.maps
                      ? new google.maps.Size(0, -32)
                      : undefined,
                  }}
                >
                  <div className="text-xs">
                    <div className="font-semibold text-slate-900">
                      {p.label}
                    </div>
                    {p.caption && (
                      <div className="text-slate-500">{p.caption}</div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })}
      </GoogleMap>
    </div>
  );
}
