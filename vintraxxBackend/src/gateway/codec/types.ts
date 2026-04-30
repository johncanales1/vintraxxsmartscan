/**
 * Strongly-typed shapes for decoded JT/T 808 messages used by the gateway.
 *
 * Each upstream message ID has a `Decoded*` type and each downstream ID has an
 * `Encode*Input` type. These are produced/consumed by the per-message codec
 * files under `./messages/`.
 */

/** Parsed message header (§1.5). */
export interface MessageHeader {
  msgId: number;
  /** Body length in bytes (extracted from the body-properties word). */
  bodyLength: number;
  /** Encryption type, 0..7. 0 = none, 1 = RSA per spec; we only support 0. */
  encryptType: number;
  /** True when the original logical message was split across multiple frames. */
  isSubpackage: boolean;
  /**
   * Phone-number / IMEI as 12 BCD digits (6 bytes). For 2019-spec terminals
   * this is the 15-digit IMEI (left-padded with zeros if shorter).
   */
  phoneBcd: string;
  /** Per-message running serial number (16-bit). */
  msgSerial: number;
  /** Total subpackage count (only populated when isSubpackage is true). */
  subpackageTotal?: number;
  /** 1-based subpackage index (only populated when isSubpackage is true). */
  subpackageIndex?: number;
}

/** Decoded body of 0x0100 — Terminal Registration. */
export interface DecodedRegister {
  provinceId: number;
  cityId: number;
  manufacturerId: string; // 5 ASCII bytes
  terminalModel: string; // 20 (or 30 for 2019) ASCII bytes, NUL-padded
  terminalId: string; // 7 (or 30 for 2019) ASCII bytes
  plateColor: number;
  plateNumber: string; // GBK-ish ASCII
}

/** Decoded body of 0x0102 — Terminal Authentication. */
export interface DecodedAuth {
  authCode: string;
  /** 2019-spec terminals append IMEI (15 digits) and software version. */
  imei?: string;
  softwareVersion?: string;
}

/** Encoded input for 0x8001 — Platform General Response. */
export interface EncodePlatformResponseInput {
  /** Serial of the original terminal message we're acknowledging. */
  replyToSerial: number;
  /** Message ID of the original terminal message we're acknowledging. */
  replyToMsgId: number;
  /** Result code (see PlatformResult). */
  result: number;
}

/** Encoded input for 0x8100 — Terminal Registration Response. */
export interface EncodeRegisterResponseInput {
  /** Serial of the original 0x0100 message we're responding to. */
  replyToSerial: number;
  /** Result code (see RegisterResult). */
  result: number;
  /**
   * Auth code to issue to the terminal. Required when result === OK, must be
   * absent otherwise. Random 32-char ASCII recommended.
   */
  authCode?: string;
}

/** Encoded input for any message that has no body (e.g. heartbeat ack stub). */
export interface EncodeEmptyBodyInput {
  // intentional empty marker — keeps the function signature uniform
}

/** Outcome of the framing layer reading from a TCP buffer. */
export interface FrameSplitResult {
  /** Zero or more complete frames (still escaped, with leading/trailing 0x7E). */
  frames: Buffer[];
  /** Bytes that did not yet form a complete frame; caller prepends to next read. */
  rest: Buffer;
}
