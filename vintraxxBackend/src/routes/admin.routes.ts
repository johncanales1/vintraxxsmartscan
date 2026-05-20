import { Router } from 'express';
import { adminAuthMiddleware, requireSuperAdmin } from '../middleware/adminAuth';
import { adminAuditMiddleware } from '../middleware/adminAuditLog';
import * as adminCtrl from '../controllers/admin.controller';
import * as gpsCtrl from '../controllers/gps.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  provisionTerminalSchema,
  reassignTerminalSchema,
  terminalIdParamsSchema,
  updateTerminalSchema,
  listTerminalsQuerySchema,
  listAlarmsQuerySchema,
  alarmIdParamsSchema,
  ackAlarmBodySchema,
  listDtcEventsQuerySchema,
  dtcEventIdParamsSchema,
  listTripsQuerySchema,
  tripIdParamsSchema,
  dailyStatsQuerySchema,
  enqueueCommandBodySchema,
  listCommandsQuerySchema,
  commandIdParamsSchema,
  scanReportIdParamsSchema,
  listScanReportsQuerySchema,
  emailScanReportSchema,
} from '../schemas/gps.schema';
import {
  adminTerminalLocationsQuerySchema,
  adminTerminalObdQuerySchema,
  adminAnalyzeDtcEventSchema,
  adminBulkAckAlarmsSchema,
  adminListAuditLogsQuerySchema,
  auditLogIdParamsSchema,
  adminBulkDeleteSchema,
} from '../schemas/gps-admin.schema';
import {
  createUserBodySchema,
  updateUserBodySchema,
  resetUserPasswordBodySchema,
} from '../schemas/admin-user.schema';
import {
  adminLoginBodySchema,
  adminLoginVerifyOtpBodySchema,
} from '../schemas/admin-auth.schema';

const router = Router();

// Public — two-step login. Step 1 verifies password and emails an OTP;
// step 2 verifies the OTP and issues the JWT. Always-on 2FA.
router.post('/login', validateRequest(adminLoginBodySchema), adminCtrl.login);
router.post(
  '/login/verify-otp',
  validateRequest(adminLoginVerifyOtpBodySchema),
  adminCtrl.verifyLoginOtp,
);

// Protected
router.use(adminAuthMiddleware);
// Cross-cutting audit log — records every successful POST/PATCH/PUT/DELETE.
router.use(adminAuditMiddleware);

// Profile / Settings
router.get('/profile', adminCtrl.getProfile);
router.put('/password', adminCtrl.changePassword);
router.post('/email-change/send-otp', adminCtrl.sendEmailChangeOtp);
router.post('/email-change/verify', adminCtrl.verifyEmailChange);

// Dashboard
router.get('/dashboard', adminCtrl.dashboardStats);

// Users CRUD
router.get('/users', adminCtrl.listUsers);
router.get('/users/:id', adminCtrl.getUserDetail);
router.post('/users', validateRequest(createUserBodySchema), adminCtrl.createUser);
router.put('/users/:id', validateRequest(updateUserBodySchema), adminCtrl.updateUser);
// Destructive user delete cascades through scans/reports/devices — gate to
// super-admins only, matching the symmetric `DELETE /gps/terminals/:id`.
router.delete('/users/:id', requireSuperAdmin, adminCtrl.deleteUser);
// Password reset is also gated to super-admins: a non-super admin should
// never be able to silently take over a dealer's session by rotating their
// credentials.
router.post(
  '/users/:id/reset-password',
  requireSuperAdmin,
  validateRequest(resetUserPasswordBodySchema),
  adminCtrl.resetUserPassword,
);

// Scans
router.get('/scans', adminCtrl.listScans);
router.get('/scans/:id', adminCtrl.getScanDetail);
router.get('/scans/:id/report', adminCtrl.getAdminScanReport);
router.delete('/scans/:id', adminCtrl.deleteScan);

// Inspections
router.get('/inspections', adminCtrl.listInspections);
router.delete('/inspections/:id', adminCtrl.deleteInspection);

// Appraisals
router.get('/appraisals', adminCtrl.listAppraisals);
router.get('/appraisals/:id', adminCtrl.getAppraisalDetail);
router.delete('/appraisals/:id', adminCtrl.deleteAppraisal);

