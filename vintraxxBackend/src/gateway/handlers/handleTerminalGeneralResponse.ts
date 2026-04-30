/**
 * 0x0001 — Terminal General Response handler.
 *
 * The device acks one of OUR previously-sent commands. We resolve the
 * matching pending-command future on the session.
 *
 * Phase 0 has no outbound commands, so this handler is essentially a no-op
 * for now — but we still wire it up so Phase 4 (commands) drops in cleanly.
 */

import type { Session } from '../session/Session';
import type { DecodedTerminalGeneralResponse } from '../codec/messages/m0001-terminal-general-response';

export function handleTerminalGeneralResponse(
  session: Session,
  body: DecodedTerminalGeneralResponse,
): void {
  const pending = session.pendingCommands.get(body.replyToSerial);
  if (!pending) {
    session.log.debug('Received 0x0001 with no matching pending command', {
      replyToSerial: body.replyToSerial,
      replyToMsgId: body.replyToMsgId,
      result: body.result,
    });
    return;
  }
  clearTimeout(pending.timeoutHandle);
  session.pendingCommands.delete(body.replyToSerial);
  pending.resolve(body.result);
}
