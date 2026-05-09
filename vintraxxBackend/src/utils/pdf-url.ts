/**
 * Shared helper to normalise a PDF file-path stored on disk into the public
 * URL the admin / dealer / user UIs can actually fetch.
 *
 * Reports live under `${cwd}/reports/<filename>.pdf` on the backend host
 * (see the `/reports` static mount in `src/index.ts`). The DB column for
 * both `FullReport.pdfUrl` and `Appraisal.pdfUrl` stores the absolute
 * filesystem path at generation time, so we strip everything but the
 * basename and re-prefix with the public origin.
 *
 * Kept in its own file so dealer + appraisal controllers share a single
 * source of truth — previously the dealer controller had an inline copy
 * while the appraisal dashboard endpoint had none (and therefore shipped
 * no `pdfUrl` at all, so the frontend's PDF button never rendered).
 */

import * as path from 'path';

const API_BASE_URL = 'https://api.vintraxx.com';

export function toPublicPdfUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  const filename = path.basename(filePath);
  return `${API_BASE_URL}/reports/${filename}`;
}
