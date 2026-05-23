/**
 * suppressMapsWarnings — narrowly filters one informational warning that
 * the Google Maps JavaScript API emits whenever a map is created with a
 * `mapId` AND the user picks the Satellite (or Hybrid / "Satellite +
 * Labels") map type:
 *
 *   "A Map's preregistered map type may not apply all custom styles
 *    when a mapId is present. When a mapId is present, map styles are
 *    controlled via the cloud console for all default map types except
 *    for satellite. Please see documentation at
 *    https://developers.google.com/maps/documentation/javascript/styling#cloud_tooling"
 *
 * We have to keep `mapId` because it is required for
 * `google.maps.marker.AdvancedMarkerElement` (without it the API logs a
 * hard error: "The map is initialized without a valid Map ID, which
 * will prevent use of Advanced Markers.")
 *
 * The cloud-console / satellite combination is documented and inherent
 * — there is no JS-side configuration that prevents it. The warning is
 * purely informational and does not affect rendering of either the map
 * or the markers, so we filter it at the `console.warn` boundary.
 *
 * Importing this module has the side effect of patching `console.warn`
 * exactly once. The patch is a no-op on the server (Next.js App Router
 * may import it during SSR) and idempotent on the client so HMR /
 * StrictMode double-invocation cannot stack patches.
 */

declare global {
  // eslint-disable-next-line no-var
  var __vtxxMapsWarnPatched__: boolean | undefined;
}

if (typeof window !== 'undefined' && !globalThis.__vtxxMapsWarnPatched__) {
  globalThis.__vtxxMapsWarnPatched__ = true;

  const originalWarn = console.warn.bind(console);

  // Match the stable, identifying fragment of the warning text. We do
  // NOT match on the full string so a future Google copy-edit (e.g.
  // adding/removing a sentence) does not silently re-enable the noise.
  const SUPPRESSED_FRAGMENT =
    "preregistered map type may not apply all custom styles when a mapId is present";

  console.warn = (...args: unknown[]) => {
    for (const a of args) {
      if (typeof a === 'string' && a.includes(SUPPRESSED_FRAGMENT)) return;
    }
    originalWarn(...args);
  };
}

export {};
