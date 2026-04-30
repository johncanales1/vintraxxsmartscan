/**
 * SessionRegistry — process-wide index of live GPS sessions.
 *
 * Used to:
 *   • route a downstream command from REST → the right TCP socket
 *   • close a stale session when the same terminal reconnects
 *   • emit health metrics (online count, by status…)
 *
 * Single-process scope: this is in-memory. When (if) we cluster the gateway
 * we'll fan messages out via Redis pub/sub instead. Phase 0 keeps it simple.
 */

import type { Session } from './Session';

class SessionRegistryImpl {
  private byTerminalId = new Map<string, Session>();
  private byPhoneBcd = new Map<string, Session>();
  /** All live sessions (including not-yet-authenticated ones). */
  private all = new Set<Session>();

  add(session: Session): void {
    this.all.add(session);
  }

  /**
   * Bind a session to a (terminalId, imei). If another session is already
   * registered under the same terminalId, that one is closed and replaced —
   * this happens when a device reboots without a clean disconnect.
   */
  bind(session: Session, terminalId: string, imei: string): void {
    const existing = this.byTerminalId.get(terminalId);
    if (existing && existing !== session) {
      existing.log.info('Replacing stale session for terminal', { terminalId });
      existing.close('replaced by newer connection');
      this.remove(existing);
    }
    this.byTerminalId.set(terminalId, session);
    this.byPhoneBcd.set(imei, session);
  }

  remove(session: Session): void {
    this.all.delete(session);
    // Only delete index entries if THIS session is the one currently mapped.
    // When a device reconnects, `bind()` replaces the OLD session with the NEW
    // one in both indexes; the OLD session's socket-close handler fires later
    // and calls remove(OLD). Without this identity check we'd unmap the NEW
    // session and the dispatcher would lose track of it.
    if (session.terminalId && this.byTerminalId.get(session.terminalId) === session) {
      this.byTerminalId.delete(session.terminalId);
    }
    if (session.phoneBcd && this.byPhoneBcd.get(session.phoneBcd) === session) {
      this.byPhoneBcd.delete(session.phoneBcd);
    }
  }

  getByTerminalId(terminalId: string): Session | undefined {
    return this.byTerminalId.get(terminalId);
  }

  getByPhoneBcd(phoneBcd: string): Session | undefined {
    return this.byPhoneBcd.get(phoneBcd);
  }

  /** Total live sessions (including unauthenticated). */
  size(): number {
    return this.all.size;
  }

  /** Authenticated, terminal-bound sessions. */
  onlineCount(): number {
    return this.byTerminalId.size;
  }

  *iter(): IterableIterator<Session> {
    yield* this.all;
  }

  /** Snapshot for the /health endpoint. */
  snapshot(): { total: number; online: number; unauthenticated: number } {
    return {
      total: this.all.size,
      online: this.byTerminalId.size,
      unauthenticated: this.all.size - this.byTerminalId.size,
    };
  }
}

export const SessionRegistry = new SessionRegistryImpl();
