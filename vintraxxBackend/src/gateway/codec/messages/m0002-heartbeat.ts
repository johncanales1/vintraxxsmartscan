/**
 * 0x0002 — Terminal Heartbeat (§2.3).
 *
 * Empty body. The header alone is the heartbeat. Acked by 0x8001.
 */

export function decode(_body: Buffer): Record<string, never> {
  return {};
}