// Service Appointments
router.get('/service-appointments', adminCtrl.listServiceAppointments);
router.patch('/service-appointments/:id/complete', adminCtrl.completeServiceAppointment);
router.delete('/service-appointments/:id', adminCtrl.deleteServiceAppointment);

// Send Email
router.post('/send-email', adminCtrl.sendEmail);

// Verify Password
router.post('/verify-password', adminCtrl.verifyPassword);

// Backup
router.get('/backup', adminCtrl.backup);

// ── GPS Telemetry (Phase 0: terminal CRUD + overview counters) ─────────────
router.get('/gps/stats/overview', gpsCtrl.adminOverviewStats);
router.get('/gps/terminals', validateRequest(listTerminalsQuerySchema), gpsCtrl.adminListTerminals);
router.post('/gps/terminals', validateRequest(provisionTerminalSchema), gpsCtrl.adminProvisionTerminal);
router.get('/gps/terminals/:id', validateRequest(terminalIdParamsSchema), gpsCtrl.adminGetTerminal);
router.patch(
  '/gps/terminals/:id/owner',
  validateRequest(reassignTerminalSchema),
  gpsCtrl.adminReassignTerminal,
);
// Edit terminal metadata (everything except the immutable deviceIdentifier).
// Non-destructive — no super-admin gate.
router.patch(
  '/gps/terminals/:id',
  validateRequest(updateTerminalSchema),
  gpsCtrl.adminUpdateTerminal,
);
router.post(
  '/gps/terminals/:id/unpair',
  validateRequest(terminalIdParamsSchema),
  gpsCtrl.adminUnpairTerminal,
);
router.delete(
  '/gps/terminals/:id',
  requireSuperAdmin,
  validateRequest(terminalIdParamsSchema),
  gpsCtrl.adminDeleteTerminal,
);

// Admin: per-terminal latest / locations / OBD (admin variants of the
// user-scoped endpoints — no ownership filter).
router.get(
  '/gps/terminals/:id/latest',
  validateRequest(terminalIdParamsSchema),
  gpsCtrl.adminGetTerminalLatest,
);
router.get(
  '/gps/terminals/:id/locations',
  validateRequest(adminTerminalLocationsQuerySchema),
  gpsCtrl.adminListTerminalLocations,
);
router.get(
  '/gps/terminals/:id/obd',
  validateRequest(adminTerminalObdQuerySchema),
  gpsCtrl.adminListTerminalObd,
);

// Admin: alarms (Phase 2)
router.get('/gps/alarms', validateRequest(listAlarmsQuerySchema), gpsCtrl.adminListAlarms);
router.get(
  '/gps/alarms/:id',
  validateRequest(alarmIdParamsSchema),
  gpsCtrl.adminGetAlarm,
);
router.post(
  '/gps/alarms/:id/ack',
  validateRequest(ackAlarmBodySchema),
  gpsCtrl.adminAckAlarm,
);
// Bulk-ack — accepts an array of alarm ids in the body, idempotent per id.
router.post(
  '/gps/alarms/ack-bulk',
  validateRequest(adminBulkAckAlarmsSchema),
  gpsCtrl.adminBulkAckAlarms,
);

// Admin: DTC events (Phase 2)
router.get(
  '/gps/dtc-events',
  validateRequest(listDtcEventsQuerySchema),
  gpsCtrl.adminListDtcEvents,
);
router.get(
  '/gps/dtc-events/:id',
  validateRequest(dtcEventIdParamsSchema),
  gpsCtrl.adminGetDtcEvent,
);
// Admin "Generate AI Report" bridge — promotes a DTC event into a Scan and
// kicks off the existing AI pipeline on the owner's behalf.
router.post(
  '/gps/dtc-events/:id/analyze',
  validateRequest(adminAnalyzeDtcEventSchema),
  gpsCtrl.adminAnalyzeDtcEvent,
);

// Admin: trips + daily stats (Phase 3)
router.get('/gps/trips', validateRequest(listTripsQuerySchema), gpsCtrl.adminListTrips);
router.get(
  '/gps/trips/:id',
  validateRequest(tripIdParamsSchema),
  gpsCtrl.adminGetTrip,
);
router.get(
  '/gps/stats/daily',
  validateRequest(dailyStatsQuerySchema),
  gpsCtrl.adminListDailyStats,
);

