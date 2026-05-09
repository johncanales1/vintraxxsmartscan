import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { APP_CONSTANTS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';
import { AdminJwtPayload } from '../middleware/adminAuth';
import { generateOtpCode } from '../utils/helpers';
import { deleteLocalFile, deleteLocalFiles } from '../utils/file-cleanup';
import prisma from '../config/db';
import logger from '../utils/logger';

const LOGO_DIR = path.join(process.cwd(), 'src', 'assets', 'dealer-logos');
const QR_CODE_DIR = path.join(process.cwd(), 'src', 'assets', 'dealer-qrcodes');
if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });
if (!fs.existsSync(QR_CODE_DIR)) fs.mkdirSync(QR_CODE_DIR, { recursive: true });

function processBase64Image(base64: string, dir: string, prefix: string): string | null {
  const matches = base64.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return null;
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
  const apiBase = env.NODE_ENV === 'production' ? 'https://api.vintraxx.com' : `http://localhost:${env.PORT}`;
  const subdir = dir.includes('dealer-qrcodes') ? 'dealer-qrcodes' : 'dealer-logos';
  return `${apiBase}/assets/${subdir}/${filename}`;
}

function generateAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' } as jwt.SignOptions);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

const ADMIN_LOGIN_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Step 1 of admin login: verify email + password, then generate & email a
 * fresh 6-digit OTP. The JWT is NOT issued here — `verifyAdminLoginOtp`
 * does that after the operator types the code in.
 *
 * Calling this twice in a row (e.g. operator clicks "resend") is safe: the
 * prior unused code is wiped and replaced. Old verified codes remain in
 * the table as audit trail (deleted lazily by the auth-cleanup cron).
 *
 * Per product decision (May 2026), 2FA is always-on for admins — no
 * "remember device for N days" path.
 */
export async function adminLoginRequestOtp(email: string, password: string) {
  logger.info('Admin login attempt (step 1: password)', { email, hasPassword: !!password });
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    logger.warn('Admin login failed: email not found', { email });
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    logger.warn('Admin login failed: wrong password', { email });
    throw new AppError('Invalid email or password', 401);
  }

  const code = generateOtpCode(6);
  const expiresAt = new Date(Date.now() + ADMIN_LOGIN_OTP_TTL_MS);

  // Wipe any prior unused codes for this email so a stale code can't be
  // used after a re-request. We keep verified rows for audit.
  await prisma.otp.deleteMany({ where: { email, verified: false } });
  await prisma.otp.create({ data: { email, code, expiresAt } });

  if (env.NODE_ENV !== 'test') {
    const { sendOtpEmail } = await import('./email.service');
    await sendOtpEmail(email, code);
  }
  if (env.NODE_ENV !== 'production') {
    logger.info(`[DEV] Admin login OTP for ${email}: ${code}`);
  }

  logger.info(`Admin login: OTP issued`, { email });
  return { otpRequired: true as const, email };
}

/**
 * Step 2 of admin login: verify the 6-digit OTP, mark it consumed, and
 * issue the JWT. `superAdmin` is read from the LIVE admin row so a
 * promotion that happened between steps is honoured immediately.
 */
