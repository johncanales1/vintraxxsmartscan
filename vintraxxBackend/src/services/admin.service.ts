import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { APP_CONSTANTS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';
import { AdminJwtPayload } from '../middleware/adminAuth';
import { generateOtpCode } from '../utils/helpers';
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

export async function adminLogin(email: string, password: string) {
  logger.info('Admin login attempt', { email, hasPassword: !!password });
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

  const token = generateAdminToken({
    adminId: admin.id,
    email: admin.email,
    role: 'admin',
    superAdmin: admin.superAdmin,
  });
  logger.info(`Admin logged in: ${admin.email}`, { superAdmin: admin.superAdmin });
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

export async function getUsers(type?: 'dealer' | 'regular') {
  const where = type === 'dealer' ? { isDealer: true } : type === 'regular' ? { isDealer: false } : {};
  return prisma.user.findMany({
    where,
    include: {
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
    include: {
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

export async function createUser(data: {
  email: string;
  password: string;
  isDealer?: boolean;
  pricePerLaborHour?: number;
  logoUrl?: string;
  qrCodeUrl?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already exists', 409);

  const passwordHash = await bcrypt.hash(data.password, APP_CONSTANTS.BCRYPT_SALT_ROUNDS);

  let processedLogoUrl: string | null = null;
  let processedQrCodeUrl: string | null = null;

  if (data.logoUrl && data.logoUrl.startsWith('data:image/')) {
    processedLogoUrl = processBase64Image(data.logoUrl, LOGO_DIR, `admin-${Date.now()}`);
  } else if (data.logoUrl) {
    processedLogoUrl = data.logoUrl;
  }

  if (data.qrCodeUrl && data.qrCodeUrl.startsWith('data:image/')) {
    processedQrCodeUrl = processBase64Image(data.qrCodeUrl, QR_CODE_DIR, `admin-qr-${Date.now()}`);
  } else if (data.qrCodeUrl) {
    processedQrCodeUrl = data.qrCodeUrl;
  }

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      isDealer: data.isDealer ?? false,
      pricePerLaborHour: data.pricePerLaborHour,
      logoUrl: processedLogoUrl,
      qrCodeUrl: processedQrCodeUrl,
    },
  });
}

export async function updateUser(userId: string, data: {
  email?: string;
  isDealer?: boolean;
  pricePerLaborHour?: number | null;
  logoUrl?: string | null;
  qrCodeUrl?: string | null;
  maxScannerDevices?: number | null;
  maxVins?: number | null;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  return prisma.user.update({ where: { id: userId }, data });
}

export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  // Delete related records first
  await prisma.fullReport.deleteMany({ where: { scan: { userId } } });
  await prisma.scan.deleteMany({ where: { userId } });
  await prisma.userScannerDevice.deleteMany({ where: { userId } });
  await prisma.userVinUsage.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.inspection.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
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
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan) throw new AppError('Scan not found', 404);
  await prisma.fullReport.deleteMany({ where: { scanId } });
  await prisma.scan.delete({ where: { id: scanId } });
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
  await prisma.appraisal.delete({ where: { id } });
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
