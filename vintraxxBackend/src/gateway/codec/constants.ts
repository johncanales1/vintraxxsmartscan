/**
 * JT/T 808 protocol message ID constants.
 *
 * Source: GPS_OBD_SCANNER.md §1.5–§2 + §3.* appendices.
 *
 * Up-link  (terminal → platform): 0x00xx, 0x01xx, 0x02xx, 0x06xx, 0x07xx, 0x09xx
 * Down-link (platform → terminal): 0x80xx, 0x81xx, 0x82xx, 0x83xx
 *
 * Phase 0 only implements the registration / authentication / heartbeat path.
 * Later phases add 0x0200, 0x0900 and the platform-issued commands.
 */
export const MsgId = {
  // ── Up-link (terminal → platform) ───────────────────────────────────────────
  TERMINAL_GENERAL_RESPONSE: 0x0001,
  TERMINAL_HEARTBEAT: 0x0002,
  TERMINAL_LOGOUT: 0x0003,
  TERMINAL_REGISTER: 0x0100,
  TERMINAL_AUTH: 0x0102,
  PROACTIVE_VERSION_INFO: 0x0205,
  LOCATION_REPORT: 0x0200,
  BATCH_LOCATION_REPORT: 0x0704,
  CAN_BROADCAST: 0x020a,
  BMS_DATA_FLOW: 0x0210,
  DATA_UPLINK: 0x0900,
  DRIVER_INFO: 0x0702,
  TERMINAL_UPGRADE_RESULT: 0x0108,
  DRIVING_LICENSE_DATA: 0x0252,

  // ── Down-link (platform → terminal) ─────────────────────────────────────────
  PLATFORM_GENERAL_RESPONSE: 0x8001,
  REGISTER_RESPONSE: 0x8100,
  SET_TERMINAL_PARAMS: 0x8103,
  QUERY_TERMINAL_PARAMS: 0x8104,
  TERMINAL_CONTROL: 0x8105,
  LOCATION_QUERY: 0x8201,
  TEMPORARY_TRACKING_CONTROL: 0x8202,
  TEXT_DISTRIBUTION: 0x8300,
  TEXT_REPLY: 0x6006,
  DATA_PASSTHROUGH_DOWN: 0x8900,
} as const;

export type MsgIdValue = (typeof MsgId)[keyof typeof MsgId];

/**
 * Frame boundary marker per spec §1.5. The same byte appears at start and end
 * of every framed message; bytes inside the body that collide with 0x7E (or
 * with the escape introducer 0x7D) are escaped.
 */
export const FRAME_DELIMITER = 0x7e;
export const ESCAPE_INTRODUCER = 0x7d;

/**
 * Message-body-properties bit layout (16-bit field, big-endian).
 * Bit positions from spec §3.x appendix.
 */
export const BODY_PROPS = {
  BODY_LENGTH_MASK: 0x03ff, // bits 0..9
  ENCRYPT_SHIFT: 10, // bits 10..12 (3-bit encryption type, 0 = no encryption)
  ENCRYPT_MASK: 0x1c00,
  SUBPACKAGE_BIT: 0x2000, // bit 13 — message split across multiple frames
  RESERVED_MASK: 0xc000, // bits 14..15
} as const;

/**
 * Platform General Response result codes (§3.2). Echoed back to the terminal
 * in the body of an 0x8001 message.
 */
export const PlatformResult = {
  OK: 0,
  FAILURE: 1,
  MESSAGE_ERROR: 2,
  UNSUPPORTED: 3,
  ALARM_CONFIRM: 4,
} as const;

/**
 * Terminal Registration Response result codes (§3.4). Returned in the body of
 * an 0x8100 message. Anything other than OK closes the session.
 */
export const RegisterResult = {
  OK: 0,
  VEHICLE_ALREADY_REGISTERED: 1,
  NO_SUCH_VEHICLE: 2,
  TERMINAL_ALREADY_REGISTERED: 3,
  NO_SUCH_TERMINAL: 4,
} as const;