export async function verifyAdminLoginOtp(email: string, code: string) {
  const record = await prisma.otp.findFirst({
    where: { email, code, verified: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) {
    logger.warn('Admin login OTP failed: invalid or expired', { email });
    throw new AppError('Invalid or expired verification code', 400);
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    // Shouldn't happen — step 1 verified the row exists — but defend.
    logger.warn('Admin login OTP failed: admin row vanished', { email });
    throw new AppError('Invalid or expired verification code', 400);
  }

  await prisma.otp.update({ where: { id: record.id }, data: { verified: true } });

  const token = generateAdminToken({
    adminId: admin.id,
    email: admin.email,
    role: 'admin',
    superAdmin: admin.superAdmin,
  });
  logger.info(`Admin logged in (OTP verified): ${admin.email}`, { superAdmin: admin.superAdmin });
  return {
    admin: { id: admin.id, email: admin.email, superAdmin: admin.superAdmin },
    token,
  };
}

export async function getAdminProfile(adminId: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new AppError('Admin not found', 404);
  return {
    id: admin.id,
    email: admin.email,
    superAdmin: admin.superAdmin,
    createdAt: admin.createdAt,
  };
}

export async function changeAdminPassword(adminId: string, currentPassword: string, newPassword: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new AppError('Admin not found', 404);

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400);

  const hash = await bcrypt.hash(newPassword, APP_CONSTANTS.BCRYPT_SALT_ROUNDS);
  await prisma.admin.update({ where: { id: adminId }, data: { passwordHash: hash } });
  logger.info(`Admin password changed: ${admin.email}`);
}

export async function sendAdminEmailChangeOtp(adminId: string, newEmail: string) {
  const existing = await prisma.admin.findUnique({ where: { email: newEmail } });
  if (existing) throw new AppError('Email already in use', 409);

  const code = generateOtpCode(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.otp.deleteMany({ where: { email: newEmail } });
  await prisma.otp.create({ data: { email: newEmail, code, expiresAt } });

  if (env.NODE_ENV !== 'test') {
    const { sendOtpEmail } = await import('./email.service');
    await sendOtpEmail(newEmail, code);
  }

  if (env.NODE_ENV !== 'production') {
    logger.info(`[DEV] Admin email change OTP for ${newEmail}: ${code}`);
  }
}

export async function verifyAndChangeAdminEmail(adminId: string, newEmail: string, otp: string) {
  const record = await prisma.otp.findFirst({
    where: { email: newEmail, code: otp, verified: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new AppError('Invalid or expired OTP', 400);

  await prisma.otp.update({ where: { id: record.id }, data: { verified: true } });
  const admin = await prisma.admin.update({ where: { id: adminId }, data: { email: newEmail } });
  await prisma.otp.deleteMany({ where: { email: newEmail } });

  // CRITICAL #9: preserve `superAdmin` on the new JWT. Without this a
  // super-admin who simply changes their email loses super-admin privilege
  // until they re-login (because requireSuperAdmin reads `req.admin.superAdmin`
  // off the token, not the DB). Mirrors what adminLogin does at the same
  // call site.
  const token = generateAdminToken({
    adminId: admin.id,
    email: admin.email,
    role: 'admin',
    superAdmin: admin.superAdmin,
  });
  logger.info(`Admin email changed to: ${newEmail}`, { superAdmin: admin.superAdmin });
  return { admin: { id: admin.id, email: admin.email, superAdmin: admin.superAdmin }, token };
}

export async function verifyAdminPassword(adminId: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new AppError('Admin not found', 404);
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw new AppError('Invalid password', 401);
  return true;
}

// ── Users CRUD ────────────────────────────────────────────────────────────────

/**
 * Explicit `select` projection for User rows that are safe to return to the
 * admin UI. We deliberately OMIT `passwordHash`, `googleId`, `microsoftId`
 * and `originalLogoUrl` — bcrypt hashes aren't plaintext but still give an
 * attacker an offline brute-force target if a session is ever compromised,
 * and the two OAuth provider ids are internal-only linkage keys that the UI
 * never needs. All list/detail endpoints reuse this to keep the shape
 * consistent.
 */
const SAFE_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  authProvider: true,
  isDealer: true,
  pricePerLaborHour: true,
  logoUrl: true,
  qrCodeUrl: true,
  maxScannerDevices: true,
  maxVins: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getUsers(type?: 'dealer' | 'regular') {
  const where = type === 'dealer' ? { isDealer: true } : type === 'regular' ? { isDealer: false } : {};
  return prisma.user.findMany({
    where,
    select: {
      ...SAFE_USER_SELECT,
      // gpsTerminals count powers the "📡 N GPS devices" chip on the
      // admin's Dealer/Regular cards. Cheap addition (Prisma resolves it
      // in the same join Group) and zero impact for users with none.
      _count: {
        select: {
          scans: true,
          usedScannerDevices: true,
          usedVins: true,
          gpsTerminals: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...SAFE_USER_SELECT,
      scans: {
        include: { fullReport: true },
        orderBy: { receivedAt: 'desc' },
      },
      usedScannerDevices: { orderBy: { lastUsedAt: 'desc' } },
      usedVins: { orderBy: { lastUsedAt: 'desc' } },
    },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

/**
 * Normalise a logo/QR payload. If the value is a `data:image/...` URL, the
 * base64 bytes are decoded and persisted to disk (returning the stored
 * URL); otherwise the value is left untouched. `null` explicitly clears
 * the field (used by the edit form to remove a logo).
 */
function normaliseImageField(
  value: string | null | undefined,
  dir: string,
  filenamePrefix: string,
): string | null | undefined {
  if (value === undefined) return undefined; // field not provided — don't touch
  if (value === null) return null;            // explicit clear
  if (value.startsWith('data:image/')) {
    return processBase64Image(value, dir, `${filenamePrefix}-${Date.now()}`);
  }
  return value;
}

export async function createUser(data: {
  email: string;
  password: string;
  fullName?: string;
  isDealer?: boolean;
  pricePerLaborHour?: number;
  logoUrl?: string | null;
  qrCodeUrl?: string | null;
  maxScannerDevices?: number | null;
  maxVins?: number | null;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already exists', 409);

  const passwordHash = await bcrypt.hash(data.password, APP_CONSTANTS.BCRYPT_SALT_ROUNDS);
  const logoUrl = normaliseImageField(data.logoUrl, LOGO_DIR, 'admin') ?? null;
  const qrCodeUrl = normaliseImageField(data.qrCodeUrl, QR_CODE_DIR, 'admin-qr') ?? null;

  return prisma.user.create({
    data: {
      email: data.email,
      fullName: data.fullName,
      passwordHash,
      isDealer: data.isDealer ?? false,
      pricePerLaborHour: data.pricePerLaborHour,
      logoUrl,
      qrCodeUrl,
      maxScannerDevices: data.maxScannerDevices ?? undefined,
      maxVins: data.maxVins ?? undefined,
    },
    select: { ...SAFE_USER_SELECT },
  });
}

export async function updateUser(userId: string, data: {
  email?: string;
  fullName?: string | null;
  isDealer?: boolean;
  pricePerLaborHour?: number | null;
  logoUrl?: string | null;
  qrCodeUrl?: string | null;
  maxScannerDevices?: number | null;
  maxVins?: number | null;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  // Normalise any image payload coming in. Before this fix `updateUser`
  // stored `data:image/...` blobs verbatim in the DB because only
  // `createUser` processed them — a latent foot-gun the first time an
  // "edit logo" UI shipped.
  const logoUrl = normaliseImageField(data.logoUrl, LOGO_DIR, 'admin');
  const qrCodeUrl = normaliseImageField(data.qrCodeUrl, QR_CODE_DIR, 'admin-qr');

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(qrCodeUrl !== undefined ? { qrCodeUrl } : {}),
      },
      select: { ...SAFE_USER_SELECT },
    });
  } catch (err: any) {
    // P2002 = unique-constraint violation. The only unique field we allow
    // changing here is `email`, so surface that as a clean 409 instead of
    // a generic 500 with an inscrutable Prisma stack.
    if (err?.code === 'P2002') {
      throw new AppError('Email already in use', 409);
    }
    throw err;
  }
}

export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  // ── 0. Snapshot every on-disk file we'll need to clean up ──────────────
  // Collected BEFORE row deletes so the join paths still resolve. The
  // unlink itself happens AFTER the DB succeeds (no point burning files
  // for a delete that ends up rolling back).
  const [scanReports, userAppraisals] = await Promise.all([
    prisma.fullReport.findMany({ where: { scan: { userId } }, select: { pdfUrl: true } }),
    prisma.appraisal.findMany({ where: { userId }, select: { pdfUrl: true } }),
  ]);
  const filesToUnlink: Array<string | null> = [
    user.logoUrl,
    user.originalLogoUrl,
    user.qrCodeUrl,
    ...scanReports.map((r) => r.pdfUrl),
    ...userAppraisals.map((a) => a.pdfUrl),
  ];

  // ── 1. Unpair GPS terminals ─────────────────────────────────────────────
  // Set ownerUserId to null and mark REVOKED so the gateway rejects future
  // auth until the admin re-provisions/reassigns. The DB has ON DELETE SET
  // NULL so this is technically redundant, but explicit unpair also flips
  // the status (matching the admin "Unpair" button behaviour).
  await prisma.gpsTerminal.updateMany({
    where: { ownerUserId: userId },
    data: { ownerUserId: null, status: 'REVOKED' },
  });

  // ── 2. Service appointments (RESTRICT FK → must delete before user) ────
  // GpsAlarm.serviceAppointmentId is SET NULL, so alarms referencing these
  // appointments auto-null their FK when the appointment row goes away.
  await prisma.serviceAppointment.deleteMany({ where: { userId } });

  // ── 3. Appraisals (no FK, indexed column — delete for data hygiene) ────
  await prisma.appraisal.deleteMany({ where: { userId } });

  // ── 4. Scan data (RESTRICT FK on both FullReport→Scan and Scan→User) ───
  await prisma.fullReport.deleteMany({ where: { scan: { userId } } });
  await prisma.scan.deleteMany({ where: { userId } });

  // ── 5. Device / VIN tracking (RESTRICT FK) ─────────────────────────────
  await prisma.userScannerDevice.deleteMany({ where: { userId } });
  await prisma.userVinUsage.deleteMany({ where: { userId } });

  // ── 6. Auth tokens (RESTRICT FK) ──────────────────────────────────────
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  // ── 7. Inspections (no FK, delete for data hygiene) ────────────────────
  await prisma.inspection.deleteMany({ where: { userId } });

  // ── 8. Delete user row ─────────────────────────────────────────────────
  // Remaining optional FKs auto-cascade at DB level:
  //   • MobilePushToken.userId → ON DELETE CASCADE
  //   • GpsCommand.userId → ON DELETE SET NULL
  //   • GpsAlarm.acknowledgedByUserId → ON DELETE SET NULL
  //   • Appraisal.userId / Inspection.userId → ON DELETE CASCADE
  //     (the explicit deleteMany calls above are kept for clarity; they're
  //      now redundant under the new FK but harmless and self-documenting.)
  await prisma.user.delete({ where: { id: userId } });

  // ── 9. Best-effort file cleanup ────────────────────────────────────────
  // PDFs + dealer logo / QR images. Deletion failures are logged but never
  // re-thrown — the row is already gone, an unlinkable file is recoverable
  // via the orphan-sweep script.
  await deleteLocalFiles(filesToUnlink);

  logger.info(`Admin deleted user: ${user.email}`);
}

// ── Scans CRUD ────────────────────────────────────────────────────────────────

export async function getScans(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [scans, total] = await Promise.all([
    prisma.scan.findMany({
      skip,
      take: limit,
      include: {
        user: { select: { id: true, email: true, fullName: true, isDealer: true } },
        fullReport: { select: { id: true, pdfUrl: true, totalReconditioningCost: true, additionalRepairsCost: true, createdAt: true } },
      },
      orderBy: { receivedAt: 'desc' },
    }),
    prisma.scan.count(),
  ]);
  return { scans, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getScanDetail(scanId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      user: { select: { id: true, email: true, fullName: true, isDealer: true } },
      fullReport: true,
    },
  });
  if (!scan) throw new AppError('Scan not found', 404);
  return scan;
}

export async function deleteScan(scanId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { fullReport: { select: { pdfUrl: true } } },
  });
  if (!scan) throw new AppError('Scan not found', 404);
  const pdfPath = scan.fullReport?.pdfUrl ?? null;
  await prisma.fullReport.deleteMany({ where: { scanId } });
  await prisma.scan.delete({ where: { id: scanId } });
  await deleteLocalFile(pdfPath);
  logger.info(`Admin deleted scan: ${scanId}`);
}

// ── Inspections ───────────────────────────────────────────────────────────────

export async function getInspections(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [inspections, total] = await Promise.all([
    prisma.inspection.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.inspection.count(),
  ]);
  return { inspections, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function deleteInspection(id: string) {
  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) throw new AppError('Inspection not found', 404);
  await prisma.inspection.delete({ where: { id } });
  logger.info(`Admin deleted inspection: ${id}`);
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [totalUsers, totalDealers, totalRegular, totalScans, totalReports, totalInspections, totalAppraisals, totalServiceAppointments, recentScans] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isDealer: true } }),
    prisma.user.count({ where: { isDealer: false } }),
    prisma.scan.count(),
    prisma.fullReport.count(),
    prisma.inspection.count(),
    prisma.appraisal.count(),
    prisma.serviceAppointment.count(),
    prisma.scan.findMany({
      take: 5,
      orderBy: { receivedAt: 'desc' },
      include: { user: { select: { email: true, fullName: true, isDealer: true } } },
    }),
  ]);
  return { totalUsers, totalDealers, totalRegular, totalScans, totalReports, totalInspections, totalAppraisals, totalServiceAppointments, recentScans };
}

