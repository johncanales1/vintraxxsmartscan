import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import * as adminCtrl from '../controllers/admin.controller';

const router = Router();

// Public
router.post('/login', adminCtrl.login);

// Protected
router.use(adminAuthMiddleware);

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
router.post('/users', adminCtrl.createUser);
router.put('/users/:id', adminCtrl.updateUser);
router.delete('/users/:id', adminCtrl.deleteUser);

// Scans
router.get('/scans', adminCtrl.listScans);
router.get('/scans/:id', adminCtrl.getScanDetail);
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

export default router;
