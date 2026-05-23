/**
 * AdvancedMarkerWrapper — imperative React wrapper around
 * google.maps.marker.AdvancedMarkerElement (the non-deprecated
 * replacement for google.maps.Marker).
 *
 * Must be rendered as a child of <GoogleMap> from @react-google-maps/api.
 * The component itself renders nothing to the DOM — it manages the marker
 * on the underlying google.maps.Map instance obtained via useGoogleMap().
 */

"use client";

import { useEffect, useRef } from "react";
import { useGoogleMap } from "@react-google-maps/api";

interface Props {
  position: google.maps.LatLngLiteral;
  title?: string;
  /** Fill color for the SVG map-pin icon. */
  fillColor?: string;
  onClick?: () => void;
}

/** Build a pin-shaped SVG DOM element matching the project's marker style. */
function createPinSvg(fill: string): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 2C7.589 2 4 5.589 4 10c0 5.518 6.875 11.418 7.166 11.665a1.25 1.25 0 0 0 1.668 0C13.125 21.418 20 15.518 20 10c0-4.411-3.589-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="${fill}" stroke="#ffffff" stroke-width="1.5"/></svg>`;
  return container;
}

export function AdvancedMarkerWrapper({
  position,
  title,
  fillColor = "#dc2626",
  onClick,
}: Props) {
  const map = useGoogleMap();
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  // Stable ref for the click handler so we never need to re-attach the
  // DOM listener when the parent re-renders with a new closure.
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  // ── Create / destroy ──────────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      title: title ?? "",
      content: createPinSvg(fillColor),
      gmpClickable: true,
    });

    const handler = () => onClickRef.current?.();
    marker.addEventListener("gmp-click", handler as EventListener);
    markerRef.current = marker;

    return () => {
      marker.removeEventListener("gmp-click", handler as EventListener);
      marker.map = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // ── Sync props ────────────────────────────────────────────────────────
  useEffect(() => {
    if (markerRef.current) markerRef.current.position = position;
  }, [position.lat, position.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (markerRef.current && title !== undefined)
      markerRef.current.title = title;
  }, [title]);

  useEffect(() => {
    if (markerRef.current) markerRef.current.content = createPinSvg(fillColor);
  }, [fillColor]);

  // Renders nothing — the marker is managed imperatively on the Maps instance.
  return null;
}
