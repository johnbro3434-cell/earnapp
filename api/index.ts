import express from 'express';
import { registerRoutes } from '../server/routes';
import { connectMongo } from '../server/database/mongoose';

const app = express();

// Safe async middleware wrapper for Express 4
app.use((req, res, next) => {
  connectMongo()
    .then(() => next())
    .catch((err) => {
      console.error('Serverless DB Connection Error:', err);
      next();
    });
});

// Register Express API routes
registerRoutes(app);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Serverless Global Error:', err);
  res.status(500).json({
    error: err?.message || 'সার্ভারে একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  });
});

export default app;
