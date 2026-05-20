import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import { assembleFullReport } from '../services/report.service';
import prisma from '../config/db';
import logger from '../utils/logger';

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Step 1 of admin login. Verifies email + password and triggers an OTP
 * email. Returns `{ otpRequired: true, email }` — does NOT issue a JWT
 * (see `verifyLoginOtp` below). Always-on 2FA per product decision.
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    logger.info('Admin login attempt', {
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      method: req.method,
      ip: req.ip,
    });

    const { email, password } = req.body;
    const result = await adminService.adminLoginRequestOtp(email, password);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

/**
 * Step 2 of admin login. Verifies the 6-digit OTP and, on success, returns
 * the admin session (token + admin profile).
 */
export async function verifyLoginOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body;
    const result = await adminService.verifyAdminLoginOtp(email, code);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await adminService.getAdminProfile(req.admin!.adminId);
    res.json({ success: true, admin: profile });
  } catch (err) { next(err); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    await adminService.changeAdminPassword(req.admin!.adminId, currentPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
}

export async function sendEmailChangeOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { newEmail } = req.body;
    await adminService.sendAdminEmailChangeOtp(req.admin!.adminId, newEmail);
    res.json({ success: true, message: 'OTP sent to new email' });
  } catch (err) { next(err); }
}

export async function verifyEmailChange(req: Request, res: Response, next: NextFunction) {
  try {
    const { newEmail, otp } = req.body;
    const result = await adminService.verifyAndChangeAdminEmail(req.admin!.adminId, newEmail, otp);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function dashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, stats });
  } catch (err) { next(err); }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const type = req.query.type as 'dealer' | 'regular' | undefined;
    const users = await adminService.getUsers(type);
    res.json({ success: true, users });
  } catch (err) { next(err); }
}

export async function getUserDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await adminService.getUserDetail(req.params.id as string);
    res.json({ success: true, user });
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await adminService.createUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await adminService.updateUser(req.params.id as string, req.body);
    res.json({ success: true, user });
  } catch (err) { next(err); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.deleteUser(req.params.id as string);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
}

// Admin-initiated password reset for a User. Gated by `requireSuperAdmin`
// in the route layer — non-super admins should not be able to silently
// rotate dealer credentials.
export async function resetUserPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.resetUserPassword(req.params.id as string, req.body.password);
    res.json({ success: true, message: 'Password reset' });
  } catch (err) { next(err); }
}

// ── Scans ─────────────────────────────────────────────────────────────────────

export async function listScans(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await adminService.getScans(page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getScanDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const scan = await adminService.getScanDetail(req.params.id as string);
    res.json({ success: true, scan });
  } catch (err) { next(err); }
}

export async function deleteScan(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.deleteScan(req.params.id as string);
    res.json({ success: true, message: 'Scan deleted' });
  } catch (err) { next(err); }
}

// ── Inspections ───────────────────────────────────────────────────────────────

export async function listInspections(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await adminService.getInspections(page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function deleteInspection(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.deleteInspection(req.params.id as string);
    res.json({ success: true, message: 'Inspection deleted' });
  } catch (err) { next(err); }
}

// ── Appraisals ───────────────────────────────────────────────────────────────

export async function listAppraisals(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await adminService.getAppraisals(page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function deleteAppraisal(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.deleteAppraisal(req.params.id as string);
    res.json({ success: true, message: 'Appraisal deleted' });
  } catch (err) { next(err); }
}

// ── Verify Password ──────────────────────────────────────────────────────────

export async function verifyPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { password } = req.body;
    await adminService.verifyAdminPassword(req.admin!.adminId, password);
    res.json({ success: true });
  } catch (err) { next(err); }
}

// ── Service Appointments ─────────────────────────────────────────────────────

export async function listServiceAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await adminService.getServiceAppointments(page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function deleteServiceAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.deleteServiceAppointment(req.params.id as string);
    res.json({ success: true, message: 'Service appointment deleted' });
  } catch (err) { next(err); }
}

export async function completeServiceAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await adminService.completeServiceAppointment(req.params.id as string);
    res.json({ success: true, appointment });
  } catch (err) { next(err); }
}

// ── Appraisal Detail ────────────────────────────────────────────────

export async function getAppraisalDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const appraisal = await adminService.getAppraisalDetail(req.params.id as string);
    res.json({ success: true, appraisal });
  } catch (err) { next(err); }
}

// ── Send Email ──────────────────────────────────────────────────────

export async function sendEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject) {
      res.status(400).json({ success: false, error: 'Recipient and subject are required.' });
      return;
    }
    await adminService.sendAdminEmail(to, subject, body || '');
    res.json({ success: true, message: 'Email sent successfully.' });
  } catch (err) {
    // Respond 503 when the email provider is down instead of leaking a 500.
    const { EmailServiceUnavailableError } = await import('../utils/errors');
    if (err instanceof EmailServiceUnavailableError) {
      res.status(503).json({ success: false, code: err.code, error: err.message });
      return;
    }
    next(err);
  }
}

// ── Admin Full Report (AI-analysed FullReportData) ────────────────────────────

/**
 * GET /admin/scans/:id/report — returns the assembled FullReportData for an
 * AI-promoted scan. Same shape as the user-facing GET /scan/report/:scanId but
 * with no ownership guard. Used by the Admin "Full Report" modal to display
 * the AI analysis after promotion.
 */
export async function getAdminScanReport(req: Request, res: Response, next: NextFunction) {
  try {
    const scanId = req.params.id as string;

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { fullReport: true, user: true },
    }) as any;

    if (!scan) {
      res.status(404).json({ success: false, error: 'Scan not found' });
      return;
    }

    if (scan.status === 'FAILED') {
      res.json({ success: true, status: 'failed', error: scan.errorMessage });
      return;
    }

    if (scan.status !== 'COMPLETED' || !scan.fullReport) {
      res.json({ success: true, status: 'processing' });
      return;
    }

    const fr = scan.fullReport;
    const aiOutput = fr.aiRawResponse as any;
    const additionalRepairsData = fr.additionalRepairsData as any[] | null;

    const reportData = assembleFullReport({
      scanId: scan.id,
      reportId: fr.id,
      vin: scan.vin,
      year: scan.vehicleYear,
      make: scan.vehicleMake,
      model: scan.vehicleModel,
      mileage: scan.mileage,
      milOn: scan.milOn,
      distanceSinceCleared: scan.distanceSinceCleared,
      userEmail: scan.user?.email ?? '',
      userFullName: scan.user?.fullName ?? undefined,
      scannerOwnerName: scan.userFullName ?? undefined,
      vehicleOwnerName: scan.vehicleOwnerName ?? undefined,
      aiOutput,
      stockNumber: scan.stockNumber ?? undefined,
      additionalRepairs: additionalRepairsData ?? undefined,
      additionalRepairsTotalCost: fr.additionalRepairsCost ?? 0,
      dealerLogoUrl: scan.user?.isDealer ? scan.user.logoUrl ?? undefined : undefined,
      dealerQrCodeUrl: scan.user?.isDealer ? scan.user.qrCodeUrl ?? undefined : undefined,
    });

    res.json({ success: true, status: 'completed', data: reportData });
  } catch (err) { next(err); }
}

// ── Backup ────────────────────────────────────────────────────────────────────

export async function backup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.getFullBackup();
    res.setHeader('Content-Disposition', `attachment; filename=vintraxx-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (err) { next(err); }
}
