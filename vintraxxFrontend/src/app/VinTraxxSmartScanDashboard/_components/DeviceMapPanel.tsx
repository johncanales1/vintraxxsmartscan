/**
 * DeviceMapPanel — Google Map renderer used by:
 *   • /map (fleet view) when given an array of points
 *   • /devices/[id]?sub=live (single live marker)
 *   • /devices/[id]?sub=trips trip detail (polyline + start/end)
 *
 * Renders a graceful placeholder when:
 *   • NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured
 *   • The script failed to load
 *   • No points are provided
 *
 * Marker colors match the admin dashboard:
 *   • Online (live) → Red (#dc2626)
 *   • Offline → Gray (#94a3b8)
 *
 * When `terminal` + `location` are provided on a MapPoint, the InfoWindow
 * renders a rich TerminalInfoCard popup with vehicle telemetry, address,
 * battery status, etc.
 */

"use client";

import { Fragment, useMemo, useState } from "react";
import { GoogleMap, Polyline, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "../_lib/GoogleMapsContext";
import { MapPin } from "lucide-react";
import { AdvancedMarkerWrapper } from "./AdvancedMarkerWrapper";
import type { GpsTerminal, GpsLocation, GpsObdSnapshot } from "../_lib/types";
import TerminalInfoCard from "./TerminalInfoCard";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  /** Optional label for hover/click info window (fallback when no terminal). */
  label?: string;
  /** Optional sub-line, e.g. speed/heading (fallback when no terminal). */
  caption?: string;
  /** Marker color hint. */
  color?: "primary" | "online" | "offline" | "alarm";
  /** Terminal data for rich InfoWindow popup. */
  terminal?: GpsTerminal;
  /** Location data for rich InfoWindow popup. */
  location?: GpsLocation | null;
  /** OBD snapshot for rich InfoWindow popup. */
  obd?: GpsObdSnapshot | null;
  /** Stock number for rich InfoWindow popup. */
  stockNumber?: string | null;
  /** Last trip ended at for rich InfoWindow popup. */
  lastTripEndedAt?: string | null;
}

interface Props {
  points: MapPoint[];
  /** Optional polyline (e.g. trip path). */
  polyline?: Array<{ lat: number; lng: number }>;
  /** Pin which point should show its info window initially (controlled mode). */
  highlightId?: string | null;
  /** Callback when a marker is clicked (controlled mode). */
  onSelect?: (id: string | null) => void;
  className?: string;
  /** Override default map height (Tailwind class). */
  heightClass?: string;
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }; // US centroid
const DEFAULT_ZOOM_FLEET = 4;
const DEFAULT_ZOOM_SINGLE = 15;

/**
 * Marker colors matching the admin dashboard:
 *   • Online (live) → Red (matches admin's "#dc2626")
 *   • Offline → Gray
 */
const MARKER_PALETTE: Record<NonNullable<MapPoint["color"]>, string> = {
  primary: "#1B3A5F",
  online: "#dc2626",   // Red for live/online (matches admin)
  offline: "#94a3b8",  // Gray for offline
  alarm: "#E11D48",
};

export function DeviceMapPanel({
  points,
  polyline,
  highlightId,
  onSelect,
  className,
  heightClass = "h-[420px]",
}: Props) {
  const { isLoaded, loadError, apiKeyConfigured } = useGoogleMaps();
  
  // Internal state for selected marker when in uncontrolled mode.
  // If highlightId is provided, we use that (controlled mode).
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedId = highlightId !== undefined ? highlightId : internalSelectedId;

  const handleMarkerClick = (id: string) => {
    if (onSelect) {
      onSelect(id);
    } else {
      setInternalSelectedId(id);
    }
  };

  const handleInfoWindowClose = () => {
    if (onSelect) {
      onSelect(null);
    } else {
      setInternalSelectedId(null);
    }
  };

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
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
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
          const isSelected = selectedId === p.id;
          return (
            <Fragment key={p.id}>
              <AdvancedMarkerWrapper
                position={{ lat: p.lat, lng: p.lng }}
                title={p.label}
                fillColor={color}
                onClick={() => handleMarkerClick(p.id)}
              />
              {isSelected && (
                <InfoWindow
                  position={{ lat: p.lat, lng: p.lng }}
                  onCloseClick={handleInfoWindowClose}
                  options={{
                    pixelOffset:
                      typeof google !== "undefined" && google.maps
                        ? new google.maps.Size(0, -34)
                        : undefined,
                  }}
                >
                  {p.terminal ? (
                    <TerminalInfoCard
                      terminal={p.terminal}
                      location={p.location ?? null}
                      obd={p.obd ?? null}
                      stockNumber={p.stockNumber}
                      lastTripEndedAt={p.lastTripEndedAt}
                      compact
                    />
                  ) : (
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900">
                        {p.label}
                      </div>
                      {p.caption && (
                        <div className="text-slate-500">{p.caption}</div>
                      )}
                    </div>
                  )}
                </InfoWindow>
              )}
            </Fragment>
          );
        })}
      </GoogleMap>
    </div>
  );
}
