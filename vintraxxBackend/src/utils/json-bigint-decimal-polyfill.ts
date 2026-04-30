/**
 * json-bigint-decimal-polyfill.ts — install JSON serializers for two
 * Prisma value types that don't ship with native JSON support.
 *
 * Why this exists:
 *   • Prisma maps `BigInt` columns (e.g. GpsTerminal.lastAlarmBits,
 *     GpsLocation.alarmBits/statusBits) to native `bigint`. `JSON.stringify`
 *     on a `bigint` THROWS (`TypeError: Do not know how to serialize a BigInt`).
 *     Every REST handler that returned a row containing a BigInt would 500.
 *   • Prisma maps `Decimal(p,s)` columns (latitude, longitude, speedKmh,
 *     distanceKm, mileageKm, …) to a `Decimal.js` instance whose default
 *     `toJSON()` returns a STRING. Mobile clients (and most JS consumers)
 *     expect a `number`. Passing the string into `react-native-maps` props
 *     silently drops the marker / polyline.
 *
 * Both fixes are installed once, globally, at process boot. We deliberately
 * import this module from `index.ts` BEFORE any Prisma model is touched so
 * the gateway process and any test harness pick up the same behaviour.
 *
 * Trade-offs we accept:
 *   • `BigInt → Number` loses precision above 2^53. JT/T 808 alarm/status
 *     bits are uint32, so they fit comfortably; we add a runtime guard that
 *     returns a string for unsafe magnitudes (logs a warning) instead of
 *     silently corrupting the value.
 *   • `Decimal → Number` similarly loses precision past ~15 significant
 *     digits. Our schemas use Decimal(10,7) for coordinates and Decimal(8,2)
 *     for distances; both are well within IEEE-754 safe range.
 *
 * If a future column needs lossless transport, override at the controller
 * layer rather than weakening this polyfill.
 */

import { Prisma } from '@prisma/client';
import logger from './logger';

/**
 * BigInt serialiser. Returns a Number when within `Number.MAX_SAFE_INTEGER`,
 * otherwise a string (so JSON.stringify still succeeds) and a warning so ops
 * know the field needs upgrading to a custom shape.
 */
// We use Object.defineProperty so the property is non-enumerable; otherwise
// every `for…in` iteration on a bigint via the prototype would surface it.
if (typeof (BigInt.prototype as unknown as { toJSON?: unknown }).toJSON !== 'function') {
  Object.defineProperty(BigInt.prototype, 'toJSON', {
    value: function toJSON(this: bigint): number | string {
      // Within safe integer range → emit as number (the common case for
      // 32-bit alarm flag fields).
      if (this <= BigInt(Number.MAX_SAFE_INTEGER) && this >= BigInt(Number.MIN_SAFE_INTEGER)) {
        return Number(this);
      }
      // Out of safe range — emit as string to avoid silent corruption.
      // Logging is best-effort: this only fires if a column with very large
      // bigints starts being serialised, which would be a schema oversight.
      logger.warn('BigInt out of safe integer range; serialising as string', {
        value: this.toString(),
      });
      return this.toString();
    },
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

/**
 * Prisma `Decimal.toJSON()` defaults to a string. Override to a Number for
 * the wire payload — clients that want lossless precision can hit the admin
 * endpoint that streams raw rows (none today).
 *
 * NOTE: `Prisma.Decimal` is the runtime constructor exposed by @prisma/client;
 * Decimal.js is the underlying implementation. We patch its prototype.
 */
const DecimalProto = (Prisma.Decimal.prototype as unknown) as {
  toJSON?: (this: { toNumber(): number; toString(): string }) => number | string;
  toNumber(): number;
  toString(): string;
};
if (
  typeof DecimalProto.toJSON !== 'function' ||
  // The default Decimal.js toJSON returns a string. We replace it
  // unconditionally so we know exactly what's installed.
  DecimalProto.toJSON !== installedDecimalToJSON
) {
  Object.defineProperty(Prisma.Decimal.prototype, 'toJSON', {
    value: installedDecimalToJSON,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

/**
 * Top-level function so the equality check above can identify our installed
 * version (vs the upstream default). Don't inline.
 */
function installedDecimalToJSON(
  this: { toNumber(): number; toString(): string },
): number | string {
  const n = this.toNumber();
  // Fall back to string if the value won't round-trip as a finite Number.
  // Decimal.js will return Infinity for values larger than ~1.8e308.
  if (!Number.isFinite(n)) {
    logger.warn('Decimal value outside finite Number range; serialising as string', {
      value: this.toString(),
    });
    return this.toString();
  }
  return n;
}

export const __polyfillInstalled = true;
