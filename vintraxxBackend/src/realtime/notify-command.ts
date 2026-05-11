/**
 * notify-command.ts — pg_notify wrapper for the gateway-direction command
 * channel.
 *
 * Why a separate channel from `gps_event`:
 *   • `gps_event` is BACKEND→listener→WS clients. Dropping a message there
 *     is a missed UI update, recoverable on refresh.
 *   • `gps_command` is BACKEND→GATEWAY. Dropping a message means a queued
 *     command sits in the DB until the device reconnects (handled by the
 *     dispatcher's poll-on-bind sweep). Losses are tolerable but separation
 *     keeps the semantics clean.
 *
 * Payload format: just `{ commandId }`. The dispatcher does the row lookup
 * itself so we don't have to keep this struct stable across versions.
 */

import prisma from '../config/db';
import logger from '../utils/logger';

export interface CommandQueuedEvent {
  commandId: string;
}

/** Fire-and-forget — emitter is the REST process. Errors are logged. */
export async function emitCommandQueued(event: CommandQueuedEvent): Promise<void> {
  try {
    const payload = JSON.stringify(event);
    // $executeRaw — pg_notify returns void, $queryRaw fails to deserialize.
    await prisma.$executeRaw`SELECT pg_notify('gps_command', ${payload}::text)`;
  } catch (err) {
    logger.warn('pg_notify gps_command failed (non-fatal)', {
      err: (err as Error).message,
      commandId: event.commandId,
    });
  }
}
