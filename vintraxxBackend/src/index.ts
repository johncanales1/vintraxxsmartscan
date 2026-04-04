import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import scanRoutes from './routes/scan.routes';
import appraisalRoutes from './routes/appraisal.routes';
import dealerRoutes from './routes/dealer.routes';
import inspectionRoutes from './routes/inspection.routes';
import adminRoutes from './routes/admin.routes';
import logger from './utils/logger';

const app = express();

// Trust nginx reverse proxy headers for rate limiting
app.set('trust proxy', 1);

// Request logging middleware for debugging
app.use((req, res, next) => {
  logger.info('Incoming request', {
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
app.use('/assets', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'assets')));

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
      'https://app.vintraxx.com',
      'https://vintraxx.com', 
      'https://dev.vintraxx.com',
      'https://admin.vintraxx.com',
      'https://api.vintraxx.com'
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
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly for all routes
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
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

app.use(errorHandler);

app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`VinTraxx backend running on 0.0.0.0:${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