// ── Appraisals ───────────────────────────────────────────────────────────────

export async function getAppraisals(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [appraisals, total] = await Promise.all([
    prisma.appraisal.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.appraisal.count(),
  ]);
  return { appraisals, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function deleteAppraisal(id: string) {
  const appraisal = await prisma.appraisal.findUnique({ where: { id } });
  if (!appraisal) throw new AppError('Appraisal not found', 404);
  const pdfPath = appraisal.pdfUrl;
  await prisma.appraisal.delete({ where: { id } });
  await deleteLocalFile(pdfPath);
  logger.info(`Admin deleted appraisal: ${id}`);
}

// ── Backup ────────────────────────────────────────────────────────────────────

/**
 * HIGH #16: backup OOM guardrail.
 *
 * The previous implementation `findMany()`'d every table unbounded and
 * serialised the result to JSON in one shot. With photos in
 * Appraisal.valuationData and rawPayload blobs on Scan, that OOMs the
 * Express process at modest dataset sizes.
 *
 * Now each table is capped at GET_FULL_BACKUP_LIMIT rows (newest first)
 * and the response includes a per-table `truncated` flag so the operator
 * can see the cap was hit and switch to a streaming `pg_dump` in those
 * cases. We also drop the `otps` collection — transient verification
 * data, not worth backing up.
 */
const GET_FULL_BACKUP_LIMIT = 50_000;

export async function getFullBackup() {
  const take = GET_FULL_BACKUP_LIMIT;
  const [
    users,
    scans,
    fullReports,
    scannerDevices,
    vinUsages,
    inspections,
    appraisals,
    serviceAppointments,
    counts,
  ] = await Promise.all([
    prisma.user.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: { usedScannerDevices: true, usedVins: true, serviceAppointments: true },
    }),
    prisma.scan.findMany({ take, orderBy: { receivedAt: 'desc' } }),
    prisma.fullReport.findMany({ take, orderBy: { createdAt: 'desc' } }),
    prisma.userScannerDevice.findMany({ take, orderBy: { lastUsedAt: 'desc' } }),
    prisma.userVinUsage.findMany({ take, orderBy: { lastUsedAt: 'desc' } }),
    prisma.inspection.findMany({ take, orderBy: { createdAt: 'desc' } }),
    prisma.appraisal.findMany({ take, orderBy: { createdAt: 'desc' } }),
    prisma.serviceAppointment.findMany({ take, orderBy: { createdAt: 'desc' } }),
    Promise.all([
      prisma.user.count(),
      prisma.scan.count(),
      prisma.fullReport.count(),
      prisma.userScannerDevice.count(),
      prisma.userVinUsage.count(),
      prisma.inspection.count(),
      prisma.appraisal.count(),
      prisma.serviceAppointment.count(),
    ]),
  ]);
  const [
    nUsers, nScans, nFullReports, nScannerDevices, nVinUsages,
    nInspections, nAppraisals, nServiceAppointments,
  ] = counts;

  const truncated = {
    users: nUsers > take,
    scans: nScans > take,
    fullReports: nFullReports > take,
    scannerDevices: nScannerDevices > take,
    vinUsages: nVinUsages > take,
    inspections: nInspections > take,
    appraisals: nAppraisals > take,
    serviceAppointments: nServiceAppointments > take,
  };

  if (Object.values(truncated).some(Boolean)) {
    logger.warn('getFullBackup: per-table cap hit; consider pg_dump', {
      cap: take,
      truncated,
    });
  }

  return {
    exportedAt: new Date().toISOString(),
    cap: take,
    truncated,
    data: { users, scans, fullReports, scannerDevices, vinUsages, inspections, appraisals, serviceAppointments },
  };
}

