/**
 * One-time (idempotent) orphan-file sweeper.
 *
 * Walks each known on-disk asset directory and deletes any file that no
 * row in the database still references. Used after the deleteUser fix
 * because legacy deletions left dead PDFs / dealer logos / QR codes
 * behind that just keep growing the disk.
 *
 *   Reports     →  matched against FullReport.pdfUrl & Appraisal.pdfUrl
 *   Logos       →  matched against User.logoUrl & User.originalLogoUrl
 *   QR codes    →  matched against User.qrCodeUrl
 *
 * Matching is by basename (defensive: stored values are sometimes absolute
 * paths, sometimes public URLs — both end with the same basename).
 *
 *   Usage:  npx ts-node scripts/sweep-orphan-files.ts            # delete
 *           npx ts-node scripts/sweep-orphan-files.ts --dry-run  # report only
 *
 * Safe to re-run: a fully clean run prints "0 orphans".
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REPORTS_DIR = path.resolve(process.cwd(), 'reports');
const LOGO_DIR = path.resolve(process.cwd(), 'src', 'assets', 'dealer-logos');
const QR_DIR = path.resolve(process.cwd(), 'src', 'assets', 'dealer-qrcodes');

function basenameOf(value: string | null | undefined): string | null {
  if (!value) return null;
  // Works for both absolute paths and URLs — `path.basename` happily
  // strips query strings off URLs because we feed it the .pathname slice.
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return path.basename(new URL(value).pathname);
    }
  } catch {
    /* fall through */
  }
  return path.basename(value);
}

async function listDirSafe(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') return [];
    throw err;
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Sweep starting (${dryRun ? 'DRY RUN — no deletions' : 'LIVE'})`);
  console.log('Dirs:', { REPORTS_DIR, LOGO_DIR, QR_DIR });

  // 1. Pull every referenced file basename out of the DB into a Set.
  const [fullReports, appraisals, users] = await Promise.all([
    prisma.fullReport.findMany({ select: { pdfUrl: true } }),
    prisma.appraisal.findMany({ select: { pdfUrl: true } }),
    prisma.user.findMany({
      select: { logoUrl: true, originalLogoUrl: true, qrCodeUrl: true },
    }),
  ]);

  const referencedReports = new Set<string>();
  for (const r of fullReports) {
    const b = basenameOf(r.pdfUrl);
    if (b) referencedReports.add(b);
  }
  for (const a of appraisals) {
    const b = basenameOf(a.pdfUrl);
    if (b) referencedReports.add(b);
  }

  const referencedLogos = new Set<string>();
  for (const u of users) {
    for (const v of [u.logoUrl, u.originalLogoUrl]) {
      const b = basenameOf(v);
      if (b) referencedLogos.add(b);
    }
  }

  const referencedQr = new Set<string>();
  for (const u of users) {
    const b = basenameOf(u.qrCodeUrl);
    if (b) referencedQr.add(b);
  }

  // 2. For each directory, compare the on-disk basename list to the
  //    referenced set and delete anything that isn't referenced.
  const summary = { reports: { kept: 0, deleted: 0 }, logos: { kept: 0, deleted: 0 }, qrCodes: { kept: 0, deleted: 0 } };
  type Bucket = keyof typeof summary;

  async function sweep(dir: string, referenced: Set<string>, bucket: Bucket) {
    const files = await listDirSafe(dir);
    for (const f of files) {
      // Skip dotfiles (.gitkeep, .gitignore, etc) — never user data.
      if (f.startsWith('.')) {
        summary[bucket].kept++;
        continue;
      }
      if (referenced.has(f)) {
        summary[bucket].kept++;
      } else {
        const full = path.join(dir, f);
        if (dryRun) {
          console.log(`  [dry] would delete: ${full}`);
        } else {
          try {
            await fs.unlink(full);
            console.log(`  removed: ${full}`);
          } catch (err: unknown) {
            const e = err as NodeJS.ErrnoException;
            if (e.code !== 'ENOENT') {
              console.warn(`  failed: ${full} (${e.code}: ${e.message})`);
              continue;
            }
          }
        }
        summary[bucket].deleted++;
      }
    }
  }

  await sweep(REPORTS_DIR, referencedReports, 'reports');
  await sweep(LOGO_DIR, referencedLogos, 'logos');
  await sweep(QR_DIR, referencedQr, 'qrCodes');

  console.log('\nSummary:');
  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Sweep failed:', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
