/**
 * User-facing GPS routes — mounted at `/api/v1/gps`.
 *
 * Every endpoint here is gated by `authMiddleware` and operates on terminals
 * the requester OWNS. Cross-user access happens exclusively via the
 * `/api/v1/admin/gps/*` namespace which has its own admin auth middleware.
 *
 * Endpoints:
 *   GET  /terminals
 *   GET  /terminals/:id
 *   GET  /terminals/:id/latest
 *   GET  /terminals/:id/locations
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import * as gpsCtrl from '../controllers/gps.controller';
import {
  userTerminalIdParamsSchema,
  locationHistoryQuerySchema,
  listAlarmsQuerySchema,
  alarmIdParamsSchema,
  ackAlarmBodySchema,
  listDtcEventsQuerySchema,
  dtcEventIdParamsSchema,
  userTerminalTripsParamsSchema,
  userTerminalTripDetailParamsSchema,
  userTerminalStatsParamsSchema,
  registerPushTokenSchema,
  deletePushTokenSchema,
  renameTerminalSchema,
  userLocateTerminalSchema,
  userAnalyzeDtcEventSchema,
} from '../schemas/gps.schema';

const router = Router();

router.use(authMiddleware);

// Terminals
router.get('/terminals', gpsCtrl.myTerminals);
router.get(
  '/terminals/:id',
  validateRequest(userTerminalIdParamsSchema),
  gpsCtrl.myTerminalDetail,
);
router.get(
  '/terminals/:id/latest',
  validateRequest(userTerminalIdParamsSchema),
  gpsCtrl.myLatestLocation,
);
router.get(
  '/terminals/:id/locations',
  validateRequest(locationHistoryQuerySchema),
  gpsCtrl.myLocationHistory,
);

// Owner-only mutations on terminals (Phase 5: mobile)
router.patch(
  '/terminals/:id/label',
  validateRequest(renameTerminalSchema),
  gpsCtrl.myRenameTerminal,
);
router.post(
  '/terminals/:id/locate',
  validateRequest(userLocateTerminalSchema),
  gpsCtrl.myLocateTerminal,
);

// Trips + daily stats (Phase 3)
router.get(
  '/terminals/:id/trips',
  validateRequest(userTerminalTripsParamsSchema),
  gpsCtrl.myTerminalTrips,
);
router.get(
  '/terminals/:id/trips/:tripId',
  validateRequest(userTerminalTripDetailParamsSchema),
  gpsCtrl.myTerminalTripDetail,
);
router.get(
  '/terminals/:id/stats',
  validateRequest(userTerminalStatsParamsSchema),
  gpsCtrl.myTerminalDailyStats,
);

// Alarms (Phase 2)
router.get('/alarms', validateRequest(listAlarmsQuerySchema), gpsCtrl.myAlarms);
router.get(
  '/alarms/:id',
  validateRequest(alarmIdParamsSchema),
  gpsCtrl.myAlarmDetail,
);
router.post(
  '/alarms/:id/ack',
  validateRequest(ackAlarmBodySchema),
  gpsCtrl.myAckAlarm,
);

// DTC events (Phase 2)
router.get('/dtc-events', validateRequest(listDtcEventsQuerySchema), gpsCtrl.myDtcEvents);
router.get(
  '/dtc-events/:id',
  validateRequest(dtcEventIdParamsSchema),
  gpsCtrl.myDtcEventDetail,
);
// Phase 5: AI bridge — promote a GPS-DTC event into a Scan + report.
router.post(
  '/dtc-events/:id/analyze',
  validateRequest(userAnalyzeDtcEventSchema),
  gpsCtrl.myAnalyzeDtcEvent,
);

// Mobile push tokens (Phase 5)
router.post(
  '/devices/push-token',
  validateRequest(registerPushTokenSchema),
  gpsCtrl.myRegisterPushToken,
);
router.delete(
  '/devices/push-token',
  validateRequest(deletePushTokenSchema),
  gpsCtrl.myDeletePushToken,
);

export default router;
