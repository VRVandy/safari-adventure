import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { animalRouter } from './routes/animal';

const app = express();
const port = Number(process.env.PORT ?? 3001);

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:8081')
  .split(',').map(s => s.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Rate limit: 20 requests per hour per IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
});

app.use('/api/animal', limiter, animalRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`Safari Adventure server running on http://localhost:${port}`);
});