// ── Service Appointments ─────────────────────────────────────────────────────

export async function getServiceAppointments(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [appointments, total] = await Promise.all([
    prisma.serviceAppointment.findMany({
      skip,
      take: limit,
      include: { user: { select: { id: true, email: true, fullName: true, isDealer: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serviceAppointment.count(),
  ]);
  return { appointments, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function deleteServiceAppointment(id: string) {
  const apt = await prisma.serviceAppointment.findUnique({ where: { id } });
  if (!apt) throw new AppError('Service appointment not found', 404);
  await prisma.serviceAppointment.delete({ where: { id } });
  logger.info(`Admin deleted service appointment: ${id}`);
}

export async function completeServiceAppointment(id: string) {
  const apt = await prisma.serviceAppointment.findUnique({ where: { id } });
  if (!apt) throw new AppError('Service appointment not found', 404);
  if (apt.status === 'completed') throw new AppError('Appointment is already completed', 400);
  const updated = await prisma.serviceAppointment.update({
    where: { id },
    data: { status: 'completed' },
  });
  logger.info(`Admin completed service appointment: ${id}`);
  return updated;
}

export async function getAppraisalDetail(id: string) {
  const appraisal = await prisma.appraisal.findUnique({ where: { id } });
  if (!appraisal) throw new AppError('Appraisal not found', 404);
  return appraisal;
}

export async function sendAdminEmail(to: string, subject: string, body: string) {
  // MEDIUM #21: use the shared transporter from src/services/mailer.ts
  // instead of building a new one per call. Dynamic imports kept so the
  // dependency graph matches the original (no circular-import surprises
  // at load time).
  const { env } = await import('../config/env');
  const { EmailServiceUnavailableError, isSmtpAvailabilityError } = await import('../utils/errors');
  // CRITICAL #8: escape user-supplied `body` before HTML interpolation so an
  // admin who pastes attacker-supplied content can't relay live tags.
  const { escapeHtml } = await import('../utils/escape-html');
  const { transporter, ensureTransporterVerified } = await import('./mailer');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1B3A5F; color: #fff; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { background: #ffffff; padding: 28px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; padding: 16px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VinTraxx SmartScan</h1>
    </div>
    <div class="content">
      ${body ? escapeHtml(body).replace(/\n/g, '<br/>') : '<p>No message content.</p>'}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VinTraxx SmartScan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await ensureTransporterVerified();
    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html: htmlBody,
    });
  } catch (err) {
    // Classify provider outages so the admin controller can respond 503
    // instead of a generic 500 when SendGrid is exhausted / mis-auth'd.
    if (err instanceof EmailServiceUnavailableError) throw err;
    if (isSmtpAvailabilityError(err)) {
      throw new EmailServiceUnavailableError(
        err instanceof Error ? err.message : String(err),
      );
    }
    throw err;
  }

  logger.info('Admin email sent', { to, subject });
}
