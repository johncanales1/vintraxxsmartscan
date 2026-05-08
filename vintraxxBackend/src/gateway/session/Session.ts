/**
 * Session — per-TCP-socket state for one connected GPS terminal.
 *
 * One Session is created when a socket opens, before we know which terminal
 * is on the other end. The handler for 0x0100 (registration) or 0x0102
 * (authentication) calls `bindTerminal()` once we've identified the device.
 *
 * The session owns:
 *   • the inbound byte buffer (for frame re-assembly across TCP reads)
 *   • per-message-serial outgoing sequence (for messages WE send)
 *   • a map of pending downstream commands waiting for a 0x0001 ack
 *
 * Sessions are NEVER reused across reconnects — the gateway closes the old
 * one and creates a new one when a device comes back. That keeps the buffer
 * state simple and avoids stale-data bugs.
 */

import type { Socket } from 'net';
import type { Logger } from 'winston';
import { encodeFrame } from '../codec';
import { MsgId, PlatformResult } from '../codec/constants';
import * as platformResp from '../codec/messages/m8001-platform-general-response';
import logger from '../../utils/logger';

/** Internal record kept while a downstream message awaits its 0x0001 ack. */
export interface PendingCommand {
  msgId: number;
  msgSerial: number;
  sentAt: Date;
  /** Resolves with the result code from the device's 0x0001 response. */
  resolve: (result: number) => void;
  /** Rejects on timeout / socket close. */
  reject: (err: Error) => void;
  timeoutHandle: NodeJS.Timeout;
}

export class Session {
  public readonly id: string;
  public readonly socket: Socket;
  public readonly remote: string;
  public readonly connectedAt: Date;
  public readonly log: Logger;

  /**
   * Raw BCD identifier from the first inbound JT/T 808 header. Always 12 BCD
   * digits, left-padded with zeros. Set once on the first frame and NEVER
   * mutated afterwards — downstream frame encoding relies on this being the
   * exact value the device sent so response headers match.
   */
  public phoneBcd: string | null = null;

  /**
   * Canonical device identifier (leading-zero-stripped form of `phoneBcd`).
   * Set by `bindTerminal()` after successful registration/authentication.
   * Used as the DB lookup key and log annotation.
   */
  public canonicalDeviceId: string | null = null;

  /** GpsTerminal.id once we've successfully matched/created the DB row. */
  public terminalId: string | null = null;

  /** True after a successful 0x0102 authentication. */
  public authenticated = false;

  public lastFrameAt: Date = new Date();
  public lastHeartbeatAt: Date | null = null;

  /** Bytes received but not yet split into frames. */
  public inboundBuffer: Buffer = Buffer.alloc(0);

  /** Reassembly buffer for sub-packaged messages, keyed by original msgSerial. */
  public subpackageReassembler: Map<number, Buffer[]> = new Map();

  /** Outgoing serial counter (16-bit, wraps). */
  private outSerial = 0;

  /** Downstream commands awaiting their 0x0001 ack, keyed by msgSerial. */
  public pendingCommands: Map<number, PendingCommand> = new Map();

  /** Number of consecutive bad frames — close the socket if this exceeds 10. */
  public consecutiveBadFrames = 0;

  constructor(args: { id: string; socket: Socket }) {
    this.id = args.id;
    this.socket = args.socket;
    const address = args.socket.remoteAddress ?? 'unknown';
    const port = args.socket.remotePort ?? 0;
    this.remote = `${address}:${port}`;
    this.connectedAt = new Date();
    this.log = logger.child({ sessionId: this.id, remote: this.remote });
  }

  /** Reset the bad-frame counter after a successful decode. */
  touchHealthy(): void {
    this.lastFrameAt = new Date();
    this.consecutiveBadFrames = 0;
  }

  /**
   * Attach this session to a particular terminal (after successful auth or
   * registration). Updates the structured logger so every subsequent line
   * carries the terminal id and JT/T 808 device identifier.
   */
  bindTerminal(args: { terminalId: string; deviceIdentifier: string }): void {
    this.terminalId = args.terminalId;
    this.canonicalDeviceId = args.deviceIdentifier;
    (this.log as Logger & { defaultMeta?: Record<string, unknown> }).defaultMeta = {
      ...(this.log as Logger & { defaultMeta?: Record<string, unknown> }).defaultMeta,
      terminalId: args.terminalId,
      deviceIdentifier: args.deviceIdentifier,
    };
  }

  /** Allocate the next outgoing 16-bit message serial. */
  nextSerial(): number {
    const s = this.outSerial;
    this.outSerial = (this.outSerial + 1) & 0xffff;
    return s;
  }

  /**
   * Send a fully-built downstream message body. Wraps it in the JT/T 808 frame
   * and writes to the socket. Caller MUST have already encoded the body.
   *
   * Returns the msgSerial that was used (so the caller can correlate with
   * subsequent 0x0001 acks).
   */
  writeFrame(args: { msgId: number; body: Buffer }): number {
    if (!this.phoneBcd) {
      throw new Error('Cannot write frame before phoneBcd is known');
    }
    const msgSerial = this.nextSerial();
    const frame = encodeFrame({
      msgId: args.msgId,
      phoneBcd: this.phoneBcd,
      msgSerial,
      body: args.body,
    });
    this.socket.write(frame);
    return msgSerial;
  }

  /**
   * Convenience helper: send an 0x8001 (Platform General Response) acking the
   * given inbound message. This MUST be called for every up-link message
   * (per spec §1.7) other than 0x0001 itself.
   */
  ack(replyToMsgId: number, replyToSerial: number, result: number = PlatformResult.OK): void {
    const body = platformResp.encode({ replyToMsgId, replyToSerial, result });
    this.writeFrame({ msgId: MsgId.PLATFORM_GENERAL_RESPONSE, body });
  }

  /** Close the socket cleanly. Safe to call multiple times. */
  close(reason: string): void {
    this.log.info('Closing session', { reason });
    // Reject any pending command futures.
    for (const cmd of this.pendingCommands.values()) {
      clearTimeout(cmd.timeoutHandle);
      cmd.reject(new Error(`Session closed: ${reason}`));
    }
    this.pendingCommands.clear();
    if (!this.socket.destroyed) {
      this.socket.end();
      // Force-destroy after 2s if FIN doesn't get acked.
      setTimeout(() => {
        if (!this.socket.destroyed) this.socket.destroy();
      }, 2000);
    }
  }
}
