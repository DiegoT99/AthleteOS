import express from 'express';
import dotenv from 'dotenv';
import webhooksRoutes from './routes/webhooks.routes.js';
import { app } from './app.js';

dotenv.config();

const server = express();

server.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.headers['content-type'] = 'application/json';
    next();
  },
  webhooksRoutes
);

server.use(app);

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  console.log(`AthleteOS API running on port ${PORT}`);
});