// Admin: commands (Phase 4)
router.post(
  '/gps/terminals/:id/commands',
  validateRequest(enqueueCommandBodySchema),
  gpsCtrl.adminEnqueueCommand,
);
router.get(
  '/gps/commands',
  validateRequest(listCommandsQuerySchema),
  gpsCtrl.adminListCommands,
);
router.get(
  '/gps/commands/:id',
  validateRequest(commandIdParamsSchema),
  gpsCtrl.adminGetCommand,
);

// Admin: GPS Full Scan Reports (Phase 5+)
router.post(
  '/gps/terminals/:id/scan',
  validateRequest(terminalIdParamsSchema),
  gpsCtrl.adminRequestScanReport,
);
router.get(
  '/gps/terminals/:id/scan-reports',
  validateRequest(listScanReportsQuerySchema),
  gpsCtrl.adminListScanReports,
);
router.get(
  '/gps/scan-reports/:id',
  validateRequest(scanReportIdParamsSchema),
  gpsCtrl.adminGetScanReport,
);
router.post(
  '/gps/scan-reports/:id/email',
  validateRequest(emailScanReportSchema),
  gpsCtrl.adminEmailScanReport,
);
router.post(
  '/gps/scan-reports/:id/promote-ai',
  validateRequest(scanReportIdParamsSchema),
  gpsCtrl.adminPromoteScanToAi,
);

// Admin: audit log read (powers Settings → Audit Log tab). Available to any
// authenticated admin — auditing is collaborative, not super-admin-only.
router.get(
  '/audit-logs',
  validateRequest(adminListAuditLogsQuerySchema),
  gpsCtrl.adminListAuditLogs,
);
// Super-admin only. The audit middleware DELIBERATELY does NOT record this
// delete (would make every clear self-perpetuate as a new DELETE row, and
// from the operator's POV the list would never shrink). `requireSuperAdmin`
// upstream is the only gate.
router.delete(
  '/audit-logs/:id',
  requireSuperAdmin,
  validateRequest(auditLogIdParamsSchema),
  gpsCtrl.adminDeleteAuditLog,
);

// ── Admin: bulk-delete (super-admin only) ──────────────────────────────────
//
// Each endpoint takes `{ ids: string[] }` (max 1000 uuids per call) and
// deletes every matching row in one Prisma `deleteMany`. Cascades through
// the FK ON DELETE rules in `schema.prisma`. The audit middleware records
// one row per POST; per-id provenance is the deletion itself (the row is
// gone, so the audit trail is the only forensic record).
router.post(
  '/gps/locations/bulk-delete',
  requireSuperAdmin,
  validateRequest(adminBulkDeleteSchema),
  gpsCtrl.adminBulkDeleteLocations,
);
router.post(
  '/gps/obd/bulk-delete',
  requireSuperAdmin,
  validateRequest(adminBulkDeleteSchema),
  gpsCtrl.adminBulkDeleteObd,
);
router.post(
  '/gps/alarms/bulk-delete',
  requireSuperAdmin,
  validateRequest(adminBulkDeleteSchema),
  gpsCtrl.adminBulkDeleteAlarms,
);
router.post(
  '/gps/dtc-events/bulk-delete',
  requireSuperAdmin,
  validateRequest(adminBulkDeleteSchema),
  gpsCtrl.adminBulkDeleteDtcEvents,
);
router.post(
  '/gps/trips/bulk-delete',
  requireSuperAdmin,
  validateRequest(adminBulkDeleteSchema),
  gpsCtrl.adminBulkDeleteTrips,
);
router.post(
  '/gps/commands/bulk-delete',
  requireSuperAdmin,
  validateRequest(adminBulkDeleteSchema),
  gpsCtrl.adminBulkDeleteCommands,
);
router.post(
  '/gps/terminals/bulk-delete',
  requireSuperAdmin,
  validateRequest(adminBulkDeleteSchema),
  gpsCtrl.adminBulkDeleteTerminals,
);
router.post(
  '/gps/scan-reports/bulk-delete',
  requireSuperAdmin,
  validateRequest(adminBulkDeleteSchema),
  gpsCtrl.adminBulkDeleteScanReports,
);

export default router;
