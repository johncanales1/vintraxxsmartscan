import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import scanRoutes from './routes/scan.routes';
import logger from './utils/logger';

const app = express();

// Trust nginx reverse proxy headers for rate limiting
app.set('trust proxy', true);

app.use(helmet());
app.use(cors({ 
  origin: env.NODE_ENV === 'production' 
    ? ['https://app.vintraxx.com', 'https://vintraxx.com']
    : ['https://app.vintraxx.com', 'https://vintraxx.com', 'http://localhost:3000', 'capacitor://localhost', 'http://localhost'], 
  credentials: true 
}));
app.use(express.json({ limit: '5mb' }));

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/scan', scanRoutes);

app.use(errorHandler);

app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`VinTraxx backend running on 0.0.0.0:${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
