import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { runMigrations } from './db/index';
import chatRouter from './routes/chat.routes';
import scamRouter from './routes/scam.routes';
import authRouter from './routes/auth.routes';
import guidesRouter from './routes/guides.routes';
import adminRouter from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Vercel's proxy for correct rate limiting IP detection
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Disable all strict validation to prevent crashes on Vercel's infrastructure
    validate: false,
  })
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/scam', scamRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/admin', adminRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (only if not in serverless environment)
async function start() {
  try {
    console.log('⏳ Attempting database migrations...');
    runMigrations().then(() => {
      console.log('✅ Database migrations successful');
    }).catch((error) => {
      console.warn('⚠️ Database migration failed:', error instanceof Error ? error.message : error);
    });
  } catch (error) {
    console.error('Migration startup error:', error);
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`🚀 FreelanceClarity backend running on http://localhost:${PORT}`);
    });
  }
}

start();

export default app;
