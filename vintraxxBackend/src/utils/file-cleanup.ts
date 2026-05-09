/**
 * Centralised on-disk file deletion for assets owned by deletable rows
 * (FullReport.pdfUrl, Appraisal.pdfUrl, User.logoUrl/originalLogoUrl/qrCodeUrl).
 *
 * Why a dedicated helper:
 *   1. Two storage shapes are in the wild — older rows have ABSOLUTE
 *      filesystem paths (e.g. `/home/ec2-user/.../reports/foo.pdf`) while
 *      newer rows store the public URL (e.g. `https://api.vintraxx.com/
 *      assets/dealer-logos/abc.png`). Both must resolve to the same on-disk
 *      file. See `utils/pdf-url.ts` for the URL-vs-path duality.
 *   2. Every delete handler (deleteUser, deleteScan, deleteAppraisal, the
 *      orphan-sweep script) needs the same path resolution + traversal
 *      guard. Inlining `fs.unlink` in five places guarantees drift.
 *   3. Missing files must NEVER fail the DB delete. We swallow ENOENT and
 *      log everything else at warn level.
 *
 * Confined output dirs: anything resolving outside these three is rejected
 * to make path-traversal trivially impossible:
 *   • <cwd>/reports
 *   • <cwd>/src/assets/dealer-logos
 *   • <cwd>/src/assets/dealer-qrcodes
 */

import fs from 'fs/promises';
import path from 'path';
import logger from './logger';

const REPORTS_DIR = path.resolve(process.cwd(), 'reports');
const LOGO_DIR = path.resolve(process.cwd(), 'src', 'assets', 'dealer-logos');
const QR_DIR = path.resolve(process.cwd(), 'src', 'assets', 'dealer-qrcodes');

const ALLOWED_DIRS = [REPORTS_DIR, LOGO_DIR, QR_DIR];

/**
 * Map a stored value (absolute path OR public URL) to the local filesystem
 * path. Returns null if the value isn't recognised — caller should treat
 * null as "nothing to delete" (NOT an error).
 */
export function resolveLocalPath(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;

  // Absolute filesystem path — trust if it lives under one of the allowed
  // directories.
  if (path.isAbsolute(value)) {
    const resolved = path.resolve(value);
    return ALLOWED_DIRS.some((dir) => resolved.startsWith(dir + path.sep)) ? resolved : null;
  }

  // Public URL — match `/reports/<basename>` or `/assets/<sub>/<basename>`.
  // We don't trust the host segment; only the path tail matters.
  try {
    const parsed = new URL(value);
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (segments[0] === 'reports' && segments.length === 2) {
      return path.resolve(REPORTS_DIR, segments[1]);
    }
    if (segments[0] === 'assets' && segments[1] === 'dealer-logos' && segments.length === 3) {
      return path.resolve(LOGO_DIR, segments[2]);
    }
    if (segments[0] === 'assets' && segments[1] === 'dealer-qrcodes' && segments.length === 3) {
      return path.resolve(QR_DIR, segments[2]);
    }
  } catch {
    // Not a parseable URL — fall through.
  }

  return null;
}

/**
 * Delete a file referenced by a stored DB value. Best-effort: missing files
 * are silently OK (the row is going away regardless). Other errors are
 * logged at warn but never thrown.
 */
export async function deleteLocalFile(value: string | null | undefined): Promise<void> {
  const resolved = resolveLocalPath(value);
  if (!resolved) return;
  try {
    await fs.unlink(resolved);
    logger.info('file-cleanup: removed', { path: resolved });
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') return; // already gone — fine
    logger.warn('file-cleanup: failed to delete (non-fatal)', {
      path: resolved,
      code: e.code,
      message: e.message,
    });
  }
}

/**
 * Best-effort delete of multiple files in parallel. Same swallow-and-log
 * semantics as `deleteLocalFile`.
 */
export async function deleteLocalFiles(values: Array<string | null | undefined>): Promise<void> {
  await Promise.all(values.map((v) => deleteLocalFile(v)));
}

/** Exposed so the sweep script + tests can introspect without re-deriving. */
export const KNOWN_DIRS = {
  reports: REPORTS_DIR,
  logos: LOGO_DIR,
  qrCodes: QR_DIR,
};
