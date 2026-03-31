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
import logger from './utils/logger';

const app = express();

// Trust nginx reverse proxy headers for rate limiting
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ 
  origin: env.NODE_ENV === 'production' 
    ? ['https://app.vintraxx.com', 'https://vintraxx.com', 'https://dev.vintraxx.com']
    : ['https://app.vintraxx.com', 'https://vintraxx.com', 'https://dev.vintraxx.com', 'http://localhost:3000', 'http://localhost:3001', 'capacitor://localhost', 'http://localhost'], 
  credentials: true 
}));
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

// Serve static assets (including dealer logos)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/appraisal', appraisalRoutes);
app.use('/api/v1/dealer', dealerRoutes);
app.use('/api/v1/inspection', inspectionRoutes);

app.use(errorHandler);

app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`VinTraxx backend running on 0.0.0.0:${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
