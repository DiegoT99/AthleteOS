import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import techniquesRoutes from './routes/techniques.routes.js';
import notesRoutes from './routes/notes.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import billingRoutes from './routes/billing.routes.js';
import profileRoutes from './routes/profile.routes.js';
import { requireAuth } from './middleware/auth.js';
import { requirePremium } from './middleware/requireSubscription.js';

export const app = express();

const allowedOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin);
  if (isLocalhost || origin === process.env.FRONTEND_URL) return callback(null, true);
  callback(new Error('Not allowed by CORS'));
};

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);

app.use('/api/categories', requireAuth, categoriesRoutes);
app.use('/api/subscription', requireAuth, subscriptionRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/profile', requireAuth, profileRoutes);
app.use('/api/billing', requireAuth, billingRoutes);

app.use('/api/sessions', requireAuth, requirePremium, sessionsRoutes);
app.use('/api/techniques', requireAuth, requirePremium, techniquesRoutes);
app.use('/api/notes', requireAuth, requirePremium, notesRoutes);
app.use('/api/goals', requireAuth, requirePremium, goalsRoutes);
app.use('/api/analytics', requireAuth, requirePremium, analyticsRoutes);
