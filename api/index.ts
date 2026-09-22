import express from 'express';
import { registerRoutes } from '../server/routes';
import { connectMongo } from '../server/database/mongoose';

const app = express();

app.use(async (_req, _res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    console.error('Serverless DB Connection Error:', err);
    next();
  }
});

registerRoutes(app);

export default app;
