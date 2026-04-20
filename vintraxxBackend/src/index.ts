import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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
import logger from './utils/logger';
import { getSmtpHealth, verifyTransporterAtBoot } from './services/appraisal-email.service';

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
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'https://dev.vintraxx.com',
      'https://admin.vintraxx.com',
      'https://api.vintraxx.com',
      'https://capital.vintraxx.com',
      'https://dealer.vintraxx.com'
    ];
    
    // Add localhost origins for development
    if (env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:3002',
        'capacitor://localhost',
        'http://localhost'
      );
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Request-Id'],
  exposedHeaders: ['Set-Cookie', 'X-Request-Id']
};
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly for all routes
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

app.get('/api/v1/health', async (req, res) => {
  const smtp = await getSmtpHealth();
  res.json({
    status: smtp.ok ? 'ok' : 'degraded',
    timestamp: Date.now(),
    requestId: req.requestId,
    smtp,
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

app.use(errorHandler);

app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`VinTraxx backend running on 0.0.0.0:${env.PORT} [${env.NODE_ENV}]`);
  // Kick off a one-time SMTP verify so ops can see at boot whether the email
  // provider is healthy. Non-blocking: a failure here does not prevent the
  // API from serving traffic (persist-first flow still works).
  void verifyTransporterAtBoot().then((ok) => {
    logger.info('SMTP readiness check complete', { smtpReady: ok });
  });
});

export default app;
