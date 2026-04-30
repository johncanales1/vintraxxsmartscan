/**
 * 0x8105 — Terminal Control (§3.13 of JT/T 808-2019).
 *
 * Body layout:
 *   offset  size  field
 *   0       1     controlType (uint8)
 *   1..N           parameters (semantics depend on controlType — see below)
 *
 * Control types defined by the spec:
 *   1  Wireless upgrade   — NOT SUPPORTED here (requires URL parameter list)
 *   2  Connect specified server — semicolon-separated parameter string
 *   3  Terminal shutdown  — no parameters
 *   4  Terminal reset     — soft reboot, no parameters
 *   5  Factory reset      — wipe parameters, no parameters
 *   6  Close data link    — drop the current TCP, no parameters
 *   7  Open data link     — reconnect, no parameters
 *
 * Most of these are DESTRUCTIVE — factory reset, shutdown, reboot all
 * disrupt service. The REST layer gates them behind super-admin
 * (`requireSuperAdmin`) and the command service further validates
 * `controlType ∈ allowList`.
 */

export const ControlType = {
  WIRELESS_UPGRADE: 1,
  CONNECT_SERVER: 2,
  SHUTDOWN: 3,
  RESET: 4,
  FACTORY_RESET: 5,
  CLOSE_DATA_LINK: 6,
  OPEN_DATA_LINK: 7,
} as const;

export type ControlTypeValue = (typeof ControlType)[keyof typeof ControlType];

/**
 * Subset of control types we currently EXPOSE through the REST API. Wireless
 * upgrade (1) needs a structured URL/auth-string payload that we don't yet
 * surface; "connect to specified server" (2) is too dangerous outside of a
 * controlled migration runbook so it stays out of the public API.
 */
export const SUPPORTED_CONTROL_TYPES: ReadonlySet<number> = new Set([
  ControlType.SHUTDOWN,
  ControlType.RESET,
  ControlType.FACTORY_RESET,
  ControlType.CLOSE_DATA_LINK,
  ControlType.OPEN_DATA_LINK,
]);

/**
 * Build the body. For all SUPPORTED_CONTROL_TYPES the body is just the
 * single control byte. We accept an optional `parameters` string which is
 * appended verbatim (UTF-8) for the few control types that need it — but
 * none of the currently-supported set use it, so passing a non-empty string
 * for those will throw to prevent typos.
 */
export function encode(args: {
  controlType: number;
  parameters?: string;
}): Buffer {
  if (!SUPPORTED_CONTROL_TYPES.has(args.controlType)) {
    throw new Error(
      `0x8105: unsupported control type ${args.controlType}; allowed=${[...SUPPORTED_CONTROL_TYPES].join(',')}`,
    );
  }
  if (args.parameters && args.parameters.length > 0) {
    throw new Error(
      `0x8105: control type ${args.controlType} does not take parameters`,
    );
  }
  return Buffer.from([args.controlType & 0xff]);
}
