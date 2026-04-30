// Install JSON serialisers for `bigint` (e.g. GpsTerminal.lastAlarmBits) and
// Prisma `Decimal` (coordinates, speeds, distances) BEFORE any other module
// imports Prisma — the polyfill mutates global prototypes so all later
// `res.json(prismaRow)` calls are safe. See utils/json-bigint-decimal-polyfill
// for the rationale + safety guards.
import './utils/json-bigint-decimal-polyfill';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import http from 'http';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import authRoutes from './routes/auth.routes';
import scanRoutes from './routes/scan.routes';
import appraisalRoutes from './routes/appraisal.routes';
import dealerRoutes from './routes/dealer.routes';
import inspectionRoutes from './routes/inspection.routes';
import adminRoutes from './routes/admin.routes';
import scheduleRoutes from './routes/schedule.routes';
import debugRoutes from './routes/debug.routes';
import gpsRoutes from './routes/gps.routes';
import logger from './utils/logger';
import { getSmtpHealth, verifyTransporterAtBoot } from './services/appraisal-email.service';
import { startGpsEventListener, stopGpsEventListener } from './realtime/listener';
import { attachGpsWebSocket, wsHealth } from './realtime/wsServer';
import { startCronJobs, stopCronJobs } from './cron';

const app = express();

// Trust nginx reverse proxy headers for rate limiting
app.set('trust proxy', 1);

// Attach / propagate X-Request-Id (correlation ID) BEFORE any other middleware
// so every log line in this request has the same id as the mobile client.
app.use(requestIdMiddleware);

// Request logging middleware for debugging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  next();
});

// Serve static assets BEFORE helmet to avoid CORP blocking
// Add explicit CORS headers for cross-origin image loading
// Use src/assets as the persistent directory so uploaded files survive builds
const PERSISTENT_ASSETS_DIR = path.join(process.cwd(), 'src', 'assets');
app.use('/assets', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(PERSISTENT_ASSETS_DIR), express.static(path.join(__dirname, 'assets')));

// Serve PDF reports with CORS headers
app.use('/reports', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../reports')));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration - must be before routes
// MEDIUM #28: production allow-list now lives in env.CORS_ALLOWED_ORIGINS
// (env.ts has the default for back-compat). Localhost development origins
// are appended at runtime when NODE_ENV === 'development' so dev still
// works without setting the var.
const DEV_LOCALHOST_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'capacitor://localhost',
  'http://localhost',
];
const corsAllowedOrigins =
  env.NODE_ENV === 'development'
    ? [...env.CORS_ALLOWED_ORIGINS, ...DEV_LOCALHOST_ORIGINS]
    : env.CORS_ALLOWED_ORIGINS;
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (corsAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Request-Id'],
  exposedHeaders: ['Set-Cookie', 'X-Request-Id']
};
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly for all routes
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

/**
 * Mask a sender address (user@host → u***@host) for inclusion in /health.
 * We want ops to verify the configured sender after SMTP-key rotation without
 * leaking a full mailbox to anyone who can hit the endpoint.
 */
function maskEmail(email: string | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal =
    local.length <= 2 ? '*'.repeat(local.length) : `${local[0]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

app.get('/api/v1/health', async (req, res) => {
  const smtp = await getSmtpHealth();
  res.json({
    status: smtp.ok ? 'ok' : 'degraded',
    timestamp: Date.now(),
    requestId: req.requestId,
    smtp,
    mail: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      from: maskEmail(env.EMAIL_FROM),
      fromName: env.EMAIL_FROM_NAME,
    },
    env: env.NODE_ENV,
  });
});

// Root endpoint - serve API documentation HTML
app.get('/', (_req, res) => {
  const docsPath = path.join(__dirname, '../api-docs.html');
  res.sendFile(docsPath, (err) => {
    if (err) {
      logger.error('Error serving api-docs.html:', err);
      res.status(404).json({ error: 'API documentation not found' });
    }
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/appraisal', appraisalRoutes);
app.use('/api/v1/dealer', dealerRoutes);
app.use('/api/v1/inspection', inspectionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/debug', debugRoutes);
app.use('/api/v1/gps', gpsRoutes);

app.use(errorHandler);

// Use an explicit http.Server so the GPS WebSocket server can hook the
// `upgrade` event and share the same TCP port as the REST API. Browsers and
// the mobile app connect to wss://api.vintraxx.com<GPS_WS_PATH>?token=...
const httpServer = http.createServer(app);
const wss = attachGpsWebSocket(httpServer);

httpServer.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`VinTraxx backend running on 0.0.0.0:${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`GPS WebSocket mounted at ${env.GPS_WS_PATH}`);
  // Kick off a one-time SMTP verify so ops can see at boot whether the email
  // provider is healthy. Non-blocking: a failure here does not prevent the
  // API from serving traffic (persist-first flow still works).
  void verifyTransporterAtBoot().then((ok) => {
    logger.info('SMTP readiness check complete', { smtpReady: ok });
  });
  // Open the long-lived Postgres LISTEN client so gateway-emitted NOTIFYs
  // start flowing into the WebSocket fan-out. Failures here are logged and
  // retried with exponential backoff inside the listener itself.
  void startGpsEventListener().catch((err) => {
    logger.error('startGpsEventListener failed at boot', {
      err: (err as Error).message,
    });
  });
  // Schedule recurring jobs (heartbeat watchdog, future retention sweeps).
  startCronJobs();
});

// Graceful shutdown — stop accepting new HTTP/WS connections, drain cron and
// the LISTEN client, then let the process exit naturally.
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, beginning graceful shutdown`);
  stopCronJobs();
  try {
    await stopGpsEventListener();
  } catch (err) {
    logger.warn('stopGpsEventListener failed', { err: (err as Error).message });
  }
  try {
    wss.close();
  } catch (err) {
    logger.warn('wss.close failed', { err: (err as Error).message });
  }
  httpServer.close(() => {
    logger.info('HTTP server closed; exiting');
    process.exit(0);
  });
  // Hard-exit after 10s if anything refuses to close.
  setTimeout(() => {
    logger.warn('Forcing process exit after shutdown timeout');
    process.exit(1);
  }, 10_000).unref();
}
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

// Re-export wsHealth so future endpoints (or operator scripts) can poke at
// "how many WS clients are connected right now" without importing wsServer
// directly.
export { wsHealth };

export default app;
