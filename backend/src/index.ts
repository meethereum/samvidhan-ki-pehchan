import express from 'express';
import cors from 'cors';
import pg from 'pg';
const { Pool } = pg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { AIService } from './ai-service.js';
import { logger, morganFormat } from './logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// ─── HTTP request / response logger ──────────────────────────────────────────
app.use(morgan(morganFormat));

// Log request body for POST/PUT/PATCH (redact sensitive fields)
app.use((req, _res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length) {
    const safe = { ...req.body };
    if (safe.apiKey)   safe.apiKey   = '***redacted***';
    if (safe.password) safe.password = '***redacted***';
    logger.debug(`${req.method} ${req.path} — request body`, safe);
  }
  next();
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }

  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (!username || !password) {
    return res.status(401).json({ message: 'Invalid credentials format' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (user && user.password && await bcrypt.compare(password, user.password)) {
      (req as any).user = user;
      next();
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error('Auth error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({ username: user.username });
});

// Hard ceiling for the entire /api/chat request (slightly above the RAG timeout)
const CHAT_REQUEST_TIMEOUT_MS = 110_000;

app.post('/api/chat', authMiddleware, async (req, res) => {
  const { history } = req.body;

  if (!history || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ message: 'Chat history is required and must be a non-empty array' });
  }

  let responded = false;
  const timeout = setTimeout(() => {
    if (!responded) {
      responded = true;
      res.status(504).json({ message: 'Request timed out. Please try again.' });
    }
  }, CHAT_REQUEST_TIMEOUT_MS);

  try {
    const reply = await AIService.getChatResponse(history);
    if (!responded) {
      responded = true;
      res.json({ reply });
    }
  } catch (error) {
    logger.error('Chat route error', error);
    if (!responded) {
      responded = true;
      res.status(500).json({ message: 'Error processing chat' });
    }
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(port, () => {
  logger.info(`Backend listening at http://localhost:${port}`);
});
